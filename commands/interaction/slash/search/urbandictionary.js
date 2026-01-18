const { urbandictionary } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { link, iconPill, timestamp} = require('#utils/markdown')
const { editOrReply } = require('#utils/message')
const { STATICS } = require('#utils/statics')

const { ApplicationCommandOptionTypes, InteractionContextTypes, ApplicationIntegrationTypes } = require("detritus-client/lib/constants");

function createUrbanPage(context, result){
  let e = createEmbed("default", context, {
    description: `**${link(result.link, result.title)}**`,
    fields: [],
    footer: {
      iconUrl: STATICS.urbandictionary,
      text: `UrbanDictionary • ${context.application.name}`
    }
  })
  if(result.description) e.fields.push({
    name: "Description",
    value: result.description.substr(0, 1023),
    inline: true
  })
  e.fields.push({
    name: "Stats",
    value: `${iconPill("upvote", result.score.likes)}  ​  ${iconPill("downvote", result.score.dislikes)}\n**Author:** ${link(`https://www.urbandictionary.com/author.php?author=${encodeURIComponent(result.author)}`, result.author)}\n**Published:** ${timestamp(result.date, "d")}`,
    inline: true
  })
  if(result.example) e.fields.push({
    name: "Example",
    value: result.example.substr(0, 1023),
    inline: false
  })
  return page(e);
}

module.exports = {
  name: 'urbandictionary',
  description: 'Define a word on urban dictionary.',
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
      name: 'term',
      description: 'Term to look up.',
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
      let search = await urbandictionary(context, args.term)
      search = search.response
     
      if(search.body.status == 1) return editOrReply(context, createEmbed("warning", context, search.body.message))

      let pages = []
      for(const res of search.body.results){
        pages.push(createUrbanPage(context, res))
      }
      
      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages)
      });
    }catch(e){
      console.log(e)
      return editOrReply(context, createEmbed("error", context, `Unable to perform urban dictionary search.`))
    }
  },
};