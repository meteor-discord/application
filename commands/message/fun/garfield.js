const { garfield } = require('#api');
const { FUNNY_CAT_ICONS, PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { timestamp } = require('#utils/markdown');
const { editOrReply } = require('#utils/message')

module.exports = {
  name: 'garfield',
  aliases: ['garf'],
  metadata: {
    description: 'Returns a random garfield comic strip.',
    description_short: 'Random garfield comic',
    category: 'fun',
    usage: `garfield`,
    slashCommand: "garfield"
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context) => {
    await acknowledge(context);
    
    
    const garf = (await garfield()).response.body

    return editOrReply(context, createEmbed("default", context, {
      description: `${FUNNY_CAT_ICONS[Math.floor(Math.random() * FUNNY_CAT_ICONS.length)]} Garfield Comic Strip for ${timestamp(new Date(garf.date), "D")}`,
      image: {
        url: garf.comic
      }
    }))
  }
};