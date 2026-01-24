const { googleVisionSafetyLabels } = require('#api');
const { GOOGLE_CLOUD_SAFETY_LABELS, GOOGLE_CLOUD_SAFETY_LABELS_NAMES, PERMISSION_GROUPS } = require('#constants');

const { getRecentImage } = require('#utils/attachment');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { iconPill, smallPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

module.exports = {
  name: 'safetylabels',
  cooldown: 10,
  metadata: {
    description: 'Applies detection labels for potentially sensitive content of an image.',
    description_short: 'Sensitive content detection labels',
    category: 'utils',
    usage: 'safetylabels <attachment>',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async context => {
    await acknowledge(context);

    const image = await getRecentImage(context, 50);
    if (!image) return editOrReply(context, createEmbed('warning', context, 'No images found.'));

    const label = await googleVisionSafetyLabels(context, image);

    const labels = [];
    for (const l of Object.keys(label.response.body.labels)) {
      const rating = GOOGLE_CLOUD_SAFETY_LABELS[label.response.body.labels[l]];
      labels.push([smallPill(GOOGLE_CLOUD_SAFETY_LABELS_NAMES[l]), iconPill(rating.icon, rating.name)].join(' ​ ​'));
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
  },
};
