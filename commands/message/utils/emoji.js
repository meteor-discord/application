const { emojipedia, emojiKitchen } = require('#api');
const {
  EMOJIPEDIA_PLATFORM_TYPES,
  EMOJIPEDIA_PLATFORM_TYPE_ALIASES,
  PERMISSION_GROUPS,
  EMOJIPEDIA_PLATFORM_PRIORITY,
} = require('#constants');
const { ingest } = require('#logging');

const { createEmbed, formatPaginationEmbeds } = require('#utils/embed');
const { pill, iconPill, highlight, timestamp, smallIconPill, icon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS, STATIC_ASSETS } = require('#utils/statics');

const { Utils } = require('detritus-client');
const { Components, Snowflake } = require('detritus-client/lib/utils');
const { InteractionCallbackTypes, DiscordRegexNames } = require('detritus-client/lib/constants');
const { acknowledge } = require('#utils/interactions');
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
  label: 'emoji',
  name: 'emoji',
  aliases: ['e', 'emote', 'enlarge', 'em', 'emojimix', 'emojikitchen'],
  metadata: {
    description: `${smallIconPill('reply', 'Supports Replies')}\n\nDisplays information about emoji. Supports regular emoji, discord emoji and stickers.\nAlso supports replies.\n\nUsing two emoji will mix them together.`,
    description_short: 'Get emoji/sticker source images, mix two emoji together.',
    examples: ['e 😀', 'emojimix 🐱 🍞'],
    category: 'utils',
    usage: 'emoji <emoji> [<emoji to mix>]',
    use_custom_ingest: true,
    slashCommand: 'emoji',
  },
  args: [{ name: 'type', default: 'twitter', type: 'string', help: `Emoji platform type` }],
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    let msg = context.message;
    if (context.message.messageReference) {
      msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId);
      args.emoji = msg.content;
    }

    // Stickers
    if (msg.stickerItems.length) {
      let s = msg.stickerItems.first();
      // lottie
      if (s.formatType == 3)
        return editOrReply(
          context,
          createEmbed('default', context, {
            fields: [
              {
                name: `${icon('sticker')} ${s.name}`,
                value: `\n-# ID: ${s.id}\n-# Created at ${timestamp(Snowflake.timestamp(s.id), 'R')}\n\nhttps://cdn.discordapp.com/stickers/${s.id}.json`,
              },
            ],
          })
        );
      // gif
      if (s.formatType == 4)
        return editOrReply(
          context,
          createEmbed('default', context, {
            fields: [
              {
                name: `${icon('sticker')} ${s.name}`,
                value: `\n-# ID: ${s.id}\n-# Created at ${timestamp(Snowflake.timestamp(s.id), 'R')}`,
              },
            ],
            image: {
              url: `https://media.discordapp.net/stickers/${s.id}.gif?size=4096`,
            },
          })
        );
      return editOrReply(
        context,
        createEmbed('default', context, {
          fields: [
            {
              name: `${icon('sticker')} ${s.name}`,
              value: `\n-# ID: ${s.id}\n-# Created at ${timestamp(Snowflake.timestamp(s.id), 'R')}`,
            },
          ],
          image: {
            url: `https://media.discordapp.net/stickers/${s.id}.png?size=4096&passthrough=true`,
          },
        })
      );
    }

    let { matches } = Utils.regex(DiscordRegexNames.EMOJI, args.emoji);
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
              value: `-# ID: ${s.id}\n-# Created ${timestamp(Snowflake.timestamp(s.id), 'R')}${context.guild.emojis.find(e => e.id == matches[0].id) ? '\n-# Custom emoji is from this server' : ''}`,
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
        try {
          if (emoji.length >= 3)
            return editOrReply(context, createEmbed('warning', context, 'You cannot mix more than two emoji.'));

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
      if (emoji.length == 0)
        return await editOrReply(context, createEmbed('warning', context, 'You need to specify an emoji to enlarge.'));

      args.type = args.type.toLowerCase();

      if (!EMOJIPEDIA_PLATFORM_TYPES.includes(args.type) && EMOJIPEDIA_PLATFORM_TYPE_ALIASES[args.type])
        args.type = EMOJIPEDIA_PLATFORM_TYPE_ALIASES[args.type];

      let res;
      try {
        res = await emojipedia(context, emoji[0], toCodePoint(emoji[0]));
        res = res.response.body;
      } catch (e) {
        return await editOrReply(context, createEmbed('error', context, `No emoji data available for ${emoji[0]}.`));
      }

      if (Object.keys(res.data.platforms).length === 0)
        return await editOrReply(context, createEmbed('error', context, 'No images available for this emoji.'));

      if (args.type === 'twitter') {
        if (!context.message.content.includes('-type') && !res.data.platforms['twitter']) {
          for (const k of EMOJIPEDIA_PLATFORM_PRIORITY) {
            if (args.type === 'twitter' && res.data.platforms[k]) args.type = k;
          }
          if (args.type === 'twitter' && Object.keys(res.data.platforms).length >= 1)
            args.type = Object.keys(res.data.platforms)[0];
        }
      }

      // This handles selecting the correct "default" platform for enlarge.
      if (res.data.platforms['discord']) args.type = 'discord';

      if (!res.data.platforms[args.type]) {
        let embed = createEmbed('error', context, "No emoji image available for platform '" + args.type + "'.");
        embed.footer = {
          text: 'Available platforms: ' + Object.keys(res.data.platforms).join(', ').substr(0, 2000),
        };
        return await editOrReply(context, embed);
      }

      // Use the high-res emojipedia icon, if available
      let ico;
      for (const k of EMOJIPEDIA_PLATFORM_PRIORITY) {
        if (!ico && res.data.platforms[k]) ico = res.data.platforms[k].images[0].src;
      }
      if (!ico && Object.values(res.data.platforms).length >= 1)
        ico = Object.values(res.data.platforms)[0].images[0].src;

      const DEFAULT_PLATFORM = args.type;

      let currentView;
      let currentPlatform = args.type;
      let currentRevision = '';

      const components = new Components({
        timeout: 100000,
        run: async ctx => {
          if (ctx.userId !== context.userId) return await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

          // this sucks but works, ensures the newly selected option stays selected
          // update 25/03/24 - it sucks even more now

          if (ctx.data.customId == 'emoji-type') {
            currentPlatform = ctx.data.values[0];
            currentRevision = res.data.platforms[currentPlatform].images[0].id;

            // Ensure the select is disabled if we only have sprites for one platform
            components.components[0].components[0].disabled = res.data.platforms.length == 1;

            // Disable options select if only one sprite is available
            components.components[1].components[0].disabled = res.data.platforms[currentPlatform].images.length == 1;

            for (let i = 0; i < components.components[0].components[0].options.length; i++) {
              components.components[0].components[0].options[i].default =
                components.components[0].components[0].options[i].value == currentPlatform;
            }

            let newVersionOptions = res.data.platforms[currentPlatform].images.map(r => {
              return {
                label: r.version,
                value: r.id,
                default: r.id == res.data.platforms[currentPlatform].images[0].id,
              };
            });

            components.components[1].components[0].options = newVersionOptions;
          } else if (ctx.data.customId == 'emoji-version') {
            for (let i = 0; i < components.components[1].components[0].options.length; i++) {
              components.components[1].components[0].options[i].default =
                components.components[1].components[0].options[i].value == ctx.data.values[0];
              components.components[1].components[0].options[i].default =
                components.components[1].components[0].options[i].value == ctx.data.values[0];
            }

            // Disable options select if only one sprite is available
            components.components[1].components[0].disabled = res.data.platforms[currentPlatform].images.length == 1;
            currentRevision = ctx.data.values[0];
          }

          const emojiAsset = res.data.platforms[currentPlatform].images.filter(p => {
            return p.id == currentRevision;
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
          default: r.id == res.data.platforms[DEFAULT_PLATFORM].images[0].id,
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
            default: r == DEFAULT_PLATFORM,
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

      setTimeout(() => {
        editOrReply(context, {
          embeds: [currentView],
          components: [],
        });
      }, 100000);

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
