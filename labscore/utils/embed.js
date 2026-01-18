const { COLORS, SUPPORT_ARTICLES } = require('../constants')
const { STATIC_ICONS, STATICS, STATIC_ASSETS } = require('./statics')

const embedTypes = Object.freeze({
  "default": (context) => {
    return {
      color: COLORS.embed,
      footer: {
        iconUrl: STATICS.labscore,
        text: context.application.name
      }
    }
  },
  "image": (context) => {
    return {
      color: COLORS.embed,
      footer: {
        iconUrl: STATICS.labscore,
        text: context.application.name
      }
    }
  },
  "defaultNoFooter": (context) => {
    return {
      color: COLORS.embed
    }
  },
  "success": (context) => {
    return {
      author: {
        name: `Success`
      },
      color: COLORS.success
    }
  },
  "warning": (context) => {
    return {
      author: {
        iconUrl: STATIC_ICONS.warning,
        name: `Warning`
      },
      color: COLORS.warning
    }
  },
  "error": (context) => {
    return {
      author: {
        iconUrl: STATIC_ICONS.error,
        name: `Error`
      },
      color: COLORS.error
    }
  },
  "errordetail": (context) => {
    return {
      author: {
        iconUrl: STATIC_ICONS.error,
        name: `Error`
      },
      color: COLORS.error
    }
  },
  "nsfw": (context) => {
    return {
      author: {
        iconUrl: STATIC_ICONS.adult,
        name: `This command is only available in Age Restricted channels.`,
        url: `https://support.discord.com/hc/en-us/articles/${SUPPORT_ARTICLES.AGE_RESTRICTED_CHANNELS}`
      },
      color: COLORS.nsfw
    }
  },
  "loading": (context) => {
    return {
      author: {
        iconUrl: STATIC_ICONS.loading,
        name: `Loading`
      },
      color: COLORS.embed
    }
  },
  "ai": (context) => {
    return {
      author: {
        iconUrl: STATIC_ICONS.ai,
        name: `Generating`
      },
      color: COLORS.embed
    }
  },
  "ai_custom": (context) => {
    return {
      author: {
        iconUrl: STATIC_ICONS.ai,
        name: `​`
      },
      image: {
        url: STATIC_ASSETS.chat_loading
      },
      color: COLORS.embed
    }
  }
})

// Returns a formatted embed
module.exports.createEmbed = function(type, context, content){
  if(!embedTypes[type]) throw "Invalid Embed Type"
  if(!content) embedTypes[type](context)
  let emb = embedTypes[type](context)

  if(["success","warning","error","loading","ai","nsfw"].includes(type)){
    if(content) emb.author.name = content
    return emb
  }

  if(["ai_custom"].includes(type)){
    emb.author.iconUrl = content
  }
  
  if(["errordetail"].includes(type)){
    emb.author.name = content.error
    emb.description = content.content
    return emb
  }

  if(content && content.footer && !content.footer.iconUrl && type !== "defaultNoFooter") content.footer.iconUrl = STATICS.labscore
  
  if(["image"].includes(type)){
    if(content.url.includes('://')){
      emb.image = { url: content.url }
    } else {
      emb.image = { url: `attachment://${content.url}` }
    }

    if(content.provider){
      if(content.provider.text) emb.footer.text = `${content.provider.text} • ${context.application.name}`
      if(content.provider.icon) emb.footer.iconUrl = content.provider.icon
    }

    if(content.description) emb.description = content.description

    if(content.time && emb.footer) emb.footer.text = `${emb.footer.text} • Took ${content.time}s`

    return emb
  }

  return Object.assign(emb, content)
}

// Adds formatted page numbers to the embed footer
/**
 * Formats embeds for pagination.
 * @deprecated No longer necessary in DynamicCardStack.
 * @param embeds Array of Messages
 * @returns {Embed[]}
 */
module.exports.formatPaginationEmbeds = function(embeds){
  // No formatting if we only have one page
  if(embeds.length == 1) return embeds;

  let i = 0;
  let l = embeds.length;
  let formatted = [];
  for(const e of embeds){
    i += 1;
    let ne = e;
    if(!e) continue;
    if(e.embed){
      ne.embed.footer.text = e.embed.footer.text + ` • Page ${i}/${l}`
      formatted.push(ne)
    } else if (e.embeds){
      ne.embeds = e.embeds.map((se)=>{
        if(se.footer) se.footer.text = se.footer.text + ` • Page ${i}/${l}`
        else se.footer = {
          text: `Page ${i}/${l}`
        }
        return se;
      })

      formatted.push(ne)
    } else {
      formatted.push(e)
    }
  }
  return formatted;
}

// Creates a page for our paginator. simple helper so we dont have to do {embeds:[]} every time
module.exports.page = function(embed, message = {}, metadata = {}){
  return Object.assign(message, {
    embeds: [embed],
    _meta: metadata,
  })
}