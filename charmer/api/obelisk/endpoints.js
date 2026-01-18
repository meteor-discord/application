const ObeliskHosts = Object.freeze({
  prod: process.env.OBELISK_HOST,
  local: 'http://localhost',
});

const ObeliskApi = Object.freeze({
  HOST: ObeliskHosts.prod,

  // monolith2
  AUDIO_TRANSCRIBE: '/audio/v1/transcribe',

  LLM_PRIVATE_BARD: '/llm/v1/_private:bard',
  LLM_MODELS_GENERATE: '/llm/v1/generate',

  GENERATIVEIMAGES_MODELS_IMAGEN: '/generativeimages/v1/models/imagen',
  GENERATIVEIMAGES_MODELS_WALLPAPER: '/generativeimages/v1/models/wallpaper',

  WEBUTILS_WEBPAGE_SCREENSHOT: '/webutils/v1/webpage:screenshot',

  SPARK_WEB_SUMMARIZE: '/spark-pa/v1/web:summarize',

  WOLFRAM_QUERY_COMPUTE: '/wolfram/v1/query:compute',

  GOOGLE_BARD: '/parrot/v1/google:bard',
  GOOGLE_GEMINI_PRO: '/parrot/v1/google:gemini',
  GOOGLE_GEMINI_PRO_VISION: '/parrot/v1/google:geminiVision',
  GOOGLE_PALM2: '/parrot/v1/google:palm2',

  OPENAI_CHATGPT: '/parrot/v1/openai:chatgpt',
  OPENAI_GPT4: '/parrot/v1/openai:gpt4',

  WEB_ASK: '/flamingo/v1/web:ask',
  SUMMARIZE_WEBPAGES: '/flamingo/v1/web:summarize',

  GENERATE_IMAGEN: '/robin/v1/generate:imagen',
  GENERATE_WALLPAPER: '/robin/v1/generate:wallpaper',

  WEBSHOT: '/peacock/v1/screenshot',
  TRANSCRIBE: '/peacock/v1/transcribe',
});

module.exports = {
  ObeliskApi,
  ObeliskHosts,
};
