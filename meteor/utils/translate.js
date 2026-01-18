const {
  TRANSLATE_LANGUAGES,
  TRANSLATE_LANGUAGE_MAPPINGS,
  TRANSLATE_LANGUAGE_ALIASES,
  DICTIONARY_LANGUAGES,
} = require('../constants');
const { googleTranslateMulti } = require('../api');
const { icon, stringwrap } = require('./markdown');
const { MessageEmbedTypes } = require('detritus-client/lib/constants');

module.exports.translateMessage = async function (context, message, to, from) {
  const mappings = {};

  if (message.content) {
    // Special Case - this is (very very very likely) a 1p translated message
    if (message.content.startsWith(`-# ${icon('subtext_translate')}`)) {
      const cnt = message.content.split('\n');
      cnt.shift();
      if (cnt.length >= 1) {
        mappings.content = cnt.join('\n');
      }
    } else mappings.content = message.content;
  }
  if (message.embeds) {
    let i = 0;
    // Message Translation supports Descriptions and Fields
    for (const e of message.embeds) {
      const emb = e[1];

      if (![MessageEmbedTypes.ARTICLE, MessageEmbedTypes.RICH, MessageEmbedTypes.LINK].includes(emb.type)) continue;
      if (emb.description) mappings['embeds/' + i + '/description'] = emb.description;
      if (emb.title) mappings['embeds/' + i + '/title'] = emb.title;
      if (emb.author?.name) mappings['embeds/' + i + '/author/name'] = emb.author.name;
      if (emb.footer?.text) mappings['embeds/' + i + '/footer/text'] = emb.footer.text;

      if (emb.fields) {
        let fi = 0;
        for (const f of emb.fields) {
          mappings['embeds/' + i + '/fields/' + fi + '/name'] = f[1].name;
          mappings['embeds/' + i + '/fields/' + fi + '/value'] = f[1].value;
          fi++;
        }
      }
      i++;
    }
  }

  // Cancel if we don't have anything that can be translated
  if (Object.keys(mappings).length === 0) return {};

  // Translate message via multitranslate endpoint on 1p
  try {
    const translation = await googleTranslateMulti(context, mappings, to, from);

    const tr = translation.response.body.translations;

    // Deserialize message
    const result = {};

    // This relies on mappings.content to handle the special case
    if (mappings.content) result.content = tr.content;

    if (message.embeds) {
      let i = 0;
      result.embeds = [];
      // Message Translation supports Descriptions and Fields
      for (const e of message.embeds) {
        const emb = e[1];

        if (![MessageEmbedTypes.ARTICLE, MessageEmbedTypes.RICH, MessageEmbedTypes.LINK].includes(emb.type)) continue;
        const newEmbed = {
          fields: [],
        };

        // Elements we don't translate
        if (emb.color) newEmbed.color = emb.color;
        if (emb.url) newEmbed.url = emb.url;

        if (emb.thumbnail) {
          // Special Case, articles render differently
          if (emb.type === MessageEmbedTypes.ARTICLE) newEmbed.image = emb.thumbnail;
          else newEmbed.thumbnail = emb.thumbnail;
        }
        if (emb.image) newEmbed.image = emb.image;

        if (emb.title) newEmbed.title = stringwrap(tr['embeds/' + i + '/title'], 256);

        if (emb.description) newEmbed.description = stringwrap(tr['embeds/' + i + '/description'], 4096);

        if (emb.author) newEmbed.author = { ...emb.author };
        if (emb.author?.name) newEmbed.author.name = stringwrap(tr['embeds/' + i + '/author/name'], 256);

        if (emb.footer) newEmbed.footer = { ...emb.footer };
        if (emb.footer?.text) newEmbed.footer.text = stringwrap(tr['embeds/' + i + '/footer/text'], 2048);

        if (emb.fields) {
          let fi = 0;
          for (const f of emb.fields) {
            newEmbed.fields[fi] = {
              inline: f[1].inline,
            };

            newEmbed.fields[fi].name = stringwrap(tr['embeds/' + i + '/fields/' + fi + '/name'], 256);
            newEmbed.fields[fi].value = stringwrap(tr['embeds/' + i + '/fields/' + fi + '/value'], 1024);
            fi++;
          }
        }
        result.embeds[i] = { ...newEmbed };
        i++;
      }
    }

    return {
      message: result,
      metadata: translation.response.body,
    };
  } catch (e) {
    console.log(e);
    console.log(mappings);
    throw new Error('Translation Failed.');
  }
};

module.exports.getCodeFromAny = function (prompt) {
  if (TRANSLATE_LANGUAGE_ALIASES[prompt.toLowerCase()]) prompt = TRANSLATE_LANGUAGE_ALIASES[prompt.toLowerCase()];
  if (TRANSLATE_LANGUAGES[prompt.toLowerCase()]) return prompt.toLowerCase();
  const languages = [];
  for (const i of Object.keys(TRANSLATE_LANGUAGES))
    if (
      !languages.includes(i) &&
      (TRANSLATE_LANGUAGES[i].toLowerCase() === prompt.toLowerCase() ||
        TRANSLATE_LANGUAGES[i].toLowerCase().startsWith(prompt.toLowerCase()))
    )
      languages.push(i);
  for (const i of Object.keys(TRANSLATE_LANGUAGE_MAPPINGS))
    if (!languages.includes(i) && TRANSLATE_LANGUAGE_MAPPINGS[i].toLowerCase() === prompt.toLowerCase())
      languages.push(i);
  return languages[0];
};

module.exports.dictionaryGetCodeFromAny = function (prompt) {
  if (DICTIONARY_LANGUAGES[prompt.toLowerCase()]) return prompt.toLowerCase();
  const languages = [];
  for (const i of Object.keys(DICTIONARY_LANGUAGES))
    if (!languages.includes(i) && DICTIONARY_LANGUAGES[i].toLowerCase() === prompt.toLowerCase()) languages.push(i);
  return languages[0];
};

module.exports.getDictionaryFromAny = function (prompt) {
  const languages = [];
  if (DICTIONARY_LANGUAGES[prompt.toLowerCase()]) languages.push(prompt.toLowerCase());
  for (const i of Object.keys(DICTIONARY_LANGUAGES))
    if (
      !languages.includes(i) &&
      (DICTIONARY_LANGUAGES[i].toLowerCase() === prompt.toLowerCase() ||
        DICTIONARY_LANGUAGES[i].toLowerCase().includes(prompt.toLowerCase()))
    )
      languages.push(i);
  return languages;
};

module.exports.getLanguagesFromAny = function (prompt) {
  const languages = [];
  if (TRANSLATE_LANGUAGE_ALIASES[prompt.toLowerCase()]) prompt = TRANSLATE_LANGUAGE_ALIASES[prompt.toLowerCase()];
  if (TRANSLATE_LANGUAGES[prompt.toLowerCase()]) languages.push(prompt.toLowerCase());
  for (const i of Object.keys(TRANSLATE_LANGUAGES))
    if (
      !languages.includes(i) &&
      (TRANSLATE_LANGUAGES[i].toLowerCase() === prompt.toLowerCase() ||
        TRANSLATE_LANGUAGES[i].toLowerCase().includes(prompt.toLowerCase()))
    )
      languages.push(i);
  for (const i of Object.keys(TRANSLATE_LANGUAGE_MAPPINGS))
    if (!languages.includes(i) && TRANSLATE_LANGUAGE_MAPPINGS[i].toLowerCase() === prompt.toLowerCase())
      languages.push(i);
  return languages;
};

module.exports.isSupported = function (desiredLang) {
  return Boolean(module.exports.getCodeFromAny(desiredLang));
};
