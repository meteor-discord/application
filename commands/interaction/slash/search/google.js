const { google } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');
const { format } = require('#utils/ansi');

const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { link, citation, icon, smallPill, pill, codeblock, favicon} = require('#utils/markdown')
const { editOrReply } = require('#utils/message')
const { STATICS } = require('#utils/statics')

const { ApplicationCommandOptionTypes, InteractionContextTypes, ApplicationIntegrationTypes } = require('detritus-client/lib/constants');
const {createDynamicCardStack} = require("#cardstack/index");

function renderFooter(context, doodle){
  if(doodle.super_g) return {
    iconUrl: doodle.super_g,
    text: `${doodle.label} • Google`
  }
  
  return {
    iconUrl: STATICS.google,
    text: `Google • ${context.application.name}`
  }
}

// These have to be synced with the backend (search_service/endpoints/google).
const SEARCH_CARD_TYPES = {
  UNKNONW: 0,
  SEARCH_RESULT: 1,
  KNOWLEDGE_GRAPH: 2,
  DOODLE: 3,
  ENTITY: 4,
  CALCULATOR: 5,
  UNIT_CONVERTER: 6,
  DICTIONARY: 7,
  MAPS: 8,
  FUNBOX_COIN_FLIP: 10,
  FUNBOX_COLOR_PICKER: 11,
  DATA_GENERIC: 20,
  DATA_FINANCE: 21,
  DATA_DICTIONARY: 22,
  DATA_TRANSLATE: 23,
  DATA_WEATHER: 24,
  PIVOT_IMAGES: 100
}

