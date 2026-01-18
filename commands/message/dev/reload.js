const { acknowledge } = require('#utils/interactions');
const { codeblock } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

// TODO: remake this eventually
module.exports = {
  name: 'reload',
  aliases: ['rl'],
  metadata: {
    description: 'Reloads commands. Add `-s` to also re-register interaction commands.',
    description_short: 'Reload Commands',
    category: 'dev',
    usage: 'reload [-s]',
  },
  onBefore: context => context.user.isClientOwner,
  onCancel: () => {},
  run: async context => {
    await acknowledge(context);

    const time = Date.now();
    console.log(
      `[${process.env.HOSTNAME}] refreshing all commands @ ${Date.now()} by ${context.user.username}${context.user.discriminator} (${context.user.id})`
    );

    try {
      if (context.message.content.includes('-s')) {
        const interactionClient = context.client.interactionCommandClient;
        if (interactionClient) {
          interactionClient.clear();

          // Directories specific to the interaction client
          await interactionClient.addMultipleIn('../commands/interaction/context', { subdirectories: true });
          await interactionClient.addMultipleIn('../commands/interaction/user', { subdirectories: true });
          await interactionClient.addMultipleIn('../commands/interaction/slash', { subdirectories: true });

          await interactionClient.checkAndUploadCommands();
        }
      }

      const commandClient = context.client.commandClient;
      if (commandClient) {
        commandClient.clear();
        await commandClient.addMultipleIn('../commands/message/', { subdirectories: true });
      }

      let diff = Date.now() - time;
      return editOrReply(context, `Reloaded commands in **\`${diff}ms\`**.`);
    } catch (e) {
      let diff = Date.now() - time;
      return editOrReply(
        context,
        `Failed to reload all commands after **\`${diff}ms\`**.\n` + codeblock('js', [e.stack || e.message])
      );
    }
  },
};
