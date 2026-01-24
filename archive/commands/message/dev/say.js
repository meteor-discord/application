const { acknowledge } = require('#utils/interactions');

module.exports = {
  label: 'text',
  name: 'say',
  metadata: {
    description: 'speak.',
    description_short: 'speak',
    examples: ['say hug'],
    category: 'dev',
    usage: 'say <text>',
  },
  onBefore: context => context.user.isClientOwner,
  onCancel: () => {},
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.text || !args.text.trim()) {
      return context.reply({
        content: 'Cannot send an empty message.',
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (context.message.canDelete) context.message.delete();
    await context.reply({
      content: args.text,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
