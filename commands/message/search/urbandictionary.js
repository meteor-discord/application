const { urbandictionary } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { link, iconPill, timestamp } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

function createUrbanPage(context, result) {
  let e = createEmbed('default', context, {
    description: `**${link(result.link, result.title)}**`,
    fields: [],
    footer: {
      iconUrl: STATICS.urbandictionary,
      text: `UrbanDictionary • ${context.application.name}`,
    },
  });
  if (result.description)
    e.fields.push({
      name: 'Description',
      value: result.description.substr(0, 1023),
      inline: true,
    });
  e.fields.push({
    name: 'Stats',
    value: `${iconPill('upvote', result.score.likes)}  ​  ${iconPill('downvote', result.score.dislikes)}\n**Author:** ${link(`https://www.urbandictionary.com/author.php?author=${encodeURIComponent(result.author)}`, result.author)}\n**Published:** ${timestamp(result.date, 'd')}`,
    inline: true,
  });
  if (result.example)
    e.fields.push({
      name: 'Example',
      value: result.example.substr(0, 1023),
      inline: false,
    });
  return page(e);
}

module.exports = {
  name: 'urbandictionary',
  label: 'query',
  aliases: ['urban', 'ud'],
  metadata: {
    description:
      'Returns search results from UrbanDictionary. Might include profanity.\nProviding no search query will return random results.',
    description_short: 'Search on UrbanDictionary',
    examples: ['ud urbandictionary'],
    category: 'search',
    usage: 'urbandictionary <query>',
    slashCommand: 'urbandictionary',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    try {
      let search = await urbandictionary(context, args.query);
      search = search.response;

      if (search.body.status == 1) return editOrReply(context, createEmbed('warning', context, search.body.message));

      let pages = [];
      for (const res of search.body.results) {
        pages.push(createUrbanPage(context, res));
      }

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to perform urban dictionary search.`));
    }
  },
};
