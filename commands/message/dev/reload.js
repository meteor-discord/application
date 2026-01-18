const { acknowledge } = require("#utils/interactions");
const { codeblock } = require("#utils/markdown");
const { editOrReply } = require("#utils/message");

// TODO: remake this eventually
module.exports = {
  name: "reload",
  aliases: ["rl"],
  metadata: {
    description: 'Reloads commands on all shards. Add `-s` to also re-register interaction commands.',
    description_short: 'Reload Commands',
    category: 'dev',
    usage: 'reload [-s]'
  },
  onBefore: context => context.user.isClientOwner,
  onCancel: ()=>{},
  run: async (context) => {
    await acknowledge(context);
    
    const time = Date.now();
    console.log(`[${process.env.HOSTNAME}] refreshing all commands @ ${Date.now()} by ${context.user.username}${context.user.discriminator} (${context.user.id})`)
    let data;
    if(context.message.content.includes("-s")) data = await context.manager.broadcastEval(async (cluster) => {
      if (cluster.interactionCommandClient){
        const interactionClient = cluster.interactionCommandClient;
        interactionClient.clear();
        
        // Directories specific to the interaction client
        await interactionClient.addMultipleIn('../commands/interaction/context', {subdirectories: true});
        await interactionClient.addMultipleIn('../commands/interaction/user', {subdirectories: true});
        await interactionClient.addMultipleIn('../commands/interaction/slash', {subdirectories: true});
        
        await interactionClient.checkAndUploadCommands();
      }
      if (cluster.commandClient) {
        const commandClient = cluster.commandClient;
        commandClient.clear();

        await commandClient.addMultipleIn('../commands/message/', {subdirectories: true});
      }
      return cluster.shards.length;
    });
    else data =  await context.manager.broadcastEval(async (cluster) => {
      if (cluster.commandClient) {
        const commandClient = cluster.commandClient;
        commandClient.clear();

        await commandClient.addMultipleIn('../commands/message/', {subdirectories: true});
      }
      return cluster.shards.length;
    });
    let refreshed = data.map((e)=>{return parseInt(e)}).reduce((a, b) => {return a + b}, 0)
    let diff = Date.now();
    if (diff < time) diff.setDate(diff.getDate() + 1);
    diff = diff - time;
    if(`${refreshed}` == "NaN"){
      return editOrReply(context, `Failed to reload all commands after **\`${diff}ms\`**.\n` + codeblock("js",[`${data[0].stack}`]))
    }
    return editOrReply(context, `Reloaded commands on \`${refreshed}/${context.manager.cluster.shardCount}\` shards in **\`${diff}ms\`**.`)
  }
};