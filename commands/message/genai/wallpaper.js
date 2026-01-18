const { PERMISSION_GROUPS } = require('#constants');
const { GenerativeImagesModelsWallpaper } = require('#obelisk');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { iconPill, stringwrap } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATIC_ICONS, STATIC_ASSETS } = require('#utils/statics');
const { hasFeature } = require('#utils/testing');

module.exports = {
  name: 'wallpaper',
  label: 'text',
  aliases: ['aiwp'],
  metadata: {
    description: `${iconPill('generative_ai', 'LIMITED TESTING')}\n\nGenerate AI Wallpapers`,
    description_short: 'Create Wallpapers',
    examples: ['wallpaper a painting of northern lights, in the bauhaus style -format square'],
    category: 'broken',
    usage: 'wallpaper <prompt> [-format <square|landscape>]',
  },
  args: [{ name: 'format', default: 'landscape', required: false, help: 'Image style (landscape, square).' }],
  permissionsClient: [...PERMISSION_GROUPS.baseline, ...PERMISSION_GROUPS.attachments],
  run: async (context, args) => {
    if (!(await hasFeature(context, 'ai/imagen'))) return;
    await acknowledge(context);

    if (!args.text) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (prompt).`));

    try {
      let loadingEmbeds = [];
      for (let i = 0; i < 4; i++) {
        loadingEmbeds.push(
          createEmbed('defaultNoFooter', context, {
            url: 'https://lajczi.dev',
            footer: {
              iconUrl: STATIC_ICONS.ai_image_processing,
              text: 'Generating images...',
            },
            image: {
              url: STATIC_ASSETS.image_placeholder,
            },
          })
        );
      }

      await editOrReply(context, { embeds: loadingEmbeds });

      let res = await GenerativeImagesModelsWallpaper(context, args.text, args.format.toUpperCase());

      // Construct Embeds
      let files = [];
      let embeds = res.response.body.images.map(i => {
        let imgName = `lcigen.${(Date.now() + Math.random()).toString(36)}.jpeg`;

        files.push({
          filename: imgName,
          value: Buffer.from(i, 'base64'),
        });
        return createEmbed('defaultNoFooter', context, {
          url: 'https://lajczi.dev',
          image: {
            url: `attachment://${imgName}`,
          },
          footer: {
            iconUrl: STATIC_ICONS.ai_image,
            text: stringwrap(args.text, 50, false),
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
