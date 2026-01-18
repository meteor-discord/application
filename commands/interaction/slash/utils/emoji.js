const { emojipedia, emojiKitchen } = require('#api');

const { createEmbed, formatPaginationEmbeds } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { pill, timestamp, icon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS, STATIC_ASSETS } = require('#utils/statics');

const { ingest } = require('#logging');

const { Utils } = require('detritus-client');
const {
  InteractionCallbackTypes,
  ApplicationCommandOptionTypes,
  DiscordRegexNames,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');
const { Components, Snowflake } = require('detritus-client/lib/utils');
const { PERMISSION_GROUPS, EMOJIPEDIA_PLATFORM_PRIORITY } = require('#constants');
const { paginator } = require('#client');

const onlyEmoji = require('emoji-aware').onlyEmoji;

function toCodePoint(unicodeSurrogates, sep) {
  var r = [],
    c = 0,
    p = 0,
    i = 0;
  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      r.push((0x10000 + ((p - 0xd800) << 10) + (c - 0xdc00)).toString(16));
      p = 0;
    } else if (0xd800 <= c && c <= 0xdbff) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join(sep || '-');
}

module.exports = {
  name: 'emoji',
  description: 'Turn emoji into images. Supports both built-in and custom emoji.',
  metadata: {
    use_custom_ingest: true,
  },
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'emoji',
      description: 'Emoji to enlarge. Use two built-in emoji to mix them.',
      type: ApplicationCommandOptionTypes.STRING,
      required: true,
    },
    {
      name: 'incognito',
      description: 'Makes the response only visible to you.',
      type: ApplicationCommandOptionTypes.BOOLEAN,
      required: false,
      default: false,
    },
  ],
  run: async (context, args) => {
    await acknowledge(context, args.incognito, [...PERMISSION_GROUPS.baseline_slash]);

    const { matches } = Utils.regex(DiscordRegexNames.EMOJI, args.emoji);
    embeds = [];
    if (matches.length) {
      let pages = [];
      let entries = [];
      for (const m of matches) {
        if (entries.map(e => e.id).includes(m.id)) continue;
        entries.push(m);
      }

      while (entries.length) {
        let sprites = entries.splice(0, 4);
        let embeds = [];
        for (const s of sprites) {
          let fields = sprites.map(s => {
            return {
              inline: true,
              name: `${icon('emoji')} \\:${s.name}\\:`,
              value: `-# ID: ${s.id}\n-# Created ${timestamp(Snowflake.timestamp(s.id), 'R')}`,
            };
          });
          if (fields.length >= 3) {
            fields.splice(2, 0, { name: ` `, value: ` `, inline: true });
            if (fields.length == 5) fields.push({ name: ` `, value: ` `, inline: true });
          }
          embeds.push(
            createEmbed('default', context, {
              url: 'https://lajczi.dev',
              fields,
              image: {
                url: `https://cdn.discordapp.com/emojis/${s.id}${s.animated ? '.webp' : '.png'}?size=4096${s.animated ? '&animated=true' : ''}`,
              },
            })
          );
        }
        pages.push({
          embeds,
        });
      }

      return await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
      });
    } else {
      const emoji = onlyEmoji(args.emoji);

      if (!emoji) {
        return editOrReply(context, createEmbed('warning', context, 'No emoji found.'));
      }

      // Emoji Mixing
      if (emoji.length >= 2) {
        if (emoji.length >= 3)
          return editOrReply(context, createEmbed('warning', context, 'You cannot mix more than two emoji.'));

        try {
          let em = await emojiKitchen(emoji);
          if (!em.body.results[0]) {
            for (const em of emoji) {
              try {
                await emojiKitchen([em]);
              } catch (e) {
                return editOrReply(context, createEmbed('warning', context, `Unsupported Emoji (${em})`));
              }
            }

            return editOrReply(context, createEmbed('error', context, 'Combination not supported.'));
          }
          return editOrReply(context, createEmbed('image', context, { url: em.body.results[0].url }));
        } catch (e) {
          return editOrReply(context, createEmbed('error', context, 'Unable to mix emoji.'));
        }
      }

      // Regular Emoji Handling
      if (emoji.length === 0)
        return await editOrReply(context, createEmbed('warning', context, 'You need to specify an emoji to enlarge.'));

      let res;
      try {
        res = await emojipedia(context, emoji[0]);
        res = res.response.body;
      } catch (e) {
        return await editOrReply(context, createEmbed('error', context, `No emoji data available for ${emoji[0]}.`));
      }

      if (Object.keys(res.data.platforms).length === 0)
        return await editOrReply(context, createEmbed('error', context, 'No images available for this emoji.'));

      let currentPlatform;

      for (const k of EMOJIPEDIA_PLATFORM_PRIORITY) {
        if (!currentPlatform && res.data.platforms[k]) currentPlatform = k;
      }
      if (!currentPlatform && Object.keys(res.data.platforms).length >= 1)
        currentPlatform = Object.keys(res.data.platforms)[0];

      console.log(currentPlatform);
      // This handles selecting the correct "default" platform for enlarge.
      if (res.data.platforms['discord']) currentPlatform = 'discord';

      // Use the high-res emojipedia icon, if available
      let ico;
      for (const k of EMOJIPEDIA_PLATFORM_PRIORITY) {
        if (!ico && res.data.platforms[k]) ico = res.data.platforms[k].images[0].src;
      }
      if (!ico && Object.values(res.data.platforms).length >= 1)
        ico = Object.values(res.data.platforms)[0].images[0].src;

      const DEFAULT_PLATFORM = currentPlatform;

      let currentView;
      let currentRevision = '';

      const components = new Components({
        timeout: 100000,
        run: async ctx => {
          if (ctx.userId !== context.userId) return await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

          // this sucks but works, ensures the newly selected option stays selected
          // update 25/03/24 - it sucks even more now

          if (ctx.data.customId === 'emoji-type') {
            currentPlatform = ctx.data.values[0];
            currentRevision = res.data.platforms[currentPlatform].images[0].id;

            for (let i = 0; i < components.components[0].components[0].options.length; i++) {
              components.components[0].components[0].options[i].default =
                components.components[0].components[0].options[i].value === currentPlatform;
            }

            components.components[1].components[0].options = res.data.platforms[currentPlatform].images.map(r => {
              return {
                label: r.version,
                value: r.id,
                default: r.id === res.data.platforms[currentPlatform].images[0].id,
              };
            });
          } else if (ctx.data.customId === 'emoji-version') {
            for (let i = 0; i < components.components[1].components[0].options.length; i++) {
              components.components[1].components[0].options[i].default =
                components.components[1].components[0].options[i].value === ctx.data.values[0];
            }
            currentRevision = ctx.data.values[0];
          }

          const emojiAsset = res.data.platforms[currentPlatform].images.filter(p => {
            return p.id === currentRevision;
          });

          currentView = createEmbed('default', context, {
            author: {
              iconUrl: ico,
              name: `${res.data.name} • ${emojiAsset[0].version}`,
              url: res.data.link,
            },
            description: res.data.codes.map(c => pill(c)).join(' '),
            image: {
              url: emojiAsset[0].src || STATIC_ASSETS.emoji_placeholder,
            },
            footer: {
              iconUrl: STATICS.emojipedia,
              text: `Emojipedia • ${context.application.name}`,
            },
          });

          await ctx.editOrRespond({ embeds: [currentView], components });
        },
      });

      let selectOptions = res.data.platforms[currentPlatform].images.map(r => {
        return {
          label: r.version,
          value: r.id,
          default: r.id === res.data.platforms[DEFAULT_PLATFORM].images[0].id,
        };
      });

      currentRevision = res.data.platforms[DEFAULT_PLATFORM].images[0].id;

      // This ensures our priority platforms are always included in the response.
      let platforms = Object.keys(res.data.platforms).sort((a, b) => {
        return Number(EMOJIPEDIA_PLATFORM_PRIORITY.includes(b)) - Number(EMOJIPEDIA_PLATFORM_PRIORITY.includes(a));
      });

      let selectTypeOptions = platforms
        .splice(0, 25)
        .sort()
        .map(r => {
          let pl = res.data.platforms[r];
          return {
            label: pl.name,
            value: r,
            default: r === DEFAULT_PLATFORM,
          };
        });

      components.addSelectMenu({
        defaultValues: [],
        placeholder: 'Select platform type',
        customId: 'emoji-type',
        options: selectTypeOptions,
        disabled: res.data.platforms.length === 1,
      });

      components.addSelectMenu({
        defaultValues: [],
        placeholder: 'Select emoji revision',
        customId: 'emoji-version',
        options: selectOptions,
        disabled: res.data.platforms[DEFAULT_PLATFORM].images.length === 1,
      });

      currentView = createEmbed('default', context, {
        author: {
          iconUrl: ico,
          name: `${res.data.name} • ${res.data.platforms[DEFAULT_PLATFORM].images[0].version}`,
          url: res.data.link,
        },
        description: res.data.codes.map(c => pill(c)).join(' '),
        image: {
          url: res.data.platforms[DEFAULT_PLATFORM].images[0].src || STATIC_ASSETS.emoji_placeholder,
        },
        footer: {
          iconUrl: STATICS.emojipedia,
          text: `Emojipedia • ${context.application.name}`,
        },
      });
      return editOrReply(context, { embeds: [currentView], components });
    }
  },
};
