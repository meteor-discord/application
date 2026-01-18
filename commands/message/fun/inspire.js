const { PERMISSION_GROUPS } = require('#constants');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

const superagent = require('superagent');

module.exports = {
  name: 'inspire',
  aliases: ['insp'],
  metadata: {
    description: 'Generates a random inspirational quote.',
    description_short: 'Inspirational Quotes',
    category: 'fun',
    usage: `inspire`,
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async context => {
    await acknowledge(context);

    try {
      let res = await superagent.get(`https://inspirobot.me/api?generate=true`).set('User-Agent', 'meteor/2.0');

      return await editOrReply(
        context,
        createEmbed('image', context, {
          url: res.text,
          provider: {
            icon: STATICS.inspirobot,
            text: 'Inspirobot',
          },
        })
      );
    } catch (e) {
      return editOrReply(context, createEmbed('error', context, `Unable to fetch inspirational quote.`));
    }
  },
};
