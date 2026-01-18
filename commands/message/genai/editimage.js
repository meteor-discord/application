const { googleGenaiEditImage } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { iconPill, stringwrap, stringwrapPreserveWords } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATIC_ASSETS, STATIC_ICONS } = require('#utils/statics');
const { hasFeature } = require('#utils/testing');
const { getRecentImage } = require('#utils/attachment');

module.exports = {
  name: 'editimage',
  label: 'text',
  aliases: ['edit'],
  metadata: {
    description: `${iconPill('generative_ai', 'LIMITED TESTING')}\n\nEdit images`,
    description_short: 'Edit images',
    examples: ['edit make it red!'],
    category: 'limited',
    usage: 'edit <attachment> <prompt>',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline, ...PERMISSION_GROUPS.attachments],
  run: async (context, args) => {
    if (!(await hasFeature(context, 'ai/imagen'))) return;
    await acknowledge(context);

    let image = await getRecentImage(context, 50);
    if (!image) return editOrReply(context, createEmbed('warning', context, 'No images found.'));

    if (!args.text) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (prompt).`));

    try {
      await editOrReply(
        context,
        createEmbed('defaultNoFooter', context, {
          url: 'https://lajczi.dev',
          author: {
            iconUrl: image,
            name: stringwrap(args.text, 50, false),
          },
          image: {
            url: STATIC_ASSETS.image_placeholder,
          },
          footer: {
            iconUrl: STATIC_ICONS.ai_image_processing,
            text: 'Editing image...',
          },
        })
      );

      let res = await googleGenaiEditImage(context, args.text, image);

      let imgName = `lciedt.${(Date.now() + Math.random()).toString(36)}.${res.response.headers['content-type'].split('/')[1]}`;
      return await editOrReply(context, {
        embed: createEmbed('default', context, {
          url: 'https://lajczi.dev',
          author: {
            iconUrl: image,
            name: stringwrap(args.text, 50, false),
          },
          image: {
            url: `attachment://${imgName}`,
          },
        }),
        files: [
          {
            filename: imgName,
            value: res.response.body,
          },
        ],
      });
    } catch (e) {
      console.log(e);
      if (e.response?.body?.message)
        return editOrReply(
          context,
          createEmbed('error', context, stringwrapPreserveWords(e.response.body.message, 256, true))
        );
      return editOrReply(context, createEmbed('error', context, `Unable to edit image.`));
    }
  },
};
