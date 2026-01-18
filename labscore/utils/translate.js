const {
  TRANSLATE_LANGUAGES,
  TRANSLATE_LANGUAGE_MAPPINGS,
  TRANSLATE_LANGUAGE_ALIASES,
  DICTIONARY_LANGUAGES,
} = require('../constants');

function getCode(desiredLang) {
  if (!desiredLang) {
    return false;
  }
  desiredLang = desiredLang.toLowerCase();

  if (TRANSLATE_LANGUAGES[desiredLang]) {
    return desiredLang;
  }

  var keys = Object.keys(TRANSLATE_LANGUAGES).filter(function (key) {
    if (typeof TRANSLATE_LANGUAGES[key] !== 'string') {
      return false;
    }

    if (TRANSLATE_LANGUAGES[key].toLowerCase() === desiredLang) return true;
    if (TRANSLATE_LANGUAGES[key].toLowerCase().startsWith(desiredLang)) return true;
    return false;
  });

  keys.push(
    Object.keys(TRANSLATE_LANGUAGE_MAPPINGS).filter(function (key) {
      if (typeof TRANSLATE_LANGUAGE_MAPPINGS[key] !== 'string') {
        return false;
      }

      if (TRANSLATE_LANGUAGE_MAPPINGS[key].toLowerCase() === desiredLang) return true;
      if (TRANSLATE_LANGUAGE_MAPPINGS[key].toLowerCase().startsWith(desiredLang)) return true;
      return false;
    })
  );

  return keys[0] || false;
}

module.exports.getCodeFromAny = function (prompt) {
  if (TRANSLATE_LANGUAGE_ALIASES[prompt.toLowerCase()]) prompt = TRANSLATE_LANGUAGE_ALIASES[prompt.toLowerCase()];
  if (TRANSLATE_LANGUAGES[prompt.toLowerCase()]) return prompt.toLowerCase();
  let languages = [];
  for (const i of Object.keys(TRANSLATE_LANGUAGES))
    if (
      !languages.includes(i) &&
      (TRANSLATE_LANGUAGES[i].toLowerCase() == prompt.toLowerCase() ||
        TRANSLATE_LANGUAGES[i].toLowerCase().startsWith(prompt.toLowerCase()))
    )
      languages.push(i);
  for (const i of Object.keys(TRANSLATE_LANGUAGE_MAPPINGS))
    if (!languages.includes(i) && TRANSLATE_LANGUAGE_MAPPINGS[i].toLowerCase() == prompt.toLowerCase())
      languages.push(i);
  return languages[0];
};

module.exports.dictionaryGetCodeFromAny = function (prompt) {
  if (DICTIONARY_LANGUAGES[prompt.toLowerCase()]) return prompt.toLowerCase();
  let languages = [];
  for (const i of Object.keys(DICTIONARY_LANGUAGES))
    if (!languages.includes(i) && DICTIONARY_LANGUAGES[i].toLowerCase() == prompt.toLowerCase()) languages.push(i);
  return languages[0];
};

module.exports.getDictionaryFromAny = function (prompt) {
  let languages = [];
  if (DICTIONARY_LANGUAGES[prompt.toLowerCase()]) languages.push(prompt.toLowerCase());
  for (const i of Object.keys(DICTIONARY_LANGUAGES))
    if (
      !languages.includes(i) &&
      (DICTIONARY_LANGUAGES[i].toLowerCase() == prompt.toLowerCase() ||
        DICTIONARY_LANGUAGES[i].toLowerCase().includes(prompt.toLowerCase()))
    )
      languages.push(i);
  return languages;
};

module.exports.getLanguagesFromAny = function (prompt) {
  let languages = [];
  if (TRANSLATE_LANGUAGE_ALIASES[prompt.toLowerCase()]) prompt = TRANSLATE_LANGUAGE_ALIASES[prompt.toLowerCase()];
  if (TRANSLATE_LANGUAGES[prompt.toLowerCase()]) languages.push(prompt.toLowerCase());
  for (const i of Object.keys(TRANSLATE_LANGUAGES))
    if (
      !languages.includes(i) &&
      (TRANSLATE_LANGUAGES[i].toLowerCase() == prompt.toLowerCase() ||
        TRANSLATE_LANGUAGES[i].toLowerCase().includes(prompt.toLowerCase()))
    )
      languages.push(i);
  for (const i of Object.keys(TRANSLATE_LANGUAGE_MAPPINGS))
    if (!languages.includes(i) && TRANSLATE_LANGUAGE_MAPPINGS[i].toLowerCase() == prompt.toLowerCase())
      languages.push(i);
  return languages;
};

module.exports.isSupported = function (desiredLang) {
  return Boolean(module.exports.getCodeFromAny(desiredLang));
};
