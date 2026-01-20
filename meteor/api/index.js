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

module.exports.googleGenaiEditImage = async function (context, prompt, url) {
  return await request(
    Api.GOOGLE_GENERATIVEAI_EDIT_IMAGE,
    'GET',
    {},
    {
      prompt,
      url,
    }
  );
};

module.exports.googleGenaiGeminiApi = async function (context, model, input, prompt) {
  return await request(
    Api.GOOGLE_GENERATIVEAI_GEMINI_API,
    'GET',
    {},
    {
      prompt,
      input,
      model,
    }
  );
};

module.exports.googleGenaiImagen = async function (context, prompt, imageCount = 2, model = 'imagen-4') {
  return await request(
    Api.GOOGLE_GENERATIVEAI_IMAGEN,
    'GET',
    {},
    {
      prompt,
      image_count: imageCount,
      model,
    }
  );
};

module.exports.googlePerspective = async function (context, text) {
  return await request(
    Api.GOOGLE_PERSPECTIVE,
    'GET',
    {},
    {
      text,
    }
  );
};

module.exports.googleSpeechRecognition = async function (context, url) {
  return await request(
    Api.GOOGLE_SPEECH_RECOGNIZE,
    'GET',
    {},
    {
      url,
    }
  );
};

module.exports.googleSpeechRecognitionWithLabels = async function (context, url) {
  return await request(
    Api.GOOGLE_SPEECH_RECOGNIZE_LABELS,
    'GET',
    {},
    {
      url,
    }
  );
};

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

module.exports.googleVisionColors = async function (context, url) {
  return await request(
    Api.GOOGLE_VISION_COLORS,
    'GET',
    {},
    {
      url,
    }
  );
};

