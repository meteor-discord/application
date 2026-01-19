const { bingImages } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { favicon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

function createImageResultPage(context, result) {
  const res = page(
    createEmbed('default', context, {
      author: {
        iconUrl: favicon(result.url),
        name: result.title,
        url: result.url,
      },
      image: {
        url: result.image,
      },
      footer: {
        iconUrl: STATICS.bing,
        text: `Microsoft Bing • ${context.application.name}`,
      },
    })
  );
  if (result.thumbnail) res.embeds[0].thumbnail = { url: result.thumbnail };
  return res;
}

module.exports = {
  name: 'bingimage',
  label: 'query',
  aliases: ['bi', 'bimg', 'img2'],
  cooldown: 10,
  metadata: {
    description: 'Returns image search results from Microsoft Bing.',
    description_short: 'Search on Bing Images',
    examples: ['bing Eurasian Small Clawed Otter'],
    category: 'search',
    usage: 'bing <query>',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.query) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (query).`));
    try {
      let search = await bingImages(context, args.query, context.channel.nsfw);
      search = search.response;

      if (search.body.status === 2) return editOrReply(context, createEmbed('error', context, search.body.message));

      const pages = [];
      for (const res of search.body.results) {
        pages.push(createImageResultPage(context, res));
      }

      if (!pages.length) return editOrReply(context, createEmbed('warning', context, `No results found.`));

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to perform bing search.`));
    }
  },
};
