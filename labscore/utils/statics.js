const { Hosts } = require('../api/endpoints')

// Add static brand icons here
// Update the revision id to break discord cache
const Statics = Object.freeze({
  actions: {
    translate: {
      file: "icons/boulevard/action-translate.png",
      revision: 1
    }
  },
  assets: {
    card_skeleton: {
      file: "loading/04_chat_loading.1zn1ocfb72tc.gif",
      revision: 0
    },
    chat_loading: {
      file: "loading/05_chat_loading.7y2ji893rho0.gif",
      revision: 0
    },
    chat_loading_small: {
      file: "loading/03_chat_loading.7lqh9a8ljks0.gif",
      revision: 0
    },
    image_loading: {
      file: "loading/image_loading_splash.2elegsql1j8k.png",
      revision: 250117
    },
    image_loading_splash: {
      file: "loading/splash_25/",
      revision: 250129
    },
    image_placeholder: {
      file: "loading/image_placeholder.png",
      revision: 250803
    },
    embed_invite_spacer: {
      file: "misc/embed-spacer-botinvite.png",
      revision: 0
    },
    emoji_placeholder: {
      file: "misc/emoji-placeholder.png",
      revision: 0
    },
    emoji_placeholder_large: {
      file: "misc/emoji-placeholder-large.png",
      revision: 0
    },
  },
  brands: {
    anthropic: {
      file: "brands/anthropic.png",
      revision: 1
    },
    applemaps: {
      file: "brands/applemaps.png",
      revision: 2
    },
    bard: {
      file: "brands/bard.png",
      revision: 1
    },
    bing: {
      file: "brands/bing.png",
      revision: 1
    },
    chatgpt: {
      file: "brands/chatgpt.png",
      revision: 1
    },
    duckduckgo: {
      file: "brands/duckduckgo.png",
      revision: 0
    },
    emojipedia: {
      file: "brands/emojipedia.png",
      revision: 3
    },
    genius: {
      file: "brands/genius.png",
      revision: 1
    },
    google: {
      file: "brands/google_v2.png",
      revision: 1
    },
    googlecalculator: {
      file: "brands/googlecalculator.png",
      revision: 2
    },
    googledictionary: {
      file: "brands/googledictionary.png",
      revision: 0
    },
    googlefinance: {
      file: "brands/googlefinance.png",
      revision: 0
    },
    googlelens: {
      file: "brands/lens.png",
      revision: 0
    },
    googlemaps: {
      file: "brands/maps.png",
      revision: 0
    },
    googlenews: {
      file: "brands/google_news.png",
      revision: 0
    },
    googletranslate: {
      file: "brands/googletranslate.png",
      revision: 0
    },
    inferkit: {
      file: "brands/inferkit.png",
      revision: 1
    },
    inspirobot: {
      file: "brands/inspirobot.png",
      revision: 1
    },
    labscore: {
      file: "brands/labscore.png",
      revision: 2
    },
    makesweet: {
      file: "brands/makesweet.png",
      revision: 1
    },
    musixmatch: {
      file: "brands/musixmatch.png",
      revision: 1
    },
    openai: {
      file: "brands/openai.png",
      revision: 1
    },
    openweathermap: {
      file: "brands/openweathermap.png",
      revision: 1
    },
    perspectiveapi: {
      file: "brands/perspectiveapi.png",
      revision: 2
    },
    photofunia: {
      file: "brands/photofunia.png",
      revision: 2
    },
    quora: {
      file: "brands/quora.png",
      revision: 3
    },
    reddit: {
      file: "brands/reddit.png",
      revision: 2
    },
    tineye: {
      file: "brands/tineye.png",
      revision: 2
    },
    urbandictionary: {
      file: "brands/urbandictionary.png",
      revision: 3
    },
    weather: {
      file: "brands/weather.png",
      revision: 4
    },
    wikihow: {
      file: "brands/wikihow.png",
      revision: 2
    },
    wikipedia: {
      file: "brands/wikipedia.png",
      revision: 2
    },
    wolframalpha: {
      file: "brands/wolframalpha.png",
      revision: 4
    },
    youtube: {
      file: "brands/youtube.png",
      revision: 4
    }
  },
  icons: {
    adult: {
      file: "icons/core/ico_notice_nsfw.png",
      revision: 3
    },
    error: {
      file: "icons/core/ico_notice_error.png",
      revision: 3
    },
    loading: {
      file: "icons/core/ico_notice_loading.gif",
      revision: 0
    },
    ai: {
      file: "icons/core/ico_notice_ai_spark.gif",
      revision: 0
    },
    ai_bard: {
      file: "_gemini/aurora_processing.3hy637m5ubs0.gif",
      revision: 2
    },
    ai_bard_idle: {
      file: "_gemini/aurora_spark.4f07mkr1e9a0.png",
      revision: 1
    },
    ai_clyde: {
      file: "brands/_clyde/clyde_generating.gif",
      revision: 0
    },
    ai_clyde_idle: {
      file: "brands/_clyde/clyde.png",
      revision: 0
    },
    ai_gemini: {
      file: "icons/aiv2/gemini_spark_v2.png",
      revision: 0
    },
    ai_palm_idle: {
      file: "icons/core/ico_notice_palm_idle.png",
      revision: 0
    },
    ai_summary: {
      file: "icons/flamingo/web_summary.png",
      revision: 1
    },
    ai_image: {
      file: "icons/flamingo/image_generation_done_v2.png",
      revision: 0
    },
    ai_image_processing: {
      file: "icons/flamingo/image_generation_v2.gif",
      revision: 0
    },
    warning: {
      file: "icons/core/ico_notice_warning.png",
      revision: 3
    },
    search_calculator: {
      file: "search/calculator.78rasnkwtvo0.png",
      revision: 1
    },
    full_coverage: {
      file: "search/full_coverage.7aewvft4qrc0.png",
      revision: 0
    }
  }
})

