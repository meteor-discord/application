const { createEmbed } = require('#utils/embed');
const { editOrReply } = require('#utils/message');
const { getUserAvatar } = require('#utils/users');

const { PERMISSION_GROUPS } = require('#constants');
const { acknowledge } = require('#utils/interactions');

const { ApplicationCommandTypes } = require('detritus-client/lib/constants');

module.exports = {
  name: 'View User Avatar',
  type: ApplicationCommandTypes.USER,
  contexts: [0, 1, 2],
  integrationTypes: [1],
  run: async (context, args) => {
    await acknowledge(context, false, [...PERMISSION_GROUPS.baseline_slash]);

    try {
      return editOrReply(
        context,
        createEmbed('default', context, {
          image: {
            url: getUserAvatar(args.user),
          },
        })
      );
    } catch (e) {
      console.log(e);
    }
  },
};
