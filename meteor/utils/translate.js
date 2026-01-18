const {
  TRANSLATE_LANGUAGES,
  TRANSLATE_LANGUAGE_MAPPINGS,
  TRANSLATE_LANGUAGE_ALIASES,
  DICTIONARY_LANGUAGES,
} = require('../constants');

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
