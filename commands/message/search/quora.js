const { quora, quoraResult } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { link, pill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS, STATIC_ASSETS } = require('#utils/statics');

const { InteractionCallbackTypes } = require('detritus-client/lib/constants');
const { Components } = require('detritus-client/lib/utils');

function createQuoraAnswerPage(context, question, answer) {
  let tags = question.tags.map(t => {
    return pill(t);
  });
  let res = page(
    createEmbed('default', context, {
      title: question.title,
      url: answer.url,
      description: `${tags.splice(0, 3).join('  ')}\n\n${answer.content.substr(0, 2000)}`,
      footer: {
        iconUrl: STATICS.quora,
        text: `Quora • ${context.application.name}`,
      },
    })
  );

  if (answer.content.length >= 2000) {
    if (res.embeds[0].description.endsWith(' '))
      res.embeds[0].description = res.embeds[0].description.substr(0, res.embeds[0].description.length - 1);
    res.embeds[0].description += link(answer.url, '...', 'Click to read the entire answer.');
  }

  if (answer.author) {
    res.embeds[0].author = {
      name: answer.author.name.substr(0, 1000),
      iconUrl: answer.author.icon,
      url: answer.author.url,
    };
  }
  return res;
}

async function quoraPaginator(context, pages, refMappings, currentRef) {
  const paging = await paginator.createPaginator({
    context,
    pages,
    buttons: ['previous', 'next', 'search'],
    disableCloning: true,
  });

  paging.on('interaction', async ({ context: ctx, listener }) => {
    if (ctx.customId == 'search') {
      // Kill the original paginator and replace it with a select
      listener.stopWithoutUpdate();

      const components = new Components({
        timeout: 100000,
        run: async sctx => {
          if (sctx.userId !== context.userId) {
            return await sctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }
          await sctx.editOrRespond({
            embeds: [
              createEmbed('image', context, {
                url: STATIC_ASSETS.chat_loading,
                provider: {
                  icon: STATICS.quora,
                  text: `Quora • ${context.application.name}`,
                },
              }),
            ],
            components: [],
          });
          // Get the page reference and fetch the results
          let ref = refMappings.filter(r => r.ref == sctx.data.values[0]);
          ref = ref[0];
          try {
            let search = await quoraResult(context, ref.link);
            search = search.response.body;

            if (search.status == 2) return editOrReply(context, createEmbed('error', context, search.message));

            let nextPages = [];
            // Create the initial page

            for (const answer of search.answers) {
              nextPages.push(createQuoraAnswerPage(context, search.question, answer));
            }

            nextPages = formatPaginationEmbeds(nextPages);

            await quoraPaginator(context, nextPages, refMappings, sctx.data.values[0]);
          } catch (e) {
            console.log(e);
            return editOrReply(context, createEmbed('error', context, `Unable to perform quora search.`));
          }
        },
      });

      let selectOptions = refMappings.map(r => {
        return {
          label: r.title,
          value: r.ref,
          default: r.ref == currentRef,
        };
      });

      components.addSelectMenu({
        defaultValues: [],
        placeholder: 'Select a question.',
        customId: 'quora-select',
        options: selectOptions,
      });

      await ctx.editOrRespond({ embeds: context.response.embeds, components });
    }
  });
}

module.exports = {
  name: 'quora',
  label: 'query',
  aliases: ['q'],
  metadata: {
    description: 'Searches for questions on Quora.',
    description_short: 'Search on Quora',
    examples: ['quora How does Quora work?'],
    category: 'search',
    usage: 'quora <query>',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.query) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (query).`));
    try {
      let search = await quora(context, args.query);
      search = search.response.body;

      if (search.status == 2) return editOrReply(context, createEmbed('error', context, search.message));

      let pages = [];

      // Create the initial page
      for (const answer of search.answers) {
        pages.push(createQuoraAnswerPage(context, search.question, answer));
      }

      pages = formatPaginationEmbeds(pages);

      const refMappings = search.results;

      await quoraPaginator(context, pages, refMappings, refMappings[0].ref);
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to perform quora search.`));
    }
  },
};
