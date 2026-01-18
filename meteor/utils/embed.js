const { COLORS, SUPPORT_ARTICLES } = require('../constants');
const { STATIC_ICONS, STATICS, STATIC_ASSETS } = require('./statics');

const embedTypes = Object.freeze({
  default: context => {
    const footer = {
      text: context.application.name,
    };
    if (STATICS.labscore) footer.iconUrl = STATICS.labscore;
    return {
      color: COLORS.embed,
      footer,
    };
  },
  image: context => {
    const footer = {
      text: context.application.name,
    };
    if (STATICS.labscore) footer.iconUrl = STATICS.labscore;
    return {
      color: COLORS.embed,
      footer,
    };
  },
  defaultNoFooter: context => {
    return {
      color: COLORS.embed,
    };
  },
  success: context => {
    return {
      author: {
        name: `Success`,
      },
      color: COLORS.success,
    };
  },
  warning: context => {
    const author = {
      name: `Warning`,
    };
    if (STATIC_ICONS.warning) author.iconUrl = STATIC_ICONS.warning;
    return {
      author,
      color: COLORS.warning,
    };
  },
  error: context => {
    const author = {
      name: `Error`,
    };
    if (STATIC_ICONS.error) author.iconUrl = STATIC_ICONS.error;
    return {
      author,
      color: COLORS.error,
    };
  },
  errordetail: context => {
    const author = {
      name: `Error`,
    };
    if (STATIC_ICONS.error) author.iconUrl = STATIC_ICONS.error;
    return {
      author,
      color: COLORS.error,
    };
  },
  nsfw: context => {
    const author = {
      name: `This command is only available in Age Restricted channels.`,
      url: `https://support.discord.com/hc/en-us/articles/${SUPPORT_ARTICLES.AGE_RESTRICTED_CHANNELS}`,
    };
    if (STATIC_ICONS.adult) author.iconUrl = STATIC_ICONS.adult;
    return {
      author,
      color: COLORS.nsfw,
    };
  },
  loading: context => {
    const author = {
      name: `Loading`,
    };
    if (STATIC_ICONS.loading) author.iconUrl = STATIC_ICONS.loading;
    return {
      author,
      color: COLORS.embed,
    };
  },
  ai: context => {
    const author = {
      name: `Generating`,
    };
    if (STATIC_ICONS.ai) author.iconUrl = STATIC_ICONS.ai;
    return {
      author,
      color: COLORS.embed,
    };
  },
  ai_custom: context => {
    const author = {
      name: `​`,
    };
    if (STATIC_ICONS.ai) author.iconUrl = STATIC_ICONS.ai;
    const embed = {
      author,
      color: COLORS.embed,
    };
    if (STATIC_ASSETS.chat_loading) {
      embed.image = { url: STATIC_ASSETS.chat_loading };
    }
    return embed;
  },
});

// Returns a formatted embed
module.exports.createEmbed = function (type, context, content) {
  if (!embedTypes[type]) throw 'Invalid Embed Type';
  if (!content) embedTypes[type](context);
  const emb = embedTypes[type](context);

  if (['success', 'warning', 'error', 'loading', 'ai', 'nsfw'].includes(type)) {
    if (content) emb.author.name = content;
    return emb;
  }

  if (['ai_custom'].includes(type)) {
    emb.author.iconUrl = content;
  }

  if (['errordetail'].includes(type)) {
    emb.author.name = content.error;
    emb.description = content.content;
    return emb;
  }

  if (content && content.footer && !content.footer.iconUrl && type !== 'defaultNoFooter') {
    if (STATICS.labscore) content.footer.iconUrl = STATICS.labscore;
  }

  if (['image'].includes(type)) {
    if (content.url.includes('://')) {
      emb.image = { url: content.url };
    } else {
      emb.image = { url: `attachment://${content.url}` };
    }

    if (content.provider) {
      if (content.provider.text) emb.footer.text = `${content.provider.text} • ${context.application.name}`;
      if (content.provider.icon) emb.footer.iconUrl = content.provider.icon;
    }

    if (content.description) emb.description = content.description;

    if (content.time && emb.footer) emb.footer.text = `${emb.footer.text} • Took ${content.time}s`;

    return emb;
  }

  return Object.assign(emb, content);
};

// Adds formatted page numbers to the embed footer
/**
 * Formats embeds for pagination.
 * @deprecated No longer necessary in DynamicCardStack.
 * @param embeds Array of Messages
 * @returns {Embed[]}
 */
module.exports.formatPaginationEmbeds = function (embeds) {
  // No formatting if we only have one page
  if (embeds.length == 1) return embeds;

  let i = 0;
  const l = embeds.length;
  const formatted = [];
  for (const e of embeds) {
    i += 1;
    const ne = e;
    if (!e) continue;
    if (e.embed) {
      ne.embed.footer.text = e.embed.footer.text + ` • Page ${i}/${l}`;
      formatted.push(ne);
    } else if (e.embeds) {
      ne.embeds = e.embeds.map(se => {
        if (se.footer) se.footer.text = se.footer.text + ` • Page ${i}/${l}`;
        else
          se.footer = {
            text: `Page ${i}/${l}`,
          };
        return se;
      });

      formatted.push(ne);
    } else {
      formatted.push(e);
    }
  }
  return formatted;
};

// Creates a page for our paginator. simple helper so we dont have to do {embeds:[]} every time
module.exports.page = function (embed, message = {}, metadata = {}) {
  return Object.assign(message, {
    embeds: [embed],
    _meta: metadata,
  });
};
