const { emojipedia, inhouseEmojiSearch } = require('#api');
const { PERMISSION_GROUPS, EMOJIPEDIA_PLATFORM_PRIORITY } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { pill, smallIconPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS, STATIC_ASSETS } = require('#utils/statics');

const { InteractionCallbackTypes, MessageComponentButtonStyles } = require('detritus-client/lib/constants');
const { Components } = require('detritus-client/lib/utils');

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
  name: 'emojipedia',
  aliases: ['emojiinfo', 'ei'],
  metadata: {
    description: `${smallIconPill('reply', 'Supports Replies')}\n\nDisplays more detailed information about emoji. Only supports unicode emoji.`,
    description_short: 'Detailed information about an emoji.',
    examples: ['ei 😀'],
    category: 'utils',
    usage: 'emojipedia <emoji>',
    slashCommand: 'emojipedia',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    let msg = context.message;
    if (context.message.messageReference) {
      msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId);
      args.emoji = msg.content;
    }

    const emoji = args.emoji;

    let res;
    try {
      res = await inhouseEmojiSearch(context, emoji);
      res = res.response.body;
    } catch (e) {
      console.log(e);
      return await editOrReply(context, createEmbed('error', context, e?.response?.body?.message || 'No emoji found.'));
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

        currentView = createEmbed('default', context, {
          author: {
            iconUrl: newIcon || STATIC_ASSETS.emoji_placeholder,
            name: `${newView.data.name} `,
            url: newView.data.link,
          },
          description: newView.data.codes.map(c => pill(c)).join(' ') + '\n\n' + newView.data.metadata.description,
          image: {
            url: newIcon || STATIC_ASSETS.emoji_placeholder,
          },
          footer: {
            iconUrl: STATICS.emojipedia,
            text: `Emojipedia • ${context.application.name}`,
          },
        });

        if (newView.data.metadata.version?.emoji) {
          currentView.author.name += `• Emoji ${newView.data.metadata.version.emoji}`;
        }

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

    let ico;
    for (const k of EMOJIPEDIA_PLATFORM_PRIORITY) {
      if (!ico && res.data.platforms[k]) ico = res.data.platforms[k].images[0].src;
    }
    if (!ico && Object.values(res.data.platforms).length >= 1) ico = Object.values(res.data.platforms)[0].images[0].src;

    currentView = createEmbed('default', context, {
      author: {
        iconUrl: ico || STATIC_ASSETS.emoji_placeholder,
        name: `${res.data.name} `,
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

    if (res.data.metadata.version?.emoji) {
      currentView.author.name += `• Emoji ${res.data.metadata.version.emoji}`;
    }

    if (!res.data.metadata.similar) return await editOrReply(context, currentView);

    return editOrReply(context, {
      embeds: [currentView],
      components,
    });
  },
};
