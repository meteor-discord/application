const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');
const { USER_AGENT } = require('#utils/user-agent');

const superagent = require('superagent');

module.exports = {
  name: 'wikipedia',
  label: 'query',
  aliases: ['wiki'],
  metadata: {
    description: 'Returns search results from Wikipedia.',
    description_short: 'Search on Wikipedia',
    examples: ['wiki otters'],
    category: 'search',
    usage: 'wikipedia <query>',
    slashCommand: 'wikipedia',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    try {
      const search = await superagent
        .get(`https://api.wikimedia.org/core/v1/wikipedia/en/search/page`)
        .query({
          q: args.query,
          limit: 100,
          language: 'en',
        })
        .set('User-Agent', USER_AGENT);

      const pages = [];

      if (!search.body.pages.length) return editOrReply(context, createEmbed('error', context, `No results found.`));

      for (const res of Object.values(search.body.pages)) {
        const p = createEmbed('default', context, {
          author: {
            name: res.title,
            url: `https://en.wikipedia.org/wiki/${res.key}`,
          },
          footer: {
            iconUrl: STATICS.wikipedia,
            text: `Wikipedia • ${context.application.name}`,
          },
        });

        if (res.thumbnail && res.thumbnail.url)
          p.thumbnail = {
            url: 'https:' + res.thumbnail.url.replace(/d3\/.*?\/\d*px-/, '/d3/').replace('/thumb/d/', '/d'),
          };

        if (res.excerpt) p.description = res.excerpt.replace(/<.*?>/g, '');

        pages.push(page(p));
      }

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
      });
    } catch {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to perform wikipedia search.`));
    }
  },
};
