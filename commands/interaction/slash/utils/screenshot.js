const { PERMISSION_GROUPS, SCREENSHOT_ASSET_REVISION } = require('#constants');
const { webshot } = require('#api');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');

const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');

module.exports = {
  name: 'screenshot',
  description: 'Create a screenshot of a website.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'url',
      description: 'Website URL.',
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
    await acknowledge(context, args.incognito, [...PERMISSION_GROUPS.baseline_slash, PERMISSION_GROUPS.attachments]);

    await editOrReply(context, createEmbed('loading', context, `Creating website screenshot...`));

    try {
      const t = Date.now();

      let ss = await webshot(context, args.url, false); // nsfw sites are always blocked

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
    } catch (e) {
      console.log(e);
      if (e.response?.body?.status === 2)
        return await editOrReply(context, createEmbed('error', context, e.response.body.message));
      return editOrReply(
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
