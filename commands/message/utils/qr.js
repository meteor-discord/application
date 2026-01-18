const { getRecentImage } = require('#utils/attachment');
const { createEmbed } = require('#utils/embed');
const { editOrReply } = require('#utils/message');
const { codeblock, icon, smallIconPill } = require('#utils/markdown');
const { STATICS } = require('#utils/statics');

const superagent = require('superagent');
const { PERMISSION_GROUPS } = require('#constants');
const { acknowledge } = require('#utils/interactions');

module.exports = {
  name: 'qr',
  label: 'text',
  aliases: ['scan'],
  metadata: {
    description: `${smallIconPill('reply', 'Supports Replies')}\n\nGenerates a QR code. If no input is provided acts as a QR code scanner.`,
    description_short: 'QR Code scanner/generator.',
    examples: ['qr big nutty'],
    category: 'utils',
    usage: `qr <contents>`,
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline, ...PERMISSION_GROUPS.attachments],
  run: async (context, args) => {
    await acknowledge(context);

    // If we have an argument, generate code
    if (args.text.length) {
      const response = await editOrReply(context, createEmbed('loading', context, `Generating qr code...`));
      try {
        const t = Date.now();

        const res = await superagent.get(`https://api.qrserver.com/v1/create-qr-code/`).query({
          size: '1024x1024',
          data: args.text,
        });

        return await editOrReply(context, {
          embeds: [
            createEmbed('image', context, {
              url: 'qrcode.png',
              time: ((Date.now() - t) / 1000).toFixed(2),
            }),
          ],
          files: [{ filename: 'qrcode.png', value: res.body }],
        });
      } catch (e) {
        return await editOrReply(context, createEmbed('error', context, `Unable to generate qr code.`));
      }
    }

    const image = await getRecentImage(context, 50);
    if (!image) return editOrReply(context, createEmbed('warning', context, 'No images found.'));

    try {
      const t = Date.now();

      const res = await superagent.get(`https://api.qrserver.com/v1/read-qr-code/`).query({
        fileurl: image,
      });

      if (!res.body[0].symbol[0].data)
        return editOrReply(context, createEmbed('warning', context, 'No QR codes found.'));

      const resultData = res.body[0].symbol[0].data.split('\nQR-Code:');
      const results = [];
      for (const r of resultData) {
        results.push(codeblock('ansi', [r]));
      }

      let s = '';
      if (resultData.length >= 2) s = 's';

      return await editOrReply(
        context,
        createEmbed('default', context, {
          description: `${icon('qr')} Found **${resultData.length}** QR Code${s}:${results.join(' ')}`,
          thumbnail: {
            url: image,
          },
          footer: {
            iconUrl: STATICS.labscore,
            text: `labsCore • Took ${((Date.now() - t) / 1000).toFixed(2)}s`,
          },
        })
      );
    } catch (e) {
      return editOrReply(context, createEmbed('error', context, `Unable to scan qr codes.`));
    }
  },
};
