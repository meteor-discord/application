const { garfield } = require('#api');
const { FUNNY_CAT_ICONS, PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { timestamp } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const {
  InteractionContextTypes,
  ApplicationIntegrationTypes,
  ApplicationCommandOptionTypes,
} = require('detritus-client/lib/constants');

module.exports = {
  description: 'Shows a random Garfield comic strip.',
  name: 'garfield',
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

    const garf = (await garfield()).response.body;

    return editOrReply(
      context,
      createEmbed('default', context, {
        description: `${FUNNY_CAT_ICONS[Math.floor(Math.random() * FUNNY_CAT_ICONS.length)]} Garfield Comic Strip for ${timestamp(new Date(garf.date), 'D')}`,
        image: {
          url: garf.comic,
        },
      })
    );
  },
};
