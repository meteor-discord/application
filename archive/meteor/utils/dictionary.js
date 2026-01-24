const { createEmbed, page } = require('./embed');
const { link, smallPill, icon } = require('./markdown');

const LABELS = {
  offensive: `Offensive`,
  informal: `Informal`,
};

function renderDictionaryEntry(context, result, definition, resultIndex, definitionIndex) {
  const card = createEmbed('default', context, {
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

module.exports.LABELS = LABELS;
module.exports.renderDictionaryEntry = renderDictionaryEntry;
