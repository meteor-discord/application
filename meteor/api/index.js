const superagent = require('superagent');
const { Api, Hosts } = require('./endpoints');
const { USER_AGENT } = require('#utils/user-agent');

async function request(path, type, headers, args, host) {
  const timing = Date.now();
  let url = Api.HOST + path;
  if (process.env.USE_LOCAL_API) url = Hosts.local + ':' + process.env.USE_LOCAL_API + path;
  if (host) url = host + path;

  // apply default headers
  if (!headers.Authorization) headers.Authorization = `Bearer ${process.env.API_KEY}`;
  if (!headers['user-agent']) headers['user-agent'] = USER_AGENT;
  if (!headers['x-meteor-client']) headers['x-meteor-client'] = USER_AGENT;

  if (type === 'GET') {
    if (!args) {
      const response = await superagent.get(url).set(headers);
      return {
        timings: ((Date.now() - timing) / 1000).toFixed(2),
        response,
      };
    }
    const response = await superagent.get(url).query(args).set(headers);
    return {
      timings: ((Date.now() - timing) / 1000).toFixed(2),
      response,
    };
  }
  if (type === 'POST') {
    const response = await superagent.post(url).set(headers).send(args);
    return {
      timings: ((Date.now() - timing) / 1000).toFixed(2),
      response,
    };
  }
  throw new Error('unsupported, must either use GET or POST');
}

module.exports.googleTranslate = async function (context, text, to, from) {
  return await request(
    Api.GOOGLE_TRANSLATE,
    'GET',
    {},
    {
      text,
      to,
      from,
    }
  );
};

module.exports.googleTranslateMulti = async function (context, messages, to, from) {
  return await request(
    Api.GOOGLE_TRANSLATE_MULTI,
    'POST',
    {},
    {
      messages,
      to,
      from,
    }
  );
};

module.exports.googleVisionLabels = async function (context, url) {
  return await request(
    Api.GOOGLE_VISION_LABELS,
    'GET',
    {},
    {
      url,
    }
  );
};

module.exports.googleVisionOcr = async function (context, url) {
  return await request(
    Api.GOOGLE_VISION_OCR,
    'GET',
    {},
    {
      url,
    }
  );
};

module.exports.googleVisionSafetyLabels = async function (context, url) {
  return await request(
    Api.GOOGLE_VISION_SAFETY_LABELS,
    'GET',
    {},
    {
      url,
    }
  );
};

module.exports.google = async function (context, query, nsfw) {
  return await request(
    Api.SEARCH_GOOGLE,
    'GET',
    {},
    {
      q: query,
      nsfw,
    }
  );
};

module.exports.googleImages = async function (context, query, nsfw) {
  return await request(
    Api.SEARCH_GOOGLE_IMAGES,
    'GET',
    {},
    {
      q: query,
      nsfw,
    }
  );
};

module.exports.googleNews = async function (context, query) {
  return await request(
    Api.SEARCH_GOOGLE_NEWS,
    'GET',
    {},
    {
      q: query,
    }
  );
};

module.exports.googleNewsSupplemental = async function (context, supplementalKey) {
  return await request(
    Api.SEARCH_GOOGLE_NEWS_SUPPLEMENTAL,
    'GET',
    {},
    {
      supplemental_key: supplementalKey,
    }
  );
};

module.exports.lyrics = async function (context, query) {
  return await request(
    Api.SEARCH_LYRICS,
    'GET',
    {},
    {
      q: query,
    }
  );
};

module.exports.maps = async function (context, query) {
  return await request(
    Api.SEARCH_GOOGLE_MAPS,
    'GET',
    {},
    {
      q: query,
    }
  );
};

module.exports.mapsSupplemental = async function (context, supplementalKey) {
  return await request(
    Api.SEARCH_GOOGLE_MAPS_SUPPLEMENTAL,
    'GET',
    {},
    {
      supplemental_key: supplementalKey,
    }
  );
};

module.exports.quora = async function (context, query) {
  return await request(
    Api.SEARCH_QUORA,
    'GET',
    {},
    {
      q: query,
    }
  );
};

module.exports.quoraResult = async function (context, reference) {
  return await request(
    Api.SEARCH_QUORA_RESULT,
    'GET',
    {},
    {
      ref: reference,
    }
  );
};

module.exports.rule34 = async function (context, query, service) {
  return await request(
    Api.SEARCH_RULE34,
    'GET',
    {},
    {
      q: query,
      service,
    }
  );
};

module.exports.bing = async function (context, query, nsfw) {
  return await request(
    Api.SEARCH_BING,
    'GET',
    {},
    {
      q: query,
      nsfw,
    }
  );
};

module.exports.bingImages = async function (context, query, nsfw) {
  return await request(
    Api.SEARCH_BING_IMAGES,
    'GET',
    {},
    {
      q: query,
      nsfw,
    }
  );
};

module.exports.duckduckgo = async function (context, query, nsfw) {
  return await request(
    Api.SEARCH_DUCKDUCKGO,
    'GET',
    {},
    {
      q: query,
      nsfw,
    }
  );
};

module.exports.reverseImageSearch = async function (context, url) {
  return await request(
    Api.SEARCH_REVERSE_IMAGE,
    'GET',
    {},
    {
      url,
    }
  );
};

module.exports.urbandictionary = async function (context, query) {
  return await request(
    Api.SEARCH_URBANDICTIONARY,
    'GET',
    {},
    {
      q: query,
    }
  );
};

