const { createEmbed } = require('#utils/embed')
const { editOrReply } = require('#utils/message')

const { execSync } = require('child_process');

module.exports = {
  name: "reboot",
  label: "flags",
  metadata: {
    description: `Reboot the bot.`,
    description_short: 'Reboot the bot.',
    examples: ['reboot'],
    category: 'dev',
    usage: 'reboot'
  },
  onBefore: context => context.user.isClientOwner,
  onCancel: () => { },
  run: async (context) => {
    try{
      await editOrReply(context, createEmbed("loading", context, "Updating bot..."));
      execSync("git pull");
      await editOrReply(context, createEmbed("success", context, "Rebooting bot..."));
      execSync("pm2 restart pb-prd");
    }catch(e){
      console.log(e)
      await editOrReply(context, createEmbed("error", context, "Unable to reboot."))
    }
  }
};