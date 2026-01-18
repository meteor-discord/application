const { otter } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message')

module.exports = {
  name: 'otter',
  metadata: {
    description: 'Displays a random image containing otters.',
    description_short: 'Otter images',
    category: 'fun',
    usage: `otter`,
    slashCommand: "otter"
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context) => {
    await acknowledge(context);
    
    try{
      const ott = (await otter()).response.body
    
      return editOrReply(context, createEmbed("default", context, {
        image: {
          url: ott.url
        }
      }))
    }catch(e){
      console.log(e)
      return editOrReply(context, createEmbed("error", context, `Unable to fetch otter.`))
    }
  }
};