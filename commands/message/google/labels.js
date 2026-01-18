const { googleVisionLabels } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { getRecentImage } = require('#utils/attachment');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { pill, smallPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

module.exports = {
  name: 'labels',
  metadata: {
    description: 'Applies labels to an image based on its visual contents.',
    description_short: 'Image content label detection',
    category: 'utils',
    usage: 'labels <attachment>',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async context => {
    await acknowledge(context);

    try {
      let image = await getRecentImage(context, 50);
      if (!image) return editOrReply(context, createEmbed('warning', context, 'No images found.'));

      let label = await googleVisionLabels(context, image);

      let labels = [];
      for (const l of label.response.body.labels) {
        labels.push(
          smallPill(`${l.score.toString().substr(2, 2)}.${l.score.toString().substr(3, 1)}%`) + ' ​ ​' + pill(l.name)
        );
      }
      return editOrReply(
        context,
        createEmbed('default', context, {
          description: labels.join('\n'),
          thumbnail: {
            url: image,
          },
          footer: {
            iconUrl: STATICS.googlelens,
            text: `Google Lens • ${context.application.name}`,
          },
        })
      );
    } catch (e) {
      console.error(e);
      if (e.response?.body?.message)
        return editOrReply(
          context,
          createEmbed(e.response.body.status === 1 ? 'warning' : 'error', context, e.response.body.message)
        );

      return editOrReply(context, createEmbed('error', context, 'Unable to get labels for this image.'));
    }
  },
};
