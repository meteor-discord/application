const { movie } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS, OMNI_ANIME_FORMAT_TYPES, OMNI_MOVIE_TYPES } = require('#constants');

const { hexToDecimalColor } = require('#utils/color');
const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { smallPill, pill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const {
  ApplicationCommandOptionTypes,
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} = require('detritus-client/lib/constants');

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
  description: 'Search for Movies & TV Shows.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'query',
      description: 'Search query.',
      type: ApplicationCommandOptionTypes.STRING,
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
