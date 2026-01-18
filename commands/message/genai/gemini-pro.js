const { googleGenaiGeminiApi } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { stringwrap, smallIconPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATIC_ICONS, STATIC_ASSETS } = require('#utils/statics');

module.exports = {
  name: 'gemini-pro',
  label: 'text',
  aliases: ['gpro', 'gempro', 'gem-pro'],
  metadata: {
    description: `${smallIconPill('reply', 'Supports Replies')}\n\nRun Gemini 2.5 Pro with a custom prompt.`,
    description_short: 'Gemini 2.5 Pro',
    examples: ['gem why do they call it oven when you of in the cold food of out hot eat the food'],
    category: 'genai',
    usage: 'gemini-pro <input> [<prompt>]',
  },
  args: [
    { name: 'prompt', default: '', required: false, help: 'The starting system prompt.' },
    { name: 'model', default: 'gemini-2.5-pro-preview-05-06', required: false, help: 'The model.' },
    //    { name: 'temperature', default: 0.25, required: false, help: "Model temperature." },
  ],
  permissionsClient: [...PERMISSION_GROUPS.baseline, ...PERMISSION_GROUPS.attachments],
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.text) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (text).`));

    let model = 'gemini-2.5-pro-preview-05-06';
    if (args.model) model = args.model;

    const input = args.text;

    let prompt = `You are a friendly assistant designed to help people.\n- Today's date is ${new Date().toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n- You should always use gender neutral pronouns when possible.\n- When answering a question, be concise and to the point.\n- Try to keep responses below 1000 characters. This does not apply to subjects that require more exhaustive or in-depth explanation.\n- Respond in a natural way, using Markdown formatting.`;
    if (args.prompt !== '') prompt = args.prompt;

    try {
      await editOrReply(
        context,
        createEmbed('defaultNoFooter', context, {
          author: {
            iconUrl: STATIC_ICONS.ai_gemini,
            name: `Generating...`,
          },
          image: {
            url: STATIC_ASSETS.chat_loading_small,
          },
        })
      );

      const res = await googleGenaiGeminiApi(context, model, input, prompt);

      const description = [];
      const files = [];

      if (res.response.body.message)
        return editOrReply(context, createEmbed('error', context, res.response.body.message));

      const output = res.response.body.output;
      if (!output)
        return editOrReply(context, createEmbed('error', context, `Gemini returned an error. Try again later.`));

      if (output.length <= 4000) description.push(output);
      else {
        files.push({
          filename: `gemini.${Date.now().toString(36)}.txt`,
          value: Buffer.from(output),
        });
      }

      return editOrReply(context, {
        embeds: [
          createEmbed('defaultNoFooter', context, {
            author: {
              name: stringwrap(input, 50, false),
              iconUrl: STATIC_ICONS.ai_gemini,
            },
            description: description.join('\n'),
            footer: {
              text: `${model} • Data submitted to Gemini may be used by Google for training.`,
            },
          }),
        ],
        files,
      });
    } catch {
      console.log(e);
      if (e.response?.body?.message)
        return editOrReply(context, createEmbed('error', context, e.response.body.message));
      return editOrReply(context, createEmbed('error', context, `Gemini API failed.`));
    }
  },
};