module.exports.googleVisionFaces = async function (context, url) {
  return await request(
    Api.GOOGLE_VISION_FACES,
    'GET',
    {},
    {
      url,
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

module.exports.googleVisionWebDetection = async function (context, url) {
  return await request(
    Api.GOOGLE_VISION_WEBDETECTION,
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

module.exports.reddit = async function (context, query, nsfw = false) {
  return await request(
    Api.SEARCH_REDDIT,
    'GET',
    {},
    {
      q: query,
      nsfw,
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

module.exports.yacht = async function (context, text) {
  return await request(
    Api.PHOTOFUNIA_YACHT,
    'GET',
    {},
    {
      text,
    }
  );
};

module.exports.retroWave = async function (
  context,
  background = 5,
  textStyle = 4,
  text1 = ' ',
  text2 = ' ',
  text3 = ' '
) {
  return await request(
    Api.PHOTOFUNIA_RETRO_WAVE,
    'GET',
    {},
    {
      text1,
      text2,
      text3,
      background,
      text_style: textStyle,
    }
  );
};

module.exports.prideborder = async function (context, url) {
  return await request(
    Api.IMAGE_INHOUSE_PRIDE,
    'GET',
    {},
    {
      url,
    }
  );
};

module.exports.deepdream = async function (context, url) {
  return await request(
    Api.IMAGE_DEEPDREAM,
    'GET',
    {},
    {
      url,
    }
  );
};

module.exports.imageedit = async function (context, url, prompt) {
  return await request(
    Api.IMAGE_IMAGEEDITOR,
    'GET',
    {},
    {
      url,
      prompt,
    }
  );
};

module.exports.waifu2x = async function (context, url) {
  return await request(
    Api.IMAGE_WAIFU2X,
    'GET',
    {},
    {
      url,
    }
  );
};

module.exports.superresolution = async function (context, url) {
  return await request(
    Api.IMAGE_SUPERRESOLUTION,
    'GET',
    {},
    {
      url,
    }
  );
};

module.exports.text2image = async function (context, text) {
  return await request(
    Api.IMAGE_TEXT2IMAGE,
    'GET',
    {},
    {
      text,
    }
  );
};

module.exports.emogen = async function (context, prompt, style) {
  return await request(
    Api.IMAGE_EMOGEN,
    'GET',
    {},
    {
      prompt,
      style,
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

module.exports.polly = async function (context, text, voice) {
  return await request(
    Api.TTS_POLLY,
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

module.exports.inferkit = async function (context, input) {
  return await request(
    Api.UTILS_INFERKIT,
    'GET',
    {},
    {
      input,
    }
  );
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

module.exports.textGenerator = async function (context, input) {
  return await request(
    Api.UTILS_TEXTGENERATOR,
    'GET',
    {},
    {
      input,
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
module.exports.AudioTranscribe = async function (context, url) {
  return await request(
    Api.AUDIO_TRANSCRIBE,
    'POST',
    {},
    {
      url,
      type: 'VOICE_MESSAGE',
    }
  );
};

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

module.exports.LlmModelsGenerate = async function (context, model, prompt, harmLevel = 'BLOCK_NONE') {
  return await request(
    Api.LLM_MODELS_GENERATE,
    'POST',
    {},
    {
      user_prompt: prompt,
      model,
      safety_config: {
        default_safety_threshold: harmLevel,
      },
    }
  );
};

module.exports.GenerativeImagesModelsImagen = async function (context, prompt) {
  return await request(
    Api.GENIMG_IMAGEN,
    'POST',
    {},
    {
      image_prompt: prompt,
    }
  );
};

module.exports.GenerativeImagesModelsWallpaper = async function (context, prompt, format) {
  return await request(
    Api.GENIMG_WALLPAPER,
    'POST',
    {},
    {
      image_prompt: prompt,
      format,
    }
  );
};

module.exports.WebUtilsWebPageScreenshot = async function (context, url, allow_adult) {
  return await request(
    Api.WEBUTILS_SCREENSHOT,
    'POST',
    {},
    {
      url,
      allow_adult,
    }
  );
};

module.exports.SparkWebSummarize = async function (context, url) {
  return await request(
    Api.SPARK_WEB_SUMMARIZE,
    'POST',
    {},
    {
      url,
    }
  );
};

module.exports.WolframQueryCompute = async function (context, query) {
  return await request(
    Api.WOLFRAM_QUERY_COMPUTE,
    'POST',
    {},
    {
      query,
    }
  );
};

// GENERATIVEAI (PARROT)
module.exports.bard = async function (context, input) {
  return await request(
    Api.PARROT_GOOGLE_BARD,
    'POST',
    {},
    {
      input,
    }
  );
};

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

module.exports.geminiVision = async function (context, input, url) {
  return await request(
    Api.PARROT_GOOGLE_GEMINI_PRO_VISION,
    'POST',
    {},
    {
      input,
      url,
    }
  );
};

module.exports.palm2 = async function (context, prompt, input) {
  return await request(
    Api.PARROT_GOOGLE_PALM2,
    'POST',
    {},
    {
      prompt,
      input,
    }
  );
};

// FLAMINGO
module.exports.webAsk = async function (context, url, prompt) {
  return await request(
    Api.FLAMINGO_WEB_ASK,
    'POST',
    {},
    {
      url,
      prompt,
    }
  );
};

module.exports.summarizeWebpage = async function (context, url) {
  return await request(
    Api.FLAMINGO_SUMMARIZE_WEBPAGES,
    'POST',
    {},
    {
      url,
    }
  );
};

// ROBIN
module.exports.imagen = async function (context, prompt) {
  return await request(
    Api.ROBIN_GENERATE_IMAGEN,
    'POST',
    {},
    {
      prompt,
    }
  );
};

module.exports.wallpaper = async function (context, prompt, model) {
  return await request(
    Api.ROBIN_GENERATE_WALLPAPER,
    'POST',
    {},
    {
      prompt,
      model,
    }
  );
};

// PEACOCK
module.exports.webshot_obelisk = async function (context, url, allowAdultContent = false) {
  return await request(
    Api.PEACOCK_WEBSHOT,
    'POST',
    {},
    {
      url,
      allow_adult: allowAdultContent,
    }
  );
};

module.exports.transcribeWithSpeakerLabelsObelisk = async function (context, url) {
  return await request(
    Api.PEACOCK_TRANSCRIBE,
    'POST',
    {},
    {
      url,
    }
  );
};
