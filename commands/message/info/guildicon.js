const { PERMISSION_GROUPS } = require('#constants');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message')

module.exports = {
  name: 'servericon',
  aliases: ["guildicon", "gi", "si", "groupicon"],
  metadata: {
    description: 'Displays the server icon.',
    description_short: 'Server icon',
    category: 'info',
    usage: 'servericon'
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context) => {
    await acknowledge(context);
    
    if (!context.guild.iconUrl) return editOrReply(context, createEmbed("warning", context, "Server doesn't have an icon."))
    return editOrReply(context, createEmbed("default", context, {
      image: {
        url: context.guild.iconUrl + "?size=4096"
      }
    }))
  },
};