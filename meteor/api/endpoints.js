const Hosts = Object.freeze({
  prod: 'https://labscore-v2.vercel.app',
  local: 'http://localhost',
  statics: 'https://cdn.roxyproxy.de/',
});

const Api = Object.freeze({
  HOST: Hosts.prod,

  GOOGLE_PERSPECTIVE: '/google/perspective/analyze',
  GOOGLE_SPEECH_RECOGNIZE: '/google/speech/recognize',
  GOOGLE_SPEECH_RECOGNIZE_LABELS: '/google/speech/multirecognize',
  GOOGLE_TRANSLATE: '/google/translate/text',
  GOOGLE_TRANSLATE_MULTI: '/google/translate/multi',
  GOOGLE_VISION_COLORS: '/google/vision/colors',
  GOOGLE_VISION_FACES: '/google/vision/faces',
  GOOGLE_VISION_LABELS: '/google/vision/labels',
  GOOGLE_VISION_OCR: '/google/vision/ocr',
  GOOGLE_VISION_SAFETY_LABELS: '/google/vision/safety',
  GOOGLE_VISION_WEBDETECTION: '/google/vision/webdetection',

  IMAGE_INHOUSE_PRIDE: '/image/inhouse/pride',

  IMAGE_DEEPDREAM: '/image/deepai/deepdream',
  IMAGE_IMAGEEDITOR: '/image/deepai/imageedit',
  IMAGE_SUPERRESOLUTION: '/image/deepai/superresolution',
  IMAGE_TEXT2IMAGE: '/image/deepai/text2image',
  IMAGE_WAIFU2X: '/image/deepai/waifu2x',

  OMNI_ANIME: '/omni/anime',
  OMNI_ANIME_SUPPLEMENTAL: '/omni/anime-supplemental',
  OMNI_MANGA: '/omni/manga',
  OMNI_MOVIE: '/omni/movie',

  PHOTOFUNIA_RETRO_WAVE: '/photofunia/retro-wave',
  PHOTOFUNIA_YACHT: '/photofunia/yacht',

  SEARCH_BING: '/search/bing',
  SEARCH_BING_IMAGES: '/search/bing-images',
  SEARCH_DUCKDUCKGO: '/search/duckduckgo',
  SEARCH_GOOGLE: '/search/google',
  SEARCH_GOOGLE_IMAGES: '/search/google-images',
  SEARCH_GOOGLE_MAPS: '/search/google-maps',
  SEARCH_GOOGLE_MAPS_SUPPLEMENTAL: '/search/google-maps-supplemental',
  SEARCH_GOOGLE_NEWS: '/search/google-news',
  SEARCH_GOOGLE_NEWS_SUPPLEMENTAL: '/search/google-news-supplemental',
  SEARCH_LYRICS: '/search/lyrics',
  SEARCH_QUORA: '/search/quora',
  SEARCH_QUORA_RESULT: '/search/quora-result',
  SEARCH_REDDIT: '/search/reddit',
  SEARCH_REVERSE_IMAGE: '/search/reverse-image',
  SEARCH_RULE34: '/search/booru',
  SEARCH_URBANDICTIONARY: '/search/urbandictionary',
  SEARCH_WEATHER: '/search/weather',
  SEARCH_WIKIHOW: '/search/wikihow',
  SEARCH_WOLFRAM_ALPHA: '/search/wolfram-alpha',
  SEARCH_WOLFRAM_SUPPLEMENTAL: '/search/wolfram-supplemental',
  SEARCH_YOUTUBE: '/search/youtube',

  TTS_IMTRANSLATOR: '/tts/imtranslator',
  TTS_MOONBASE: '/tts/moonbase',
  TTS_PLAYHT: '/tts/playht',
  TTS_POLLY: '/tts/polly',
  TTS_SAPI4: '/tts/sapi4',
  TTS_TIKTOK: '/tts/tiktok',

  UTILS_DICTIONARY: '/utils/dictionary-v2',
  UTILS_EMOJIPEDIA: '/utils/emojipedia',
  UTILS_EMOJI_SEARCH: '/utils/emoji-search',
  UTILS_GARFIELD: '/utils/garfield',
  UTILS_INFERKIT: '/utils/inferkit',
  UTILS_MAPKIT: '/utils/mapkit',
  UTILS_OTTER: '/utils/otter',
  UTILS_PERSPECTIVE: '/utils/perspective',
  UTILS_SCREENSHOT: '/utils/screenshot',
  UTILS_TEXTGENERATOR: '/utils/text-generator',
  UTILS_UNICODE_METADATA: '/utils/unicode-metadata',
  UTILS_WEATHER: '/utils/weather',
  UTILS_WEBSHOT: '/utils/webshot',

  // Obelisk endpoints
  AUDIO_TRANSCRIBE: '/audio/v1/transcribe',
  WEBUTILS_SCREENSHOT: '/webutils/v1/webpage:screenshot',
  WOLFRAM_QUERY_COMPUTE: '/wolfram/v1/query:compute',
  FLAMINGO_WEB_ASK: '/flamingo/v1/web:ask',
  FLAMINGO_SUMMARIZE_WEBPAGES: '/flamingo/v1/web:summarize',
  PEACOCK_WEBSHOT: '/peacock/v1/screenshot',
  PEACOCK_TRANSCRIBE: '/peacock/v1/transcribe',
});

module.exports = {
  Api,
  Hosts,
};
