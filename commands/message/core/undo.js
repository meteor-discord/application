const { PERMISSION_GROUPS } = require('#constants');
const { createEmbed } = require('#utils/embed');
const { editOrReply } = require('#utils/message');

module.exports = {
  name: 'undo',
  default: 1,
  label: 'amount',
  metadata: {
    description: 'Remove recent command responses from chat.',
    description_short: 'Undo last command',
    examples: ['undo 5'],
    category: 'core',
    usage: 'undo [<amount (1-5)>]',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    try {
      if (typeof args.amount == 'string') args.amount = parseInt(args.amount);
      if (!args.amount) args.amount = 1;
      if (args.amount >= 6 || args.amount <= 0)
        return await editOrReply(context, createEmbed('warning', context, 'Invalid Argument (amount)'));
      let cmds = [];
      let found = 0;
      for (const c of context.commandClient.replies.toArray().reverse()) {
        if (found >= args.amount) break;
        if (c.context.channelId !== context.channelId || c.context.userId !== context.userId) continue;
        if (c.context.message.canDelete) cmds.push(c.context.message.id);
        if (c.reply.canDelete && !c.reply.deleted) {
          cmds.push(c.reply.id);
          found++;
        }
      }

      if (cmds.length == 1 || !context.canManage) {
        for (let id of cmds) await context.channel.deleteMessage(id);
      } else {
        await context.channel.bulkDelete(cmds);
      }

      if (context.canManage) await context.message.delete();
    } catch (e) {
      console.log(e);
    }
  },
};