function createSearchResultPage(context, result, doodle){
  let res;
  switch(result.type){
    case SEARCH_CARD_TYPES.SEARCH_RESULT:
      let displayLink = result.display_link;
      while(displayLink.startsWith("www.")) displayLink = displayLink.substring(4, displayLink.length);

      res = createEmbed("default", context, {
        author: {
          iconUrl: favicon(result.url),
          name: displayLink,
          url: result.url
        },
        title: result.title,
        url: result.url,
        description: result.content,
          footer: renderFooter(context, doodle)
        })

      if(result.thumbnail) res.thumbnail = { url: result.thumbnail };
    
      break;
    case SEARCH_CARD_TYPES.KNOWLEDGE_GRAPH:
      res = createEmbed("default", context, {
          description: "",
          title: result.card.title,
          footer: renderFooter(context, doodle)
        })
    
      if(result.card.url) res.url = result.card.url;

      if(result.card.image) res.thumbnail = { url: result.card.image };
      if(result.card.description) res.description += `-# ${result.card.description}\n`
      if(result.card.content){
        let cnt = result.card.content.replace(/\n/g, '')
        if(cnt.endsWith(" ")) cnt = cnt.substr(0,cnt.length - 1)
        res.description += "\n" + cnt + citation(1, result.card.url, "Source")
      }
      break;
    case SEARCH_CARD_TYPES.DOODLE:
      res = createEmbed("default", context, {
        description: `### ${result.card.title}\n${result.card.description}\n\n${link(result.card.learn_more, `Learn More ${icon("link_open_external")}`, "Learn more about this Doodle")}`,
        image: {
          url: result.card.images.image
        },
        footer: renderFooter(context, doodle)
      })

      if(result.card.images.thumbnail){
        res.thumbnail = {
          url: result.card.images.thumbnail 
        }
      }
      break;
    case SEARCH_CARD_TYPES.ENTITY:
      res = createEmbed("default", context, {
        author: {
          name: result.card.title
        },
        thumbnail: {
          url: result.card.images.thumbnail
        },
        description: '',
        footer: renderFooter(context, doodle)
      })

      if(!result.card.images.preview && result.card.link === ""){
        delete res.author
        res.description = `### ${result.card.title}\n`
      }

      if(result.card.type) res.description += `-# ${result.card.type}`

      if(result.card.color && result.card.color !== "") res.color = parseInt(result.card.color.substring(1,10), 16)

      if(result.card.description !== ""){
        res.description += "\n\n" + result.card.description.replace(/\n/g,'')
        if(result.card.source) res.description += citation(1, result.card.source, "Source") + "\n\n" + link(result.card.source, `Learn More ${icon("link_open_external")}`, "Learn more about this topic");
        else if(result.card.link !== "") res.description += "\n\n" + link(result.card.link, `Learn More ${icon("link_open_external")}`, "Learn more about this topic");
      }

      if(result.card.images.preview) res.author.iconUrl = result.card.images.preview;

      if(result.card.images.image) res.image = {
        url: result.card.images.image
      };

      if(result.card.facts) res.fields = result.card.facts.map((f)=>{
        return {
          name: f.label,
          value: f.value,
          inline: true
        }
      })

      if(result.card.link) res.author.url = result.card.link

      break;
    case SEARCH_CARD_TYPES.CALCULATOR:
      res = createEmbed("default", context, {
        description: `-# ${result.query} =\n**${codeblock("ansi",[format(result.result, "white")])}**`,
        footer: {
          iconUrl: STATICS.googlecalculator,
          text: `Calculator • ${context.application.name}`
        }
      })
      break;
    case SEARCH_CARD_TYPES.UNIT_CONVERTER:
      res = createEmbed("default", context, {
        description: `-# ${result.units[0]} =\n**${codeblock("ansi",[format(result.units[1], "white")])}**`,
        footer: {
          iconUrl: STATICS.googlecalculator,
          text: `Unit Converter • ${context.application.name}`
        }
      })
      break;
    case SEARCH_CARD_TYPES.MAPS:
      res = createEmbed("default", context, {
        author: {
          name: result.card.title,
          iconUrl: result.card.icon,
          url: result.card.url
        },
        image: {
          url: result.card.image
        },
        footer: renderFooter(context, doodle)
      })
      break;
    case SEARCH_CARD_TYPES.FUNBOX_COIN_FLIP:
      res = createEmbed("default", context, {
        description: `### Flip a coin\n**${result.result}**!`,
        thumbnail: {
          url: result.sprite
        },
        footer: renderFooter(context, doodle)
      })
      break;
    case SEARCH_CARD_TYPES.FUNBOX_COLOR_PICKER:
      res = createEmbed("default", context, {
        description: `### ${result.card.title}\n${result.card.components.map((c)=>`${pill(c.label)}  ${smallPill(c.content)}`).join('\n')}`,
        thumbnail: {
          url: result.card.thumbnail
        },
        footer: renderFooter(context, doodle)
      })
      break;
    case SEARCH_CARD_TYPES.DATA_GENERIC:
      res = createEmbed("default", context, {
        description: `-# ${result.fact.category} ${(result.fact.type ? `› **${result.fact.type}**` : '')}\n# ${result.fact.result}`,
        footer: renderFooter(context, doodle)
      })
      
      if(result.fact.icon) res.thumbnail = { url: result.fact.icon }
  
      break;
    case SEARCH_CARD_TYPES.DATA_FINANCE:
      res = createEmbed("default", context, {
        description: `-# $${result.finance.ticker} (${result.finance.exchange}) ${result.finance.time}\n${result.finance.title}\n# $${result.finance.price}\n**${result.finance.change}** ​  ​  ​  ​  ​  ​ ${link(result.finance.disclaimer.url, `${result.finance.disclaimer.label} ${icon("link_open_external")}`, result.finance.disclaimer.label)}`,
        footer: {
          iconUrl: STATICS.googlefinance,
          text: `Google Finance • ${context.application.name}`
        }
      })
  
      break;
    case SEARCH_CARD_TYPES.DATA_DICTIONARY:
      res = createEmbed("default", context, {
        description: `**${result.dictionary.term}**\n-# ${result.dictionary.phonetics} • ${result.dictionary.word_type}\n\n${result.dictionary.definition}\n\n-# ${result.dictionary.attribution}`,
        footer: {
          iconUrl: STATICS.googledictionary,
          text: `Dictionary • ${context.application.name}`
        }
      })
  
      break;
    case SEARCH_CARD_TYPES.DATA_WEATHER:
      res = createEmbed("default", context, {
        description: `-# ${result.weather.place}\n## ${result.weather.temperature}`,
        thumbnail: {
          url: result.weather.icon
        },
        footer: {
          iconUrl: STATICS.weather,
          text: `Weather • ${context.application.name}`
        }
      })
  
      break;
    case SEARCH_CARD_TYPES.PIVOT_IMAGES:
      res = createEmbed("default", context, {
        author: {
          name: result.card.title,
          iconUrl: result.card.icon
        },
        image: {
          url: result.card.image
        },
        footer: renderFooter(context, doodle)
      })
  
      break;
    default:
      res = createEmbed("error", context, "Unknown GoogleResult Type: " + result.type)
      break;
  }
  return page(res);
}

module.exports = {
  name: 'google',
  description: 'Search Google for websites.',
  contexts: [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.PRIVATE_CHANNEL,
    InteractionContextTypes.BOT_DM
  ],
  integrationTypes: [
    ApplicationIntegrationTypes.USER_INSTALL
  ],
  options: [
    {
      name: 'query',
      description: 'Google search query.',
      type: ApplicationCommandOptionTypes.STRING,
      required: true
    },
    {
      name: 'incognito',
      description: 'Makes the response only visible to you.',
      type: ApplicationCommandOptionTypes.BOOLEAN,
      required: false,
      default: false
    }
  ],
  run: async (context, args) => {
    await acknowledge(context, args.incognito, [...PERMISSION_GROUPS.baseline_slash]);
    
    try{
      let search = await google(context, args.query, false) // safe search is always on
      search = search.response
     
      if(search.body.status === 2) return editOrReply(context, createEmbed("error", context, search.body.message))

      let pages = []
      for(const res of search.body.results){
        pages.push(createSearchResultPage(context, res, search.body.doodle))
      }

      if(!pages.length) return editOrReply(context, createEmbed("warning", context, `No results found.`))

      return await createDynamicCardStack(context, {
        cards: pages
      });
    }catch(e){
      console.log(e)
      return editOrReply(context, createEmbed("error", context, `Unable to perform google search.`))
    }
  },
};