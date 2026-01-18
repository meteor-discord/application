const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../../assets');

// Add static brand icons here
const Statics = Object.freeze({
  actions: {
    translate: {
      file: 'icons/boulevard/action-translate.png',
      revision: 1,
    },
  },
  assets: {
    card_skeleton: {
      file: 'loading/04_chat_loading.1zn1ocfb72tc.gif',
      revision: 0,
    },
    chat_loading: {
      file: 'loading/05_chat_loading.7y2ji893rho0.gif',
      revision: 0,
    },
    chat_loading_small: {
      file: 'loading/03_chat_loading.7lqh9a8ljks0.gif',
      revision: 0,
    },
    image_loading: {
      file: 'loading/image_loading_splash.2elegsql1j8k.png',
      revision: 250117,
    },
    image_loading_splash: {
      file: 'loading/splash_25/',
      revision: 250129,
    },
    image_placeholder: {
      file: 'loading/image_placeholder.png',
      revision: 250803,
    },
    embed_invite_spacer: {
      file: 'misc/embed-spacer-botinvite.png',
      revision: 0,
    },
    emoji_placeholder: {
      file: 'misc/emoji-placeholder.png',
      revision: 0,
    },
    emoji_placeholder_large: {
      file: 'misc/emoji-placeholder-large.png',
      revision: 0,
    },
  },
  brands: {
    anthropic: {
      file: 'brands/anthropic.png',
      revision: 1,
    },
    applemaps: {
      file: 'brands/applemaps.png',
      revision: 2,
    },
    bard: {
      file: 'brands/bard.png',
      revision: 1,
    },
    bing: {
      file: 'brands/bing.png',
      revision: 1,
    },
    chatgpt: {
      file: 'brands/chatgpt.png',
      revision: 1,
    },
    duckduckgo: {
      file: 'brands/duckduckgo.png',
      revision: 0,
    },
    emojipedia: {
      file: 'brands/emojipedia.png',
      revision: 3,
    },
    genius: {
      file: 'brands/genius.png',
      revision: 1,
    },
    google: {
      file: 'brands/google_v2.png',
      revision: 1,
    },
    googlecalculator: {
      file: 'brands/googlecalculator.png',
      revision: 2,
    },
    googledictionary: {
      file: 'brands/googledictionary.png',
      revision: 0,
    },
    googlefinance: {
      file: 'brands/googlefinance.png',
      revision: 0,
    },
    googlelens: {
      file: 'brands/lens.png',
      revision: 0,
    },
    googlemaps: {
      file: 'brands/maps.png',
      revision: 0,
    },
    googlenews: {
      file: 'brands/google_news.png',
      revision: 0,
    },
    googletranslate: {
      file: 'brands/googletranslate.png',
      revision: 0,
    },
    inferkit: {
      file: 'brands/inferkit.png',
      revision: 1,
    },
    inspirobot: {
      file: 'brands/inspirobot.png',
      revision: 1,
    },
    labscore: {
      file: 'brands/labscore.png',
      revision: 2,
    },
    makesweet: {
      file: 'brands/makesweet.png',
      revision: 1,
    },
    musixmatch: {
      file: 'brands/musixmatch.png',
      revision: 1,
    },
    openai: {
      file: 'brands/openai.png',
      revision: 1,
    },
    openweathermap: {
      file: 'brands/openweathermap.png',
      revision: 1,
    },
    perspectiveapi: {
      file: 'brands/perspectiveapi.png',
      revision: 2,
    },
    photofunia: {
      file: 'brands/photofunia.png',
      revision: 2,
    },
    quora: {
      file: 'brands/quora.png',
      revision: 3,
    },
    reddit: {
      file: 'brands/reddit.png',
      revision: 2,
    },
    tineye: {
      file: 'brands/tineye.png',
      revision: 2,
    },
    urbandictionary: {
      file: 'brands/urbandictionary.png',
      revision: 3,
    },
    weather: {
      file: 'brands/weather.png',
      revision: 4,
    },
    wikihow: {
      file: 'brands/wikihow.png',
      revision: 2,
    },
    wikipedia: {
      file: 'brands/wikipedia.png',
      revision: 2,
    },
    wolframalpha: {
      file: 'brands/wolframalpha.png',
      revision: 4,
    },
    youtube: {
      file: 'brands/youtube.png',
      revision: 4,
    },
  },
  icons: {
    adult: {
      file: 'icons/core/ico_notice_nsfw.png',
      revision: 3,
    },
    error: {
      file: 'icons/core/ico_notice_error.png',
      revision: 3,
    },
    loading: {
      file: 'icons/core/ico_notice_loading.gif',
      revision: 0,
    },
    ai: {
      file: 'icons/core/ico_notice_ai_spark.gif',
      revision: 0,
    },
    ai_bard: {
      file: '_gemini/aurora_processing.3hy637m5ubs0.gif',
      revision: 2,
    },
    ai_bard_idle: {
      file: '_gemini/aurora_spark.4f07mkr1e9a0.png',
      revision: 1,
    },
    ai_clyde: {
      file: 'brands/_clyde/clyde_generating.gif',
      revision: 0,
    },
    ai_clyde_idle: {
      file: 'brands/_clyde/clyde.png',
      revision: 0,
    },
    ai_gemini: {
      file: 'icons/aiv2/gemini_spark_v2.png',
      revision: 0,
    },
    ai_palm_idle: {
      file: 'icons/core/ico_notice_palm_idle.png',
      revision: 0,
    },
    ai_summary: {
      file: 'icons/flamingo/web_summary.png',
      revision: 1,
    },
    ai_image: {
      file: 'icons/flamingo/image_generation_done_v2.png',
      revision: 0,
    },
    ai_image_processing: {
      file: 'icons/flamingo/image_generation_v2.gif',
      revision: 0,
    },
    warning: {
      file: 'icons/core/ico_notice_warning.png',
      revision: 3,
    },
    search_calculator: {
      file: 'search/calculator.78rasnkwtvo0.png',
      revision: 1,
    },
    full_coverage: {
      file: 'search/full_coverage.7aewvft4qrc0.png',
      revision: 0,
    },
  },
});

function staticAsset(filePath) {
  return `file://${path.join(ASSETS_DIR, filePath)}`;
}

module.exports.STATICS = Object.freeze({
  anthropic: staticAsset(Statics.brands.anthropic.file),
  applemaps: staticAsset(Statics.brands.applemaps.file),
  bard: staticAsset(Statics.brands.bard.file),
  bing: staticAsset(Statics.brands.bing.file),
  chatgpt: staticAsset(Statics.brands.chatgpt.file),
  duckduckgo: staticAsset(Statics.brands.duckduckgo.file),
  genius: staticAsset(Statics.brands.genius.file),
  google: staticAsset(Statics.brands.google.file),
  googlelens: staticAsset(Statics.brands.googlelens.file),
  googlecalculator: staticAsset(Statics.brands.googlecalculator.file),
  googledictionary: staticAsset(Statics.brands.googledictionary.file),
  googlefinance: staticAsset(Statics.brands.googlefinance.file),
  googlemaps: staticAsset(Statics.brands.googlemaps.file),
  googlenews: staticAsset(Statics.brands.googlenews.file),
  googletranslate: staticAsset(Statics.brands.googletranslate.file),
  emojipedia: staticAsset(Statics.brands.emojipedia.file),
  inferkit: staticAsset(Statics.brands.inferkit.file),
  inspirobot: staticAsset(Statics.brands.inspirobot.file),
  labscore: staticAsset(Statics.brands.labscore.file),
  makesweet: staticAsset(Statics.brands.makesweet.file),
  musixmatch: staticAsset(Statics.brands.musixmatch.file),
  openai: staticAsset(Statics.brands.openai.file),
  openweathermap: staticAsset(Statics.brands.openweathermap.file),
  perspectiveapi: staticAsset(Statics.brands.perspectiveapi.file),
  photofunia: staticAsset(Statics.brands.photofunia.file),
  quora: staticAsset(Statics.brands.quora.file),
  reddit: staticAsset(Statics.brands.reddit.file),
  tineye: staticAsset(Statics.brands.tineye.file),
  urbandictionary: staticAsset(Statics.brands.urbandictionary.file),
  weather: staticAsset(Statics.brands.weather.file),
  wikihow: staticAsset(Statics.brands.wikihow.file),
  wikipedia: staticAsset(Statics.brands.wikipedia.file),
  wolframalpha: staticAsset(Statics.brands.wolframalpha.file),
  youtube: staticAsset(Statics.brands.youtube.file),
});

module.exports.STATIC_ICONS = Object.freeze({
  adult: staticAsset(Statics.icons.adult.file),
  error: staticAsset(Statics.icons.error.file),
  loading: staticAsset(Statics.icons.loading.file),
  ai: staticAsset(Statics.icons.ai.file),
  ai_bard: staticAsset(Statics.icons.ai_bard.file),
  ai_bard_idle: staticAsset(Statics.icons.ai_bard_idle.file),
  ai_clyde: staticAsset(Statics.icons.ai_clyde.file),
  ai_clyde_idle: staticAsset(Statics.icons.ai_clyde_idle.file),
  ai_gemini: staticAsset(Statics.icons.ai_gemini.file),
  ai_palm_idle: staticAsset(Statics.icons.ai_palm_idle.file),
  ai_summary: staticAsset(Statics.icons.ai_summary.file),
  ai_image: staticAsset(Statics.icons.ai_image.file),
  ai_image_processing: staticAsset(Statics.icons.ai_image_processing.file),
  warning: staticAsset(Statics.icons.warning.file),
  search_calculator: staticAsset(Statics.icons.search_calculator.file),
  full_coverage: staticAsset(Statics.icons.full_coverage.file),
});

module.exports.STATIC_ASSETS = Object.freeze({
  card_skeleton: staticAsset(Statics.assets.card_skeleton.file),
  chat_loading: staticAsset(Statics.assets.chat_loading.file),
  chat_loading_small: staticAsset(Statics.assets.chat_loading_small.file),
  image_placeholder: staticAsset(Statics.assets.image_placeholder.file),
  image_loading: staticAsset(Statics.assets.image_loading.file),
  image_loading_splash: index => staticAsset(`${Statics.assets.image_loading_splash.file}${index}.png`),
  embed_invite_spacer: staticAsset(Statics.assets.embed_invite_spacer.file),
  emoji_placeholder: staticAsset(Statics.assets.emoji_placeholder.file),
  emoji_placeholder_large: staticAsset(Statics.assets.emoji_placeholder_large.file),
});

module.exports.STATIC_ACTIONS = Object.freeze({
  translate: staticAsset(Statics.actions.translate.file),
});
