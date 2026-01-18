const { duckduckgo } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { citation, link, favicon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');
const {
  ApplicationCommandOptionTypes,
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} = require('detritus-client/lib/constants');

function renderFooter(context, bang) {
  if (!bang)
    return {
      iconUrl: STATICS.duckduckgo,
      text: `DuckDuckGo • ${context.application.name}`,
    };

  return {
    iconUrl: favicon(bang.site),
    text: `${bang.name} • DuckDuckGo • ${context.application.name}`,
  };
}

// `type` can be found in search_service/endpoints/duckduckgo.js
function createSearchResultPage(context, entry, bang) {
  let res;
  switch (entry.type) {
    case 1: // WebPage
      res = page(
        createEmbed('default', context, {
          author: {
            iconUrl: favicon(entry.result.url),
            name: new URL(entry.result.url).host,
            url: entry.result.url,
          },
          url: entry.result.url,
          title: entry.result.title,
          fields: [],
          description: `${entry.result.snippet}`,
          footer: renderFooter(context, bang),
        })
      );
      if (entry.result.image) res.embeds[0].thumbnail = { url: entry.result.image };
      if (entry.result.deepLinks) {
        let fl = entry.result.deepLinks;
        while (fl.length >= 1) {
          fields = fl.splice(0, 4);
          fields = fields.map(f => link(f.url, f.title));
          res.embeds[0].fields.push({
            name: '​',
            value: fields.join('\n'),
            inline: true,
          });
        }
      }
      break;
    case 2: // Entity
      res = page(
        createEmbed('default', context, {
          author: {
            iconUrl: favicon(entry.result.url),
            name: entry.result.title,
            url: entry.result.url,
          },
          description: `${entry.result.description}`,
          fields: [],
          footer: renderFooter(context, bang),
        })
      );
      if (entry.result.sources.description)
        res.embeds[0].description += citation(
          1,
          entry.result.sources.description.url,
          `Source: ${entry.result.sources.description.title}`
        );
      if (entry.result.image) res.embeds[0].thumbnail = { url: entry.result.image };
      if (entry.result.fields) {
        // only up to 6 fields
        for (const f of entry.result.fields.splice(0, 6)) {
          if (f.url) {
            res.embeds[0].fields.push({
              name: f.title,
              value: f.value,
              inline: true,
            });
            continue;
          }
          res.embeds[0].fields.push({
            name: f.title,
            value: f.value,
            inline: true,
          });
        }
      }
      break;
    default:
      break;
  }

  return res;
}

module.exports = {
  name: 'duckduckgo',
  description: 'Search on DuckDuckGo. Supports !bangs.',
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
      let search = await duckduckgo(context, args.query, context.channel.nsfw);
      search = search.response;

      if (search.body.status === 2) return editOrReply(context, createEmbed('error', context, search.body.message));
      if (search.body.status === 5)
        return editOrReply(
          context,
          createEmbed(
            'nsfw',
            context,
            'This search is primarily adult-oriented and can only be ran in Age Restricted channels.'
          )
        );

      let pages = [];
      for (const res of search.body.results) {
        let sp = createSearchResultPage(context, res, search.body.bang);
        if (sp) pages.push(sp);
      }

      if (!pages.length) return editOrReply(context, createEmbed('warning', context, `No results found.`));

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to perform DuckDuckGo search.`));
    }
  },
};
