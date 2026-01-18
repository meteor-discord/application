const {createDynamicCardStack} = require("#cardstack/index");
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message')
const { STATICS } = require('#utils/statics')

const superagent = require('superagent');

const {
  InteractionContextTypes,
  ApplicationIntegrationTypes,
  ApplicationCommandOptionTypes
} = require("detritus-client/lib/constants");

module.exports = {
  name: 'wikipedia',
  description: 'Search on Wikipedia.',
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
      description: 'Search query.',
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
      let search = await superagent.get(`https://api.wikimedia.org/core/v1/wikipedia/en/search/page`)
        .query({
          q: args.query,
          limit: 100,
          language: 'en'
        })
        .set("User-Agent", "labscore/1.0")

      let pages = []

      if(!search.body.pages.length) return editOrReply(context, createEmbed("error", context, `No results found.`))

      for(const res of Object.values(search.body.pages)){
        let p = createEmbed("default", context, {
          author: {
            name: res.title,
            url: `https://en.wikipedia.org/wiki/${res.key}`
          },
          footer: {
            iconUrl: STATICS.wikipedia,
            text: `Wikipedia • ${context.application.name}`
          }
        })

        if(res.thumbnail && res.thumbnail.url) p.thumbnail = {
          url: 'https:' + res.thumbnail.url.replace(/d3\/.*?\/[0-9]*px-/, '/d3/').replace('/thumb/d/', '/d')
        }
        
        if(res.excerpt) p.description = res.excerpt.replace(/<.*?>/g, '')

        pages.push(page(p))
      }

      return await createDynamicCardStack(context, {
        cards: pages
      });
    }catch(e){
      console.log(e)
      return editOrReply(context, createEmbed("error", context, `Unable to perform wikipedia search.`))
    }
  },
};