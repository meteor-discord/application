const { googleImages } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { favicon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');
const { createDynamicCardStack } = require('#cardstack/index');

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
        iconUrl: STATICS.google,
        text: `Google Images • ${context.application.name}`,
      },
    })
  );
  if (result.thumbnail) res.embeds[0].thumbnail = { url: result.thumbnail };
  return res;
}

module.exports = {
  name: 'image',
  label: 'query',
  aliases: ['i', 'img'],
  description: 'Search the web for images on Google.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'query',
      description: 'Image search query.',
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

    try {
      let search = await googleImages(context, args.query, false); //safesearch is always on
      search = search.response;

      if (search.body.status == 2) return editOrReply(context, createEmbed('error', context, search.body.message));

      const pages = [];
      for (const res of search.body.results) {
        pages.push(createImageResultPage(context, res));
      }

      if (!pages.length) return editOrReply(context, createEmbed('warning', context, `No results found.`));

      return await createDynamicCardStack(context, {
        cards: pages,
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to perform google search.`));
    }
  },
};
