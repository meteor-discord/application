const superagent = require('superagent');
const { ObeliskApi, ObeliskHosts } = require('./endpoints');

async function request(path, type, headers, args, host) {
  const timing = Date.now();
  let url = ObeliskApi.HOST + path;
  if (process.env.USE_LOCAL_API) url = ObeliskHosts.local + ':' + process.env.USE_LOCAL_API + path;
  if (host) url = host + path;

  // apply default headers
  if (!headers.Authorization) headers.Authorization = process.env.MONOLITH_API_KEY;

  if (type === 'GET') {
    if (!args) {
      const response = await superagent.get(url);
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

// monolith2
module.exports.AudioTranscribe = async function (context, url) {
  return await request(
    ObeliskApi.AUDIO_TRANSCRIBE,
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
    ObeliskApi.LLM_PRIVATE_BARD,
    'POST',
    {},
    {
      prompt,
    }
  );
};

module.exports.LlmModelsGenerate = async function (context, model, prompt, harmLevel = 'BLOCK_NONE') {
  return await request(
    ObeliskApi.LLM_MODELS_GENERATE,
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
    ObeliskApi.GENERATIVEIMAGES_MODELS_IMAGEN,
    'POST',
    {},
    {
      image_prompt: prompt,
    }
  );
};

module.exports.GenerativeImagesModelsWallpaper = async function (context, prompt, format) {
  return await request(
    ObeliskApi.GENERATIVEIMAGES_MODELS_WALLPAPER,
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
    ObeliskApi.WEBUTILS_WEBPAGE_SCREENSHOT,
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
    ObeliskApi.SPARK_WEB_SUMMARIZE,
    'POST',
    {},
    {
      url,
    }
  );
};

module.exports.WolframQueryCompute = async function (context, query) {
  return await request(
    ObeliskApi.WOLFRAM_QUERY_COMPUTE,
    'POST',
    {},
    {
      query,
    }
  );
};

// GENERATIVEAI
module.exports.bard = async function (context, input) {
  return await request(
    ObeliskApi.GOOGLE_BARD,
    'POST',
    {},
    {
      input,
    }
  );
};

module.exports.gemini = async function (context, prompt) {
  return await request(
    ObeliskApi.GOOGLE_GEMINI_PRO,
    'POST',
    {},
    {
      prompt,
    }
  );
};

module.exports.geminiVision = async function (context, input, url) {
  return await request(
    ObeliskApi.GOOGLE_GEMINI_PRO_VISION,
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
    ObeliskApi.GOOGLE_PALM2,
    'POST',
    {},
    {
      prompt,
      input,
    }
  );
};

module.exports.chatgpt = async function (context, prompt, input) {
  return await request(
    ObeliskApi.OPENAI_CHATGPT,
    'POST',
    {},
    {
      prompt,
      input,
    }
  );
};

module.exports.gpt4 = async function (context, prompt, input) {
  return await request(
    ObeliskApi.OPENAI_GPT4,
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
    ObeliskApi.WEB_ASK,
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
    ObeliskApi.SUMMARIZE_WEBPAGES,
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
    ObeliskApi.GENERATE_IMAGEN,
    'POST',
    {},
    {
      prompt,
    }
  );
};

module.exports.wallpaper = async function (context, prompt, model) {
  return await request(
    ObeliskApi.GENERATE_WALLPAPER,
    'POST',
    {},
    {
      prompt,
      model,
    }
  );
};

// PEACOCK
module.exports.webshot = async function (context, url, allowAdultContent = false) {
  return await request(
    ObeliskApi.WEBSHOT,
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
    ObeliskApi.TRANSCRIBE,
    'POST',
    {},
    {
      url,
    }
  );
};
