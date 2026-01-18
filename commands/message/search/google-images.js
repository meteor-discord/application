const { googleImages } = require('#api');
const { createDynamicCardStack } = require('#cardstack/index');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { favicon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

function createImageResultPage(context, result) {
  let res = page(
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
  aliases: ['i', 'img', 'images'],
  metadata: {
    description: 'Returns image search results from Google.',
    description_short: 'Search on Google Images',
    examples: ['image Eurasian Small Clawed Otter'],
    category: 'search',
    usage: 'image <query>',
    slashCommand: 'image',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.query) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (query).`));
    try {
      let search = await googleImages(context, args.query, context.channel.nsfw);
      search = search.response;

      if (search.body.status == 2) return editOrReply(context, createEmbed('error', context, search.body.message));

      let pages = [];
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
