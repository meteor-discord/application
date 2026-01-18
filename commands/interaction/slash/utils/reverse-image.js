const { reverseImageSearch } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { validateAttachment } = require('#utils/attachment');
const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { favicon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');

function createReverseImageSearchResultPage(context, result, source) {
  let res = page(
    createEmbed('default', context, {
      author: {
        iconUrl: favicon(result.url),
        name: result.name,
        url: result.url,
      },
      image: {
        url: result.image,
      },
      thumbnail: {
        url: source,
      },
    })
  );
  if (result.thumbnail) res.embeds[0].thumbnail = { url: result.thumbnail };
  return res;
}

module.exports = {
  name: 'reverse-image-search',
  description: 'Searches for image matches on the internet.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'image',
      description: 'Image to search for',
      type: ApplicationCommandOptionTypes.ATTACHMENT,
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

    if (!validateAttachment(args.image, 'image'))
      return await editOrReply(context, createEmbed('warning', context, 'Unsupported attachment type.'));

    try {
      let search = await reverseImageSearch(context, args.image.url);
      search = search.response;

      if (search.body.status == 2) return editOrReply(context, createEmbed('warning', context, search.body.message));

      let pages = [];
      for (const res of search.body.results) {
        pages.push(createReverseImageSearchResultPage(context, res, args.image.url));
      }

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, 'Unable to perform reverse image search.'));
    }
  },
};
