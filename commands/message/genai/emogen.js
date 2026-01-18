const { emogen } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');

module.exports = {
  name: 'emogen',
  label: 'text',
  metadata: {
    description: `Emogen`,
    description_short: 'Emogen',
    examples: ['emogen otter eating a slice of pizza'],
    category: 'genai',
    usage: 'emogen <prompt>',
  },
  args: [{ name: 'style', default: 'microsoft', required: false, help: 'Emogen Style' }],
  permissionsClient: [...PERMISSION_GROUPS.baseline, ...PERMISSION_GROUPS.attachments],
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.text) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (prompt).`));

    try {
      await editOrReply(context, createEmbed('loading', context, 'Generating emoji...'));

      const res = await emogen(context, args.text, args.style);

      const file = `emogen.${Date.now()}.png`;

      return editOrReply(context, {
        embeds: [
          createEmbed('image', context, {
            url: file,
          }),
        ],
        files: [
          {
            filename: file,
            value: res.response.body,
          },
        ],
      });
    } catch (e) {
      console.log(e);
      if (e.response?.body?.message)
        return editOrReply(context, createEmbed('error', context, e.response.body.message));
      return editOrReply(context, createEmbed('error', context, `Unable to generate emoji.`));
    }
  },
};
