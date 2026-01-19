const { createEmbed } = require('#utils/embed');
const { smallPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);
const MAX_LOG_CHARS = 3800;

function truncateLog(text, limit = MAX_LOG_CHARS) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.slice(0, limit - 3) + '...';
}

module.exports = {
  name: 'update',
  label: 'flags',
  aliases: ['up'],
  metadata: {
    description: `Updates bot code from git.\nUse ${smallPill('-f')} to force an update.`,
    description_short: 'Update bot code.',
    examples: ['update'],
    category: 'dev',
    usage: 'update',
  },
  onBefore: context => context.user.isClientOwner,
  onCancel: () => {},
  run: async (context, args) => {
    await editOrReply(context, createEmbed('loading', context, 'Updating bot...'));

    try {
      const start = Date.now();
      const force = args.flags.includes('-force') || args.flags.includes('-f');

      if (force) await execAsync('git checkout .');

      const { stdout, stderr } = await execAsync('git pull');
      const output = (stdout || '') + (stderr || '');

      if (output.includes('Already up to date.')) {
        return await editOrReply(context, createEmbed('warning', context, 'Already up to date.'));
      }

      const match = output.match(/([a-z0-9]{7})\.{2}([a-z0-9]{7})/i);
      const range = match ? `${match[1]} -> ${match[2]}` : 'git pull';
      const logSnippet = truncateLog(output || 'git pull completed');
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);

      await editOrReply(
        context,
        createEmbed('default', context, {
          title: 'Manual Git Pull',
          description: `Updated ${range} in ${elapsed}s. Restarting...\n\n\u3010pull log\u3011\n\`\`\`\n${logSnippet}\n\`\`\``,
        })
      );

      // pm2 will restart us
      process.exit(0);
    } catch (e) {
      console.error(e);
      return await editOrReply(context, createEmbed('error', context, 'Manager reported error during update query.'));
    }
  },
};
