const { OPEN_SOURCE_REPOSITORY_URL } = require('#constants');
const { createEmbed } = require('#utils/embed');
const { editOrReply } = require('#utils/message');
const { icon } = require('#utils/markdown');

module.exports = {
  name: 'source',
  aliases: ['src', 'code'],
  metadata: {
    description: 'View the source code repository for this bot.',
    description_short: 'View source code',
    examples: ['source'],
    category: 'utils',
    usage: 'source',
  },
  run: async context => {
    return editOrReply(context, {
      embeds: [
        createEmbed('default', context, {
          title: `${icon('robot')} Source Code`,
          description: `This bot is open source! View the source code on GitHub.`,
          footer: {
            text: `${context.application.name} • Open Source`,
          },
        }),
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'View on GitHub',
              url: OPEN_SOURCE_REPOSITORY_URL,
              emoji: { name: '🔗' },
            },
          ],
        },
      ],
    });
  },
};
