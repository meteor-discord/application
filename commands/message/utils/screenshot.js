const { PERMISSION_GROUPS, SCREENSHOT_ASSET_REVISION } = require('#constants');
const { webshot } = require('#api');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');

// TODO: make this a constant, or add a URL util
const urlr = /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*(?::\d{1,5})?(?:\/\S*)?$/g;

module.exports = {
  label: 'url',
  name: 'screenshot',
  aliases: ['ss'],
  metadata: {
    description: 'Takes screenshots of a website.',
    description_short: 'Screenshot websites.',
    examples: ['ss google.com'],
    category: 'utils',
    usage: 'screenshot <link>',
    slashCommand: 'screenshot',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline, ...PERMISSION_GROUPS.attachments],
  run: async (context, args) => {
    await acknowledge(context);

    if (context.message.messageReference) {
      const msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId);
      if (msg.content && msg.content.length && args.url.length === 0) args.url = msg.content;
    }

    if (!args.url) return editOrReply(context, createEmbed('warning', context, 'No link provided.'));

    const urls = args.url.match(urlr);
    if (!urls) return editOrReply(context, createEmbed('warning', context, 'No link found.'));

    args.url = urls[0];

    await editOrReply(context, createEmbed('loading', context, `Creating website screenshot...`));

    try {
      const t = Date.now();

      const ss = await webshot(context, args.url, false);

      if (ss.response.body.error)
        return await editOrReply(
          context,
          createEmbed('image', context, {
            url: ss.response.body.error.image_url + '?r=' + SCREENSHOT_ASSET_REVISION,
            time: ((Date.now() - t) / 1000).toFixed(2),
          })
        );

      return await editOrReply(context, {
        embeds: [
          createEmbed('image', context, {
            url: 'screenshot.png',
            time: ((Date.now() - t) / 1000).toFixed(2),
          }),
        ],
        files: [{ filename: 'screenshot.png', value: ss.response.body }],
      });
    } catch {
      console.log(e);
      if (e.response?.body?.status === 2)
        return await editOrReply(context, createEmbed('error', context, e.response.body.message));

      return await editOrReply(
        context,
        createEmbed('image', context, {
          url:
            'https://bignutty.gitlab.io/webstorage4/v2/assets/screenshot/brand-update-2024/scr_unavailable.png?r=' +
            SCREENSHOT_ASSET_REVISION,
        })
      );
    }
  },
};
