const { PERMISSION_GROUPS } = require('#constants');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message')

module.exports = {
  name: 'serverbanner',
  aliases: ["guildbanner", "gb", "sb", "groupbanner"],
  metadata: {
    description: 'Displays the server banner.',
    description_short: 'Server banner',
    category: 'info',
    usage: 'serverbanner'
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context) => {
    await acknowledge(context);
    
    if (!context.guild.bannerUrl) return editOrReply(context, createEmbed("warning", context, "Server doesn't have a banner set."))
    return editOrReply(context, createEmbed("default", context, {
      image: {
        url: context.guild.bannerUrl + "?size=4096"
      }
    }))
  },
};