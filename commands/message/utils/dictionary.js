const { dictionary } = require('#api');
const { createDynamicCardStack } = require('#cardstack/index');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { smallPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { dictionaryGetCodeFromAny } = require('#utils/translate');
const { renderDictionaryEntry } = require('#utils/dictionary');
const { InteractiveComponentTypes, ResolveCallbackTypes } = require('#cardstack/constants');

module.exports = {
  name: 'dictionary',
  label: 'query',
  aliases: ['define', 'dict', 'definition', 'def', 'd'],
  metadata: {
    description: 'Looks up words and teminology in a dictionary.',
    description_short: 'Dictionary word definitions.',
    examples: ['define Gehen -lang de'],
    category: 'utils',
    usage: 'dictionary <query> [-lang <language>]',
    slashCommand: 'dictionary',
  },
  args: [{ name: 'lang', default: 'en', type: 'language', help: 'Language to define in' }],
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.query || args.query.length === 0)
      return editOrReply(context, createEmbed('warning', context, 'Missing query argument.'));

    const language = dictionaryGetCodeFromAny(args.lang);

    if (!language) return editOrReply(context, createEmbed('warning', context, 'Invalid Language'));

    try {
      let search = await dictionary(context, args.query, language);
      search = search.response;

      if (search.body.status === 1) return editOrReply(context, createEmbed('warning', context, search.body.message));

      const pages = [];

      let ri = 0;
      let di = 0;
      for (const r of search.body.results) {
        di = 0;
        for (const d of r.entries) {
          pages.push(renderDictionaryEntry(context, r, d, ri, di));
          di++;
        }
        ri++;
      }

      return await createDynamicCardStack(context, {
        cards: pages,
        interactive: {
          usage_examples: {
            type: InteractiveComponentTypes.BUTTON,
            label: 'Usage Examples',
            inline: true,
            visible: true,
            instantResult: true,
            condition: page => {
              return page.getState('usage_examples');
            },
            resolvePage: async pg => {
              const result = search.body.results[pg.getState('result')];
              const definition = result.entries[pg.getState('definition')];

              const usageCard = createEmbed('default', context, {
                description: `### ${pg.getState('term')}\n`,
              });

              const additional = definition.definitions
                .map(s => s.additional_examples)
                .flat(2)
                .filter(e => e !== undefined);

              if (additional.length >= 1)
                usageCard.description +=
                  '- ' +
                  additional
                    .map(value => ({ value, sort: Math.random() }))
                    .sort((a, b) => a.sort - b.sort)
                    .map(({ value }) => value)
                    .splice(0, 7)
                    .join('\n- ');

              if (search.body.trends) {
                usageCard.description += `\n\n-# Usage over time`;
                usageCard.image = { url: search.body.trends.image };
              }

              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: [page(usageCard)],
              };
            },
          },
          similar_and_opposite: {
            type: InteractiveComponentTypes.BUTTON,
            label: 'Similar and Opposite Words',
            inline: true,
            visible: true,
            instantResult: true,
            condition: page => {
              return page.getState('similar');
            },
            resolvePage: async pg => {
              const result = search.body.results[pg.getState('result')];
              const definition = result.entries[pg.getState('definition')];

              const similarCard = createEmbed('default', context, {
                description: `### ${pg.getState('term')}\n-# ${definition.type}\n\n`,
              });

              const synonyms = definition.definitions
                .map(d => d.synonyms)
                .flat(2)
                .filter(e => e !== undefined);
              const antonyms = definition.definitions
                .map(d => d.antonyms)
                .flat(2)
                .filter(e => e !== undefined);

              if (synonyms.length >= 1) {
                similarCard.description += `**Similar**\n-# ${synonyms.map(s => smallPill(s)).join(' ')}\n\n`;
              }

              if (antonyms.length >= 1) {
                similarCard.description += `**Opposite**\n-# ${antonyms.map(s => smallPill(s)).join(' ')}\n\n`;
              }

              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: [page(similarCard)],
              };
            },
          },
          term_origin: {
            type: InteractiveComponentTypes.BUTTON,
            label: 'Origin',
            inline: true,
            visible: true,
            instantResult: true,
            condition: page => {
              return page.getState('origin');
            },
            resolvePage: async pg => {
              const result = search.body.results[pg.getState('result')];

              const originCard = createEmbed('default', context, {
                description: `### ${pg.getState('term')}\n${result.origin.description}`,
              });

              if (result.origin.image) originCard.image = { url: result.origin.image };

              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: [page(originCard)],
              };
            },
          },
        },
      });
    } catch (e) {
      if (e.response?.body?.status && e.response.body.status === 2)
        return editOrReply(context, createEmbed('warning', context, e.response.body.message));
      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to perform dictionary lookup.`));
    }
  },
};
