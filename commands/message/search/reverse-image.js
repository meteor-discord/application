const { reverseImageSearch } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { getRecentImage } = require('#utils/attachment');
const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { favicon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

function createReverseImageSearchResultPage(context, result, source) {
  const res = page(
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
      footer: {
        iconUrl: STATICS.googlelens,
        text: `Google Lens • ${context.application.name}`,
      },
    })
  );
  if (result.thumbnail) res.embeds[0].thumbnail = { url: result.thumbnail };
  return res;
}

module.exports = {
  name: 'reverse-image',
  aliases: ['reverse', 'reverseimage'],
  metadata: {
    description: 'Performs a reverse-image-search.',
    description_short: 'Reverse image search',
    category: 'search',
    usage: 'reverse <image>',
    slashCommand: 'Reverse Image Search',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async context => {
    await acknowledge(context);

    try {
      const image = await getRecentImage(context, 50);
      if (!image) return editOrReply(context, createEmbed('warning', context, 'No images found.'));

      let search = await reverseImageSearch(context, image);
      search = search.response;

      if (search.body.status === 2) return editOrReply(context, createEmbed('warning', context, search.body.message));

      const pages = [];
      for (const res of search.body.results) {
        pages.push(createReverseImageSearchResultPage(context, res, image));
      }

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to perform reverse image search.`));
    }
  },
};