module.exports.weather = async function (context, location) {
  return await request(
    Api.SEARCH_WEATHER,
    'GET',
    {},
    {
      location,
    }
  );
};

module.exports.darksky = async function (context, location) {
  return await request(
    Api.UTILS_WEATHER,
    'GET',
    {},
    {
      location,
    }
  );
};

module.exports.wikihow = async function (context, query) {
  return await request(
    Api.SEARCH_WIKIHOW,
    'GET',
    {},
    {
      q: query,
    }
  );
};

module.exports.wolframAlpha = async function (context, query) {
  return await request(
    Api.SEARCH_WOLFRAM_ALPHA,
    'GET',
    {},
    {
      q: query,
    }
  );
};

module.exports.wolframSupplemental = async function (context, supplementalKey) {
  return await request(
    Api.SEARCH_WOLFRAM_SUPPLEMENTAL,
    'GET',
    {},
    {
      supplemental_key: supplementalKey,
    }
  );
};

module.exports.youtube = async function (context, query, category) {
  return await request(
    Api.SEARCH_YOUTUBE,
    'GET',
    {},
    {
      q: query,
      category,
    }
  );
};

module.exports.imtranslator = async function (context, text, voice) {
  return await request(
    Api.TTS_IMTRANSLATOR,
    'GET',
    {},
    {
      text,
      voice,
    }
  );
};

module.exports.moonbase = async function (context, text) {
  return await request(
    Api.TTS_MOONBASE,
    'GET',
    {},
    {
      text,
    }
  );
};

module.exports.playht = async function (context, text, voice) {
  return await request(
    Api.TTS_PLAYHT,
    'GET',
    {},
    {
      text,
      voice,
    }
  );
};

module.exports.sapi4 = async function (context, text, voice, pitch = 50, speed = 150) {
  return await request(
    Api.TTS_SAPI4,
    'GET',
    {},
    {
      text,
      voice,
      pitch,
      speed,
    }
  );
};

module.exports.tiktok = async function (context, text, voice) {
  return await request(
    Api.TTS_TIKTOK,
    'GET',
    {},
    {
      text,
      voice,
    }
  );
};

module.exports.dictionary = async function (context, query, language) {
  return await request(
    Api.UTILS_DICTIONARY,
    'GET',
    {},
    {
      q: query,
      l: language,
    }
  );
};

module.exports.emojipedia = async function (context, emoji, codepoint = undefined) {
  return await request(
    Api.UTILS_EMOJIPEDIA,
    'GET',
    {},
    {
      emoji,
      with_metadata: '',
      codepoint,
    }
  );
};

module.exports.inhouseEmojiSearch = async function (context, emoji, codepoint = undefined) {
  return await request(
    Api.UTILS_EMOJI_SEARCH,
    'GET',
    {},
    {
      q: emoji,
      with_metadata: '',
      codepoint,
    }
  );
};

module.exports.garfield = async function () {
  return await request(Api.UTILS_GARFIELD, 'GET', {}, {});
};
module.exports.otter = async function () {
  return await request(Api.UTILS_OTTER, 'GET', {}, {});
};

module.exports.perspective = async function (context, content = []) {
  return await request(
    Api.UTILS_PERSPECTIVE,
    'GET',
    {},
    {
      input: content.join('\n\n'),
    }
  );
};

module.exports.screenshot = async function (context, url, nsfw) {
  return await request(
    Api.UTILS_SCREENSHOT,
    'GET',
    {},
    {
      url,
      nsfw,
    }
  );
};

module.exports.unicodeMetadata = async function (context, string) {
  return await request(
    Api.UTILS_UNICODE_METADATA,
    'GET',
    {},
    {
      q: string,
    }
  );
};

module.exports.webshot = async function (context, url, nsfw) {
  return await request(
    Api.UTILS_WEBSHOT,
    'GET',
    {},
    {
      url,
      nsfw,
    }
  );
};
module.exports.emojiKitchen = async function (emoji) {
  return await superagent.get('https://api.giphy.com/v1/gifs/search').query({
    api_key: process.env.GIPHY_API_KEY,
    q: emoji.join('_'),
    limit: 1,
    rating: 'g',
  });
};

// Omnisearch

module.exports.anime = async function (context, query, includeAdultContent) {
  return await request(
    Api.OMNI_ANIME,
    'GET',
    {},
    {
      q: query,
      include_adult: includeAdultContent,
    }
  );
};

module.exports.animeSupplemental = async function (context, supplementalKey) {
  return await request(
    Api.OMNI_ANIME_SUPPLEMENTAL,
    'GET',
    {},
    {
      supplemental_key: supplementalKey,
    }
  );
};

module.exports.manga = async function (context, query, includeAdultContent) {
  return await request(
    Api.OMNI_MANGA,
    'GET',
    {},
    {
      q: query,
      include_adult: includeAdultContent,
    }
  );
};

module.exports.movie = async function (context, query, includeAdultContent) {
  return await request(
    Api.OMNI_MOVIE,
    'GET',
    {},
    {
      q: query,
      include_adult: includeAdultContent,
    }
  );
};

// MONOLITH2
module.exports.LlmPrivateBard = async function (context, prompt) {
  return await request(
    Api.LLM_PRIVATE_BARD,
    'POST',
    {},
    {
      prompt,
    }
  );
};

// GENERATIVEAI (PARROT)
module.exports.gemini = async function (context, prompt) {
  return await request(
    Api.PARROT_GOOGLE_GEMINI_PRO,
    'POST',
    {},
    {
      prompt,
    }
  );
};

// FLAMINGO
// FLAMINGO
