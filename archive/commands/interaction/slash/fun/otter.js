const { otter } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');

const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');

module.exports = {
  description: 'Shows a random otter picture.',
  name: 'otter',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'incognito',
      description: 'Makes the response only visible to you.',
      type: ApplicationCommandOptionTypes.BOOLEAN,
      required: false,
      default: false,
    },
  ],
  run: async (context, args) => {
    await acknowledge(context, args.incognito, [...PERMISSION_GROUPS.baseline_slash]);

    try {
      const ott = (await otter()).response.body;

      return editOrReply(
        context,
        createEmbed('default', context, {
          image: {
            url: ott.url,
          },
        })
      );
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to fetch otter.`));
    }
  },
};
