const { reverseImageSearch } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { getMessageAttachment, validateAttachment } = require('#utils/attachment');
const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { favicon } = require("#utils/markdown");
const { editOrReply } = require('#utils/message')
const { STATICS } = require('#utils/statics')

const { ApplicationCommandTypes, InteractionContextTypes, ApplicationIntegrationTypes } = require("detritus-client/lib/constants");

function createReverseImageSearchResultPage(context, result, source) {
  let res = page(
    createEmbed("default", context, {
      author: {
        iconUrl: favicon(result.url),
        name: result.name,
        url: result.url
      },
      image: {
        url: result.image
      },
      thumbnail: {
        url: source
      },
      footer: {
        iconUrl: STATICS.googlelens,
        text: `Google Lens • ${context.application.name}`
      }
    }))
  if (result.thumbnail) res.embeds[0].thumbnail = { url: result.thumbnail };
  return res;
}

module.exports = {
  name: 'Reverse Image Search',
  type: ApplicationCommandTypes.MESSAGE,
  contexts: [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.PRIVATE_CHANNEL,
    InteractionContextTypes.BOT_DM
  ],
  integrationTypes: [
    ApplicationIntegrationTypes.USER_INSTALL
  ],
  run: async (context, args) => {
    try{
      await acknowledge(context, false, [...PERMISSION_GROUPS.baseline_slash]);

      const { message } = args;

      let attachment = getMessageAttachment(message)
      if(attachment && validateAttachment(attachment, "image")){
        attachment = attachment.url
      } else {
        delete attachment;
      }
      if(!attachment) return editOrReply(context, createEmbed("warning", context, "No images found."))


      let search = await reverseImageSearch(context, attachment)
      search = search.response

      if (search.body.status == 2) return editOrReply(context, createEmbed("warning", context, search.body.message))

      let pages = []
      for (const res of search.body.results) {
        pages.push(createReverseImageSearchResultPage(context, res, attachment))
      }

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages)
      });
    } catch (e) {
      console.log(e)
      return editOrReply(context, createEmbed("error", context, `Unable to perform reverse image search.`))
    }
  },
};