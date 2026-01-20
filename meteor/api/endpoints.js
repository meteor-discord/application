const Hosts = Object.freeze({
  prod: 'https://labscore-v2.vercel.app',
  local: 'http://localhost',
  statics: 'https://cdn.roxyproxy.de/',
});

const Api = Object.freeze({
  HOST: Hosts.prod,

  GOOGLE_TRANSLATE: '/google/translate/text',
  GOOGLE_VISION_LABELS: '/google/vision/labels',
  GOOGLE_VISION_OCR: '/google/vision/ocr',
  GOOGLE_VISION_SAFETY_LABELS: '/google/vision/safety',

  OMNI_ANIME: '/omni/anime',
  OMNI_ANIME_SUPPLEMENTAL: '/omni/anime-supplemental',
  OMNI_MANGA: '/omni/manga',
  OMNI_MOVIE: '/omni/movie',

  SEARCH_BING: '/search/bing',
  SEARCH_BING_IMAGES: '/search/bing-images',
  SEARCH_DUCKDUCKGO: '/search/duckduckgo',
  SEARCH_DUCKDUCKGO_IMAGES: '/search/duckduckgo-images',
  SEARCH_GOOGLE_MAPS: '/search/google-maps',
  SEARCH_GOOGLE_MAPS_SUPPLEMENTAL: '/search/google-maps-supplemental',
  SEARCH_GOOGLE_NEWS: '/search/google-news',
  SEARCH_GOOGLE_NEWS_SUPPLEMENTAL: '/search/google-news-supplemental',
  SEARCH_LYRICS: '/search/lyrics',
  SEARCH_QUORA: '/search/quora',
  SEARCH_QUORA_RESULT: '/search/quora-result',
  SEARCH_REVERSE_IMAGE: '/search/reverse-image',
  SEARCH_RULE34: '/search/booru',
  SEARCH_URBANDICTIONARY: '/search/urbandictionary',
  SEARCH_WIKIHOW: '/search/wikihow',
  SEARCH_WOLFRAM_ALPHA: '/search/wolfram-alpha',
  SEARCH_WOLFRAM_SUPPLEMENTAL: '/search/wolfram-supplemental',
  SEARCH_YOUTUBE: '/search/youtube',

  TTS_IMTRANSLATOR: '/tts/imtranslator',
  TTS_MOONBASE: '/tts/moonbase',
  TTS_PLAYHT: '/tts/playht',
  TTS_TIKTOK: '/tts/tiktok',

  UTILS_DICTIONARY: '/utils/dictionary',
  UTILS_EMOJIPEDIA: '/utils/emojipedia',
  UTILS_EMOJI_SEARCH: '/utils/emoji-search',
  UTILS_GARFIELD: '/utils/garfield',
  UTILS_OTTER: '/utils/otter',
  UTILS_PERSPECTIVE: '/utils/perspective',
  UTILS_UNICODE_METADATA: '/utils/unicode-metadata',
  UTILS_WEBSHOT: '/utils/webshot',

  LLM_PRIVATE_BARD: '/llm/_private:bard',
  GOOGLE_GEMINI: '/parrot/google:gemini',
});

module.exports = {
  Api,
  Hosts,
};
