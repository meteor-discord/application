const { gpt } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { editOrReply } = require('#utils/message');
const { stringwrap, smallIconPill } = require('#utils/markdown');
const { STATICS, STATIC_ASSETS } = require('#utils/statics');
const { acknowledge } = require('#utils/interactions');

module.exports = {
  name: 'gpt',
  label: 'text',
  aliases: ['chatgpt', 'openai'],
  metadata: {
    description: `${smallIconPill('reply', 'Supports Replies')}\n\nTalk to GPT-4o.`,
    description_short: 'Chat with GPT-4o.',
    examples: ['gpt How many otter species are there?'],
    category: 'genai',
    usage: 'gpt <input> [-prompt <prompt override>] [-model <model identifier>]',
  },
  args: [
    { name: 'prompt', default: '', required: false, help: 'The starting system prompt.' },
    { name: 'model', default: 'gpt-4o', required: false, help: 'The model.' },
    //    { name: 'temperature', default: 0.25, required: false, help: "Model temperature." },
  ],
  permissionsClient: [...PERMISSION_GROUPS.baseline, ...PERMISSION_GROUPS.attachments],
  run: async (context, args) => {
    await acknowledge(context);

    let model = 'gpt-4o';
    if (args.model) model = args.model;

    if (!args.text) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (text).`));

    let input = args.text;

    let prompt = `You are a friendly chat bot designed to help people.\n- Today\'s date is ${new Date().toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n- You should always use gender neutral pronouns when possible.\n- When answering a question, be concise and to the point.\n- Try to keep responses below 1000 characters. This does not apply to subjects that require more exhaustive or in-depth explanation.\n- Respond in a natural way, using Markdown formatting.`;
    if (args.prompt !== '') prompt = args.prompt;

    // Get content if the user replies to anything
    if (context.message.messageReference) {
      const msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId);

      if (msg.content && msg.content.length) input = `> ${msg.content.split('\n').join('\n> ')}\n${input}`;
      if (msg.embeds?.length)
        for (const e of msg.embeds)
          if (e[1].description?.length) {
            input = `> ${e[1].description.split('\n').join('\n> ')}\n${input}`;
            break;
          }
    }

    try {
      await editOrReply(
        context,
        createEmbed('defaultNoFooter', context, {
          author: {
            iconUrl: STATICS.openai,
            name: `​`,
          },
          image: {
            url: STATIC_ASSETS.chat_loading_small,
          },
        })
      );

      let res = await gpt(context, prompt, input, model);
      res = res.response;

      const description = [];
      const files = [];

      if (!res.body.response)
        return editOrReply(context, createEmbed('error', context, `OpenAI returned an error. Try again later.`));

      if (res.body.response.length <= 4000) description.push(res.body.response);
      else {
        files.push({
          filename: `chat.${Date.now().toString(36)}.txt`,
          value: Buffer.from(res.body.response),
        });
      }

      return editOrReply(context, {
        embeds: [
          createEmbed('defaultNoFooter', context, {
            author: {
              name: stringwrap(input, 50, false),
              iconUrl: STATICS.openai,
            },
            description: description.join('\n'),
            footer: {
              text: `OpenAI${res.body.model.startsWith('gpt-4o') ? '' : ` (${res.body.model})`} • Response may be factually wrong or completely made up.`,
            },
          }),
        ],
        files,
      });
    } catch (e) {
      console.log(e);
      if (e.response.body?.message)
        return editOrReply(context, createEmbed('warning', context, e.response.body.message));
      return editOrReply(context, createEmbed('error', context, `Unable to generate text.`));
    }
  },
};
