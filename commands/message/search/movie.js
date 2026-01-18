const { movie } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS, OMNI_ANIME_FORMAT_TYPES, OMNI_MOVIE_TYPES } = require('#constants');

const { hexToDecimalColor } = require('#utils/color');
const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { smallPill, pill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

function renderMovieResultsPage(context, res) {
  const result = createEmbed('default', context, {
    author: {
      name: res.title,
      url: res.url,
    },
    description: ``,
    fields: [],
  });

  // Render Description
  if (res.subtitle) result.description += `-# ${res.subtitle}\n\n`;
  if (res.type) result.description += `${pill(OMNI_MOVIE_TYPES[res.type])}   `;
  if (res.genres) result.description += res.genres.map(r => smallPill(r)).join('   ') + '\n\n';
  if (res.description) result.description += res.description;

  // Render Images
  if (res.cover) result.thumbnail = { url: res.cover };
  if (res.image) result.image = { url: res.image };

  // Render Color
  if (res.color) result.color = hexToDecimalColor(res.color);

  return page(result);
}

module.exports = {
  name: 'movie',
  label: 'query',
  aliases: ['tv', 'show', 'shows', 'tvshows', 'movies', 'mov'],
  metadata: {
    description: 'Returns search results for Movies & TV Shows.',
    description_short: 'Search Movies & TV Shows',
    examples: ['tv wilsberg', 'mov stranger by the shore'],
    category: 'search',
    usage: 'movie <query>',
    slashCommand: 'movie',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.query) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (query).`));
    try {
      let search = await movie(context, args.query, context.channel.nsfw);
      search = search.response;

      if (search.body.status == 2) return editOrReply(context, createEmbed('error', context, search.body.message));

      const pages = [];
      for (const res of search.body.results) {
        pages.push(renderMovieResultsPage(context, res));
      }

      if (!pages.length) return editOrReply(context, createEmbed('warning', context, `No results found.`));

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
      });
    } catch (e) {
      if (e.response?.body?.status == 1)
        return editOrReply(context, createEmbed('warning', context, e.response?.body?.message));
      if (e.response?.body?.status == 2)
        return editOrReply(context, createEmbed('warning', context, e.response?.body?.message));

      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to perform anime search.`));
    }
  },
};
