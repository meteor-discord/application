const { PERMISSION_GROUPS } = require('#constants');
const { geminiVision } = require('#obelisk');

const { getRecentImage } = require('#utils/attachment');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { stringwrap, iconPill, smallIconPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATIC_ICONS } = require('#utils/statics');

module.exports = {
  name: 'gemini-vision',
  label: 'text',
  aliases: ['gv'],
  metadata: {
    description: `${smallIconPill('reply', 'Supports Replies')}\n\nRun Gemini Vision on an Image with a custom prompt.`,
    description_short: 'Run Gemini Vision ',
    examples: ['gv Which show is this image from?'],
    category: 'genai',
    usage: 'gemini-vision <attachment> <prompt>',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline, ...PERMISSION_GROUPS.attachments],
  run: async (context, args) => {
    return;
    await acknowledge(context);

    // for the sake of privacy, make the context window one message
    let image = await getRecentImage(context, 1);
    if (!image)
      return editOrReply(
        context,
        createEmbed('warning', context, 'No images found. Reply if you want a specific image.')
      );

    if (!args.text) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (text).`));

    let input = args.text;

    try {
      await editOrReply(context, createEmbed('ai_custom', context, STATIC_ICONS.ai_gemini));

      let res = await geminiVision(context, input, image);

      let description = [];
      let files = [];

      if (res.response.body.message)
        return editOrReply(context, createEmbed('error', context, e.response.body.message));

      let output = res.response.body.gemini?.candidates[0]?.content?.parts[0]?.text;
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
            thumbnail: {
              url: image,
            },
            description: description.join('\n'),
            footer: {
              text: `Generative AI is experimental • Data submitted to Gemini may be used by Google for training.`,
            },
          }),
        ],
        files,
      });
    } catch (e) {
      console.log(e);
      if (e.response?.body?.message)
        return editOrReply(context, createEmbed('error', context, e.response.body.message));
      return editOrReply(context, createEmbed('error', context, `Unable to generate response.`));
    }
  },
};
