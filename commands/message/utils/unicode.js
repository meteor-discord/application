const { unicodeMetadata } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { pill, smallIconPill, smallPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

module.exports = {
  label: 'input',
  name: 'unicode',
  aliases: ['chars'],
  metadata: {
    description: `${smallIconPill('reply', 'Supports Replies')}\n\nLists every unicode character in a string or message.`,
    description_short: 'View unicode codepoints and names.',
    examples: ['unicode 😀', 'chars Hello World 🐱🍞'],
    category: 'utils',
    usage: 'unicode <string>',
    slashCommand: 'unicode',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    let msg = context.message;
    if (context.message.messageReference) {
      msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId);
      args.input = msg.content;
    }

    if (!args.input.length) return editOrReply(context, createEmbed('warning', context, 'No input provided.'));

    try {
      const meta = await unicodeMetadata(context, args.input);

      const chars = meta.response.body;
      const pages = [];

      console.log(meta.response.body);
      while (chars.length) {
        const cset = chars.splice(0, 20);

        let padLen = 0;
        cset.map(c => {
          if (padLen < c.name.length) padLen = c.name.length;
        });
        pages.push(
          page(
            createEmbed('default', context, {
              description: cset.map(c => `${pill(c.name.padEnd(padLen, ' '))} ${smallPill(c.codepoint)}`).join('\n'),
            })
          )
        );
      }

      return paginator.createCardStack(context, {
        cards: pages,
      });
    } catch (e) {
      return editOrReply(context, createEmbed('error', context, e?.response?.body?.message || 'Something went wrong.'));
    }
  },
};
