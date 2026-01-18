const { googleVisionOcr } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { getRecentImage } = require('#utils/attachment');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { codeblock, smallIconPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

module.exports = {
  name: 'ocr',
  metadata: {
    description: `${smallIconPill('reply', 'Supports Replies')}\n\nUses Optical Character Recognition to detect text in images.`,
    description_short: 'Image text recognition.',
    category: 'utils',
    usage: 'ocr <attachment>',
    slashCommand: 'OCR',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async context => {
    await acknowledge(context);

    let image = await getRecentImage(context, 50);
    if (!image) return editOrReply(context, createEmbed('warning', context, 'No images found.'));

    let ocr;
    try {
      ocr = await googleVisionOcr(context, image);
    } catch (e) {
      return editOrReply(context, createEmbed('error', context, 'Unable to retrieve Google Vision API response.'));
    }

    if (ocr.response.body.status == 1)
      return editOrReply(context, createEmbed('warning', context, ocr.response.body.text));

    return editOrReply(
      context,
      createEmbed('default', context, {
        thumbnail: {
          url: image,
        },
        description: codeblock('ansi', [ocr.response.body.text.substr(0, 4000)]),
        footer: {
          iconUrl: STATICS.googlelens,
          text: `Google Lens • ${context.application.name} • Took ${ocr.timings}s`,
        },
      })
    );
  },
};
