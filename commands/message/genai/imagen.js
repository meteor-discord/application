const { googleGenaiImagen } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { stringwrap } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATIC_ICONS, STATIC_ASSETS } = require('#utils/statics');

module.exports = {
  name: 'imagen',
  label: 'text',
  aliases: ['aiimg'],
  metadata: {
    description: `Generate images with Imagen 3`,
    description_short: 'Create Images with Imagen 3',
    examples: ['imagen a painting of northern lights'],
    category: 'genai',
    usage: 'imagen <prompt>',
  },
  args: [{ name: 'model', default: 'imagen-4', required: false, help: 'The model.' }],
  permissionsClient: [...PERMISSION_GROUPS.baseline, ...PERMISSION_GROUPS.attachments],
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.text) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (prompt).`));

    let model = 'imagen-4';
    if (args.model) model = args.model;

    const IMAGE_COUNT = 4;

    try {
      const loadingEmbeds = [];
      for (let i = 0; i < IMAGE_COUNT; i++) {
        loadingEmbeds.push(
          createEmbed('defaultNoFooter', context, {
            url: 'https://lajczi.dev',
            image: {
              url: STATIC_ASSETS.image_placeholder,
            },
            footer: {
              iconUrl: STATIC_ICONS.ai_image_processing,
              text: 'Generating images...',
            },
          })
        );
      }

      await editOrReply(context, { embeds: loadingEmbeds });

      const res = await googleGenaiImagen(context, args.text, IMAGE_COUNT, model);

      // Construct Embeds
      const files = [];
      const embeds = res.response.body.predictions.map(i => {
        const imgName = `lcigen.${(Date.now() + Math.random()).toString(36)}.${i.mimeType.split('/')[1]}`;

        files.push({
          filename: imgName,
          value: Buffer.from(i.bytesBase64Encoded, 'base64'),
        });
        return createEmbed('defaultNoFooter', context, {
          url: 'https://lajczi.dev',
          image: {
            url: `attachment://${imgName}`,
          },
          footer: {
            iconUrl: STATIC_ICONS.ai_image,
            text: stringwrap(args.text, 25, false) + ` • ${res.response.body.model}`,
          },
        });
      });

      return editOrReply(context, { embeds, files });
    } catch (e) {
      console.log(e);
      if (e.response?.body?.message)
        return editOrReply(context, createEmbed('error', context, e.response.body.message));
      return editOrReply(context, createEmbed('error', context, `Unable to generate image.`));
    }
  },
};