function staticAsset(static) {
  return Hosts.statics + `assets/` + static.file + "?r=" + static.revision
}

module.exports.STATICS = Object.freeze({
  anthropic: staticAsset(Statics.brands.anthropic),
  applemaps: staticAsset(Statics.brands.applemaps),
  bard: staticAsset(Statics.brands.bard),
  bing: staticAsset(Statics.brands.bing),
  chatgpt: staticAsset(Statics.brands.chatgpt),
  duckduckgo: staticAsset(Statics.brands.duckduckgo),
  genius: staticAsset(Statics.brands.genius),
  google: staticAsset(Statics.brands.google),
  googlelens: staticAsset(Statics.brands.googlelens),
  googlecalculator: staticAsset(Statics.brands.googlecalculator),
  googledictionary: staticAsset(Statics.brands.googledictionary),
  googlefinance: staticAsset(Statics.brands.googlefinance),
  googlemaps: staticAsset(Statics.brands.googlemaps),
  googlenews: staticAsset(Statics.brands.googlenews),
  googletranslate: staticAsset(Statics.brands.googletranslate),
  emojipedia: staticAsset(Statics.brands.emojipedia),
  inferkit: staticAsset(Statics.brands.inferkit),
  inspirobot: staticAsset(Statics.brands.inspirobot),
  labscore: staticAsset(Statics.brands.labscore),
  makesweet: staticAsset(Statics.brands.makesweet),
  musixmatch: staticAsset(Statics.brands.musixmatch),
  openai: staticAsset(Statics.brands.openai),
  openweathermap: staticAsset(Statics.brands.openweathermap),
  perspectiveapi: staticAsset(Statics.brands.perspectiveapi),
  photofunia: staticAsset(Statics.brands.photofunia),
  quora: staticAsset(Statics.brands.quora),
  reddit: staticAsset(Statics.brands.reddit),
  tineye: staticAsset(Statics.brands.tineye),
  urbandictionary: staticAsset(Statics.brands.urbandictionary),
  weather: staticAsset(Statics.brands.weather),
  wikihow: staticAsset(Statics.brands.wikihow),
  wikipedia: staticAsset(Statics.brands.wikipedia),
  wolframalpha: staticAsset(Statics.brands.wolframalpha),
  youtube: staticAsset(Statics.brands.youtube)
})

module.exports.STATIC_ICONS = Object.freeze({
  adult: staticAsset(Statics.icons.adult),
  error: staticAsset(Statics.icons.error),
  loading: staticAsset(Statics.icons.loading),
  ai: staticAsset(Statics.icons.ai),
  ai_bard: staticAsset(Statics.icons.ai_bard),
  ai_bard_idle: staticAsset(Statics.icons.ai_bard_idle),
  ai_clyde: staticAsset(Statics.icons.ai_clyde),
  ai_clyde_idle: staticAsset(Statics.icons.ai_clyde_idle),
  ai_gemini: staticAsset(Statics.icons.ai_gemini),
  ai_palm_idle: staticAsset(Statics.icons.ai_palm_idle),
  ai_summary: staticAsset(Statics.icons.ai_summary),
  ai_image: staticAsset(Statics.icons.ai_image),
  ai_image_processing: staticAsset(Statics.icons.ai_image_processing),
  warning: staticAsset(Statics.icons.warning),
  search_calculator: staticAsset(Statics.icons.search_calculator),
  full_coverage: staticAsset(Statics.icons.full_coverage)
})

module.exports.STATIC_ASSETS = Object.freeze({
  card_skeleton: staticAsset(Statics.assets.card_skeleton),
  chat_loading: staticAsset(Statics.assets.chat_loading),
  chat_loading_small: staticAsset(Statics.assets.chat_loading_small),
  image_placeholder: staticAsset(Statics.assets.image_placeholder),
  image_loading: staticAsset(Statics.assets.image_loading),
  image_loading_splash: (index)=>`${Hosts.statics}assets/${Statics.assets.image_loading_splash.file}${index}.png?r=${Statics.assets.image_loading_splash.revision}`,
  embed_invite_spacer: staticAsset(Statics.assets.embed_invite_spacer),
  emoji_placeholder: staticAsset(Statics.assets.emoji_placeholder),
  emoji_placeholder_large: staticAsset(Statics.assets.emoji_placeholder_large)
})

module.exports.STATIC_ACTIONS = Object.freeze({
  translate: staticAsset(Statics.actions.translate)
})