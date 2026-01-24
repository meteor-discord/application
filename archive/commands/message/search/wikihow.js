const { wikihow } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

function createWikiHowPage(context, result) {
  const e = createEmbed('default', context, {
    author: {
      name: result.title,
      url: result.link,
    },
    description: result.snippet,
    footer: {
      iconUrl: STATICS.wikihow,
      text: `WikiHow • ${context.application.name}`,
    },
  });
  if (result.image)
    e.image = {
      url: result.image,
    };
  return page(e);
}

module.exports = {
  name: 'wikihow',
  label: 'query',
  aliases: ['wh', 'how'],
  cooldown: 10,
  metadata: {
    description: 'Returns search results from WikiHow.',
    description_short: 'Search on WikiHow',
    examples: ['wh download'],
    category: 'search',
    usage: 'wikihow <query>',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    try {
      let search = await wikihow(context, args.query);
      search = search.response;

      const pages = [];

      if (search.body.data.length === 0)
        return editOrReply(context, createEmbed('error', context, `No results found.`));

      for (const res of search.body.data) {
        pages.push(createWikiHowPage(context, res));
      }

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to perform wikihow search.`));
    }
  },
};
