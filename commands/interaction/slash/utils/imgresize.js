const { PERMISSION_GROUPS } = require('#constants');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { icon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { validateAttachment } = require('#utils/attachment');
const { STATICS } = require('#utils/statics');

const superagent = require('superagent');
const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');

module.exports = {
  name: 'imgresize',
  description: 'Resize an image to a specific size (e.g. 512x512).',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'image',
      description: 'Image to resize',
      type: ApplicationCommandOptionTypes.ATTACHMENT,
      required: true,
    },
    {
      name: 'size',
      description: 'Target size (e.g. 512x512 or 512 for square)',
      type: ApplicationCommandOptionTypes.STRING,
      required: true,
    },
    {
      name: 'incognito',
      description: 'Makes the response only visible to you.',
      type: ApplicationCommandOptionTypes.BOOLEAN,
      required: false,
      default: false,
    },
  ],
  run: async (context, args) => {
    await acknowledge(context, args.incognito, [...PERMISSION_GROUPS.baseline_slash, ...PERMISSION_GROUPS.attachments]);

    if (!validateAttachment(args.image, 'image'))
      return editOrReply(context, createEmbed('warning', context, 'Unsupported attachment type.'));

    const sizeMatch = args.size.match(/^(\d+)(?:x(\d+))?$/i);
    if (!sizeMatch)
      return editOrReply(context, createEmbed('warning', context, 'Invalid size format. Use "512x512" or "512".'));

    const width = parseInt(sizeMatch[1], 10);
    const height = sizeMatch[2] ? parseInt(sizeMatch[2], 10) : width;

    if (width > 4096 || height > 4096 || width < 1 || height < 1)
      return editOrReply(context, createEmbed('warning', context, 'Size must be between 1 and 4096.'));

    try {
      const t = Date.now();

      // Resize image via weserv.nl
      const resizeUrl = new URL('https://images.weserv.nl/');
      resizeUrl.searchParams.set('url', args.image.url.replace(/^https?:\/\//, ''));
      resizeUrl.searchParams.set('w', width);
      resizeUrl.searchParams.set('h', height);
      resizeUrl.searchParams.set('fit', 'cover');

      const resized = await superagent.get(resizeUrl.toString()).buffer(true);

      // Upload to e-z.host
      const upload = await superagent
        .post('https://api.e-z.host/files')
        .set('key', process.env.EZ_HOST_API_KEY)
        .attach('file', resized.body, `resized_${width}x${height}.${Date.now().toString(36)}.png`);

      if (!upload.body?.rawUrl) throw new Error('Upload failed');

      return editOrReply(context, {
        embeds: [
          createEmbed('default', context, {
            description: `${icon('image')} Resized to **${width}x${height}**`,
            fields: [
              { name: 'Size', value: `${width}x${height}px`, inline: true },
              { name: 'Format', value: 'PNG', inline: true },
            ],
            image: { url: upload.body.rawUrl },
            footer: {
              iconUrl: STATICS.meteor,
              text: `Meteor • Took ${((Date.now() - t) / 1000).toFixed(2)}s`,
            },
          }),
        ],
        components: [
          {
            type: 1,
            components: [
              { type: 2, style: 5, label: 'Download', url: upload.body.rawUrl, emoji: { id: '1362499096518201364' } },
            ],
          },
        ],
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, 'Unable to resize image.'));
    }
  },
};
