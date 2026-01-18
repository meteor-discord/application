const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');

const superagent = require('superagent');

// TODO: create a favicon() util
module.exports = {
  name: 'xkcd',
  label: 'query',
  metadata: {
    description: 'Search XKCD comics.',
    description_short: 'Search XKCD comics.',
    examples: ['xkcd lead pipe'],
    category: 'search',
    usage: 'xkcd <query>',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.query) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (query).`));

    if (!isNaN(parseInt(args.query))) {
      try {
        let search = await superagent.get(`https://xkcd.com/${parseInt(args.query)}/info.0.json`);

        return editOrReply(
          context,
          createEmbed('default', context, {
            author: {
              name: search.body.safe_title,
              url: `https://xkcd.com/${search.body.num}/`,
            },
            description: search.body.alt,
            image: {
              url: search.body.img,
            },
            footer: {
              iconUrl: `https://www.google.com/s2/favicons?domain=xkcd.com&sz=256`,
              text: `xkcd • ${context.application.name}`,
            },
          })
        );
      } catch (e) {
        return editOrReply(context, createEmbed('error', context, `Comic not found.`));
      }
    } else {
      try {
        let search = await superagent
          .post(
            `https://qtg5aekc2iosjh93p.a1.typesense.net/multi_search?use_cache=true&x-typesense-api-key=${process.env.XKCD_KEY}`
          )
          .send({
            searches: [
              {
                query_by: 'title,altTitle,transcript,topics,embedding',
                query_by_weights: '127,80,80,1,1',
                num_typos: 1,
                exclude_fields: 'embedding',
                vector_query: 'embedding:([], k: 30, distance_threshold: 0.1, alpha: 0.9)',
                highlight_full_fields: 'title,altTitle,transcript,topics,embedding',
                collection: 'xkcd',
                q: args.query,
                facet_by: 'topics,publishDateYear',
                max_facet_values: 100,
                page: 1,
                per_page: 100,
              },
            ],
          });

        let pages = [];
        for (const res of search.body.results[0].hits) {
          pages.push(
            page(
              createEmbed('default', context, {
                author: {
                  name: res.document.title,
                  url: `https://xkcd.com/${res.document.id}/`,
                },
                description: res.document.altTitle,
                image: {
                  url: res.document.imageUrl,
                },
                footer: {
                  iconUrl: `https://www.google.com/s2/favicons?domain=xkcd.com&sz=256`,
                  text: `xkcd • ${context.application.name}`,
                },
              })
            )
          );
        }

        if (!pages.length) return editOrReply(context, createEmbed('warning', context, `No results found.`));

        await paginator.createPaginator({
          context,
          pages: formatPaginationEmbeds(pages),
        });
      } catch (e) {
        console.log(e);
        return editOrReply(context, createEmbed('error', context, `Unable to perform xkcd search.`));
      }
    }
  },
};
