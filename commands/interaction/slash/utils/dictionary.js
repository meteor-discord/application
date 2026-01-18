const { dictionary } = require('#api');
const { createDynamicCardStack } = require('#cardstack/index');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { link, smallPill, icon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

const { dictionaryLanguage } = require('#parameters').autocomplete;

const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');
const { InteractiveComponentTypes, ResolveCallbackTypes } = require('#cardstack/constants');

// TODO(unity): single constant
const LABELS = {
  offensive: `Offensive`,
  informal: `Informal`,
};

// TODO(unity)
function renderDictionaryEntry(context, result, definition, resultIndex, definitionIndex) {
  let card = createEmbed('default', context, {
    description: `### ${result.word}\n-# ${result.phonetic ? `${result.phonetic}  •  ` : ''}${definition.type}\n\n`,
    url: `https://en.wiktionary.org/wiki/${encodeURIComponent(result.word)}`,
    fields: [],
  });

  if (definition.labels?.filter(l => LABELS[l]).filter(e => e !== undefined).length >= 1)
    card.description += `-# ⚠ ${definition.labels
      .map(l => LABELS[l])
      .filter(e => e !== undefined)
      .join(' ⚠ ')}\n`;

  let defs = [];
  let i = 1;
  for (const d of definition.definitions) {
    let def = `${i++}. ${d.definition}`;

    if (d.labels?.filter(l => LABELS[l]).filter(e => e !== undefined).length >= 1)
      def =
        `-# ⚠ ${d.labels
          .map(l => LABELS[l])
          .filter(e => e !== undefined)
          .join(' ⚠ ')}\n` + def;
    if (d.example) def += `\n  - *${d.example}*`;

    let nyms = [];

    if (d.synonyms) nyms = nyms.concat(d.synonyms.map(sd => smallPill(sd)));

    // Display up to 6 random synonyms/antonyms
    if (nyms.length >= 1) {
      nyms = nyms
        .splice(0, 6)
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);

      def += `\n-#   ${nyms.join('  ')}`;
    }

    defs.push(def);
  }

  if (defs.length > 5) {
    defs = defs.splice(0, 5);
    defs.push(
      link(
        `https://www.google.com/search?q=define+${encodeURIComponent(result.word)}`,
        `More Definitions ${icon('open_in_new')}`
      )
    );
  }
  card.description += defs.join('\n\n');

  return page(
    card,
    {},
    {
      usage_examples:
        definition.definitions
          .map(s => s.additional_examples)
          .flat()
          .filter(e => e !== undefined).length >= 1,
      similar:
        definition.definitions
          .map(s => s.synonyms)
          .flat()
          .filter(e => e !== undefined).length >= 1 ||
        definition.definitions
          .map(s => s.antonyms)
          .flat()
          .filter(e => e !== undefined).length >= 1,
      origin: result.origin !== undefined,
      result: resultIndex,
      definition: definitionIndex,
      term: result.word,
    }
  );
}

module.exports = {
  name: 'dictionary',
  description: 'Define a word from the dictionary.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'term',
      description: 'Term to look up.',
      type: ApplicationCommandOptionTypes.STRING,
      required: true,
    },
    {
      name: 'language',
      description: 'Language of the term.',
      onAutoComplete: dictionaryLanguage,
      required: false,
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

    if (!args.language) args.language = 'en';

    try {
      let search = await dictionary(context, args.term, args.language);
      search = search.response;

      if (search.body.status === 1) return editOrReply(context, createEmbed('warning', context, search.body.message));

      let pages = [];

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
              let result = search.body.results[pg.getState('result')];
              let definition = result.entries[pg.getState('definition')];

              let usageCard = createEmbed('default', context, {
                description: `### ${pg.getState('term')}\n`,
              });

              let additional = definition.definitions
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
              let result = search.body.results[pg.getState('result')];
              let definition = result.entries[pg.getState('definition')];

              let similarCard = createEmbed('default', context, {
                description: `### ${pg.getState('term')}\n-# ${definition.type}\n\n`,
              });

              let synonyms = definition.definitions
                .map(d => d.synonyms)
                .flat(2)
                .filter(e => e !== undefined);
              let antonyms = definition.definitions
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
              let result = search.body.results[pg.getState('result')];

              let originCard = createEmbed('default', context, {
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
