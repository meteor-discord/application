const { createEmbed } = require('#utils/embed');
const { editOrReply } = require('#utils/message');
const { icon } = require('#utils/markdown');

const { Permissions } = require('detritus-client/lib/constants');
const { PERMISSION_GROUPS } = require('#constants');
const { acknowledge } = require('#utils/interactions');

module.exports = {
  label: 'filter',
  name: 'purge',
  aliases: ['clear', 'p'],
  metadata: {
    description: `Removes recent messages in chat. Allows you to optionally filter by message content to remove spam.`,
    description_short: 'Mass-delete recent messages',
    examples: ['purge Spam -amount 25'],
    category: 'mod',
    usage: 'purge [<content>] [-amount <1-50>] [-case <true|false>]',
  },
  args: [
    { default: 20, name: 'amount', type: 'integer', help: 'Amount of messages to be checked (1-20)' },
    { default: true, name: 'case', type: 'bool', help: 'If provided, should the search query be case sensitive' },
  ],
  permissionsClient: [...PERMISSION_GROUPS.baseline, Permissions.MANAGE_MESSAGES],
  permissions: [Permissions.MANAGE_MESSAGES],
  onPermissionsFail: context =>
    editOrReply(context, {
      content: `${icon('exclaim_red')} ${context.message.author.mention}, you are lacking the permission \`Manage Messages\`.`,
    }),
  ratelimit: {
    type: 'guild',
    limit: 1,
    duration: 5000,
  },
  run: async (context, args) => {
    await acknowledge(context);

    if (isNaN(parseInt(args.amount))) return editOrReply(context, createEmbed('warning', context, 'Invalid Amount'));

    if (args.amount >= 51 || args.amount <= 0) {
      return editOrReply(context, {
        content: `${icon('exclaim_red')} ${context.message.author.mention}, Invalid amount (1-50).`,
      });
    }
    const messages = await context.message.channel.fetchMessages({ limit: args.amount });
    const deleteIds = [];
    messages.forEach(message => {
      if (args.filter.length >= 1) {
        if (message.canDelete && Date.now() - new Date(message.timestamp) <= 1209000000) {
          if (args.case === false) {
            if (message.content.toLowerCase().includes(args.filter.toLowerCase())) {
              deleteIds.push(message.id);
            }
          } else {
            if (message.content.includes(args.filter)) {
              deleteIds.push(message.id);
            }
          }
        }
      } else {
        if (message.canDelete && Date.now() - new Date(message.timestamp) <= 1209000000) {
          deleteIds.push(message.id);
        }
      }
    });

    if (deleteIds.length === 0) {
      return editOrReply(context, { content: `${icon('exclaim_red')} No messages found.` });
    }
    if (deleteIds.length === 1) {
      try {
        await context.client.rest.deleteMessage(context.channel.id, deleteIds[0]);
        return editOrReply(context, { content: `${icon('exclaim_green')} Removed \`1\` message.` });
      } catch {
        await editOrReply(context, {
          content: `${icon('exclaim_red')} Something went wrong while attempting to remove \`1\` message.`,
        });
      }
    } else {
      try {
        await context.client.rest.bulkDeleteMessages(context.channel.id, deleteIds);
        return editOrReply(context, { content: `${icon('exclaim_green')} Removed \`${deleteIds.length}\` messages.` });
      } catch {
        await editOrReply(context, {
          content: `${icon('exclaim_red')} Something went wrong while attempting to remove \`${deleteIds.length}\` messages.`,
        });
      }
    }
  },
};
