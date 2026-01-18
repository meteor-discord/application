const { createEmbed } = require('#utils/embed');
const { smallPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message')

const { execSync } = require('child_process');

module.exports = {
  name: "update",
  label: "flags",
  metadata: {
    description: `Updates bot code from git.\nUse ${smallPill('-f')} to force an update.`,
    description_short: 'Update bot code.',
    examples: ['update'],
    category: 'dev',
    usage: 'update'
  },
  onBefore: context => context.user.isClientOwner,
  onCancel: () => { },
  run: async (context, args) => {
    await editOrReply(context, createEmbed("loading", context, "Updating bot..."))
    
    try {
      const t = Date.now()
      if(args.flags.includes('-force') || args.flags.includes('-f')) execSync("git checkout .")
      const r = execSync("git pull")
      if(r.toString().includes("Already up to date.")) return await editOrReply(context, createEmbed("warning", context, "Already up to date."))

      let com = r.toString().match(/([a-z0-9]{7})\.\.([a-z0-9]{7})/)
      
      return await editOrReply(context, createEmbed("success", context, `Updated ${com[1]} -> ${com[2]} in ${((Date.now() - t) / 1000).toFixed(2)}s`))
    } catch (e) {
      console.log(e)
      return await editOrReply(context, createEmbed("error", context, "Manager reported error during update query."))
    }
  }
};