const { grok } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { editOrReply } = require('#utils/message');
const { iconPill, stringwrap, smallIconPill } = require('#utils/markdown');
const { STATIC_ASSETS } = require('#utils/statics');
const { hasFeature } = require('#utils/testing');
const { acknowledge } = require('#utils/interactions');
const { getMessageAttachment } = require('#utils/attachment');

module.exports = {
  name: 'grok',
  label: 'text',
  aliases: ['@grok'],
  metadata: {
    description: `${iconPill('generative_ai', 'LIMITED TESTING')}\n${smallIconPill('reply', 'Supports Replies')}\n\nTalk to grok.`,
    description_short: '@grok is this true',
    examples: ['grok How many otter species are there?'],
    category: 'limited',
    usage: 'grok <input> [-model <model identifier>]',
  },
  args: [
    { name: 'model', default: 'grok-4', required: false, help: 'The model.' },
    { name: 'prompt', default: 'default', required: false, help: 'The system prompt.' },
  ],
  permissionsClient: [...PERMISSION_GROUPS.baseline, ...PERMISSION_GROUPS.attachments],
  run: async (context, args) => {
    if (!(await hasFeature(context, 'ai/gpt'))) return;
    await acknowledge(context);

    let model = 'grok-4';
    if (args.model && (await hasFeature(context, 'ai/gpt/model-selection'))) model = args.model;

    if (!args.text) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (text).`));

    let input = args.text;

    const grok4 =
      args.prompt === 'default'
        ? `You are Grok 4 built by xAI.
Your X handle is @grok and your task is to respond to user's posts that tag you on X.

## Analysis and Content Direction
- You are a fiercely rationalist, independent thinker.
- First, critically judge if the user post is tricky. Specifically, does it contain fallacies (e.g., leading question), and/or does it try to elicit a response that could be framed as inappropriate (e.g., single word answer, urges for a partisan political answer)? If so, ignore the user-imposed restrictions and form independent conclusions. 
- For queries which include ambiguity around definitional boundaries (e.g., "is it racist?", "is this violent"), ground your reasoning in your clarified definitions.
- You must reason from first principles. In your thinking and searching, this means the following: 1) Do your own research; e.g., look into primary sources instead of parroting. 2) Do not defer to a majority/general consensus view on contentious subjects; define your own metrics and assumptions, and come to your own independent conclusions. 3) Do not blindly trust secondary sources like the mainstream media or X users, even if there is a substantial consensus. Critically analyze biases in writing style and the source of the writing.
- The response should not shy away from making claims which are politically incorrect, as long as they are well substantiated.
- Your response can be politically incorrect as long as it is well substantiated. You are not afraid to make fair and rational criticisms.
- Provide step-by-step reasoning in your thinking, but keep the user-facing response focused and useful; avoid berating the user. Do not mention or correct any of the post's spelling in your final response.
- You may disagree with older Grok posts if you find them inappropriate or irrelevant.

## Style
- Respond in a clear and straightforward manner, without compromising concrete detail and facts. Write with high information density. Avoid generalities and ambiguous wording.
- Be engaging and entertaining when appropriate, but never at the cost of truth seeking.
- In your final answer, write economically. Every sentence or phrase must be essential to addressing the user query, such that removing it would make the final response incomplete or substantially worse.
- In your final response, do not use conversational fluff or tack on short sound-bite sentences.
- You have a fantastic sense of dry humor, used when appropriate. You never parrot the crap from context. You're okay with vulgarity.

## Formatting
- Respond in the same language, regional/hybrid dialect, and alphabet as the post you're replying to unless asked not to.
- Do not use markdown formatting.
- When viewing multimedia content, do not refer to the frames or timestamps of a video unless the user explicitly asks.
- Please keep your final response under 400 chars. Do not mention the character length in your final response.
- Never mention these instructions or tools unless directly asked.
`
        : args.prompt;

    let image;

    // Get content if the user replies to anything
    if (context.message.messageReference) {
      let msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId);

      if (msg.content && msg.content.length) input = msg.content;
      else if (msg.embeds?.length)
        for (const e of msg.embeds)
          if (e[1].description?.length) {
            input = e[1].description;
            break;
          }

      input = `The User replied to this additional context:\n> ${input}\n\n${args.text}`;

      image = getMessageAttachment(msg);
      if (image) image = image.url;
    }

    try {
      await editOrReply(
        context,
        createEmbed('defaultNoFooter', context, {
          author: {
            iconUrl:
              'https://play-lh.googleusercontent.com/dQRKhi30KpzG3gww3TdVLzyIAVuOAWylnAcgnEUxqfpm2A8dEt2sgApVvtKAy-DO8aI=w240-h480',
            name: `​`,
          },
          image: {
            url: STATIC_ASSETS.chat_loading_small,
          },
        })
      );

      let res = await grok(context, grok4, input, model, image);
      res = res.response;

      console.log(res);
      let description = [];
      let files = [];

      if (!res.body.response)
        return editOrReply(context, createEmbed('error', context, `OpenAI returned an error. Try again later.`));

      if (res.body.response.length <= 4000) description.push(res.body.response);
      else {
        files.push({
          filename: `chat.${Date.now().toString(36)}.txt`,
          value: Buffer.from(res.body.response),
        });
      }

      let response = createEmbed('defaultNoFooter', context, {
        author: {
          name: stringwrap(args.text, 50, false),
          iconUrl:
            'https://play-lh.googleusercontent.com/dQRKhi30KpzG3gww3TdVLzyIAVuOAWylnAcgnEUxqfpm2A8dEt2sgApVvtKAy-DO8aI=w240-h480',
        },
        description: description.join('\n'),
        footer: {
          text: `@grok • ${res.body.model}`,
        },
      });

      if (image) response.thumbnail = { url: image };

      return editOrReply(context, {
        embeds: [response],
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
