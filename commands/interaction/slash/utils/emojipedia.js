const { emojipedia } = require('#api');

const { createEmbed } = require('#utils/embed');
const { pill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS, STATIC_ASSETS } = require('#utils/statics');

const { Components } = require('detritus-client/lib/utils');
const {
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');
const { acknowledge } = require('#utils/interactions');
const { PERMISSION_GROUPS, EMOJIPEDIA_PLATFORM_PRIORITY } = require('#constants');

const onlyEmoji = require('emoji-aware').onlyEmoji;

module.exports = {
  name: 'emojipedia',
  description: 'Shows detailed information about an emoji.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'emoji',
      description: 'Emoji to look up.',
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

    const emoji = onlyEmoji(args.emoji);
    if (!emoji) {
      return editOrReply(context, createEmbed('warning', context, 'No emoji found.'));
    }

    // Regular Emoji Handling
    if (emoji.length === 0)
      return await editOrReply(context, createEmbed('warning', context, 'You need to specify an emoji to enlarge.'));

    let res;
    try {
      res = await emojipedia(context, emoji[0]);
      res = res.response.body;
    } catch {
      return await editOrReply(context, createEmbed('error', context, `No emoji data available for ${emoji[0]}.`));
    }

    const components = new Components({
      timeout: 100000,
      run: async ctx => {
        if (ctx.userId !== context.userId) return await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

        let newView = await emojipedia(context, ctx.data.customId);
        newView = newView.response.body;

        let newIcon;
        for (const k of EMOJIPEDIA_PLATFORM_PRIORITY) {
          if (!newIcon && newView.data.platforms[k]) newIcon = newView.data.platforms[k].images[0].src;
        }
        if (!newIcon && Object.values(newView.data.platforms).length >= 1)
          newIcon = Object.values(newView.data.platforms)[0].images[0].src;

        const currentView = createEmbed('default', context, {
          author: {
            iconUrl: newIcon,
            name: `${newView.data.name} • Emoji ${newView.data.metadata.version.emoji}`,
            url: newView.data.link,
          },
          description: newView.data.codes.map(c => pill(c)).join(' ') + '\n\n' + newView.data.metadata.description,
          image: {
            url: newIcon || STATIC_ASSETS.emoji_placeholder_large,
          },
          footer: {
            iconUrl: STATICS.emojipedia,
            text: `Emojipedia • ${context.application.name}`,
          },
        });

        components.clear();
        if (newView.data.metadata.similar)
          for (const e of newView.data.metadata.similar.splice(0, 5)) {
            components.addButton({
              customId: e,
              emoji: e,
              style: MessageComponentButtonStyles.SECONDARY,
            });
          }

        if (!newView.data.metadata.similar) return await ctx.editOrRespond({ embeds: [currentView] });

        await ctx.editOrRespond({ embeds: [currentView], components });
      },
    });

    if (res.data.metadata.similar)
      for (const e of res.data.metadata.similar.splice(0, 5)) {
        components.addButton({
          customId: e,
          emoji: e,
          style: MessageComponentButtonStyles.SECONDARY,
        });
      }

    setTimeout(() => {
      editOrReply(context, {
        embeds: [currentView],
        components: [],
      });
    }, 100000);

    // Use the high-res emojipedia icon, if available
    let ico;
    for (const k of EMOJIPEDIA_PLATFORM_PRIORITY) {
      if (!ico && res.data.platforms[k]) ico = res.data.platforms[k].images[0].src;
    }
    if (!ico && Object.values(res.data.platforms).length >= 1) ico = Object.values(res.data.platforms)[0].images[0].src;

    currentView = createEmbed('default', context, {
      author: {
        iconUrl: ico || STATIC_ASSETS.emoji_placeholder,
        name: `${res.data.name} • Emoji ${res.data.metadata.version.emoji}`,
        url: res.data.link,
      },
      description: res.data.codes.map(c => pill(c)).join(' ') + '\n\n' + res.data.metadata.description,
      image: {
        url: ico || STATIC_ASSETS.emoji_placeholder,
      },
      footer: {
        iconUrl: STATICS.emojipedia,
        text: `Emojipedia • ${context.application.name}`,
      },
    });

    if (!res.data.metadata.similar) return await editOrReply(context, currentView);

    return editOrReply(context, {
      embeds: [currentView],
      components,
    });
  },
};
