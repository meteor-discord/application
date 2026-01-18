const { PERMISSION_GROUPS } = require('#constants');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');
const { getUserAvatar } = require('#utils/users');

const { ApplicationCommandOptionTypes, InteractionContextTypes, ApplicationIntegrationTypes } = require("detritus-client/lib/constants");

module.exports = {
  description: 'Get someones avatar.',
  name: 'avatar',
  contexts: [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.PRIVATE_CHANNEL,
    InteractionContextTypes.BOT_DM
  ],
  integrationTypes: [
    ApplicationIntegrationTypes.USER_INSTALL
  ],
  options: [
    {
      name: 'user',
      description: 'User to get the avatar from.',
      type: ApplicationCommandOptionTypes.USER,
      required: false
    },
    {
      name: 'incognito',
      description: 'Makes the response only visible to you.',
      type: ApplicationCommandOptionTypes.BOOLEAN,
      required: false,
      default: false
    }
  ],
  run: async (context, args) => {
    await acknowledge(context, args.incognito, [...PERMISSION_GROUPS.baseline_slash]);

    if(!args.user) return editOrReply(context, createEmbed("default", context, {
      image: {
        url: getUserAvatar(context.user)
      }
    }))

    return editOrReply(context, createEmbed("default", context, {
      image: {
        url: getUserAvatar(args.user)
      }
    }))
  },
};