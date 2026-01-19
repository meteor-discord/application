const { createEmbed } = require('#utils/embed');
const { codeblock, smallPill, highlight } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);
const MAX_LOG_CHARS = 1800;

function truncateLog(text, limit = MAX_LOG_CHARS) {
  if (!text) return '';
  if (text.length <= limit) return text;
  const half = Math.floor((limit - 30) / 2);
  return text.slice(0, half) + '\n...\n' + text.slice(-half);
}

module.exports = {
  name: 'update',
  label: 'flags',
  aliases: ['up'],
  metadata: {
    description: `Updates bot code from git.\nUse ${smallPill('-f')} to force an update.`,
    description_short: 'Update bot code.',
    examples: ['update', 'update -f'],
    category: 'dev',
    usage: 'update [-f]',
  },
  onBefore: context => context.user.isClientOwner,
  onCancel: () => {},
  run: async (context, args) => {
    await editOrReply(context, createEmbed('loading', context, 'Fetching updates...'));

    try {
      const start = Date.now();
      const force = args.flags.includes('-force') || args.flags.includes('-f');

      if (force) await execAsync('git checkout .');

      const { stdout, stderr } = await execAsync('git pull');
      const output = (stdout || '') + (stderr || '');

      if (output.includes('Already up to date.')) {
        return await editOrReply(context, createEmbed('success', context, 'Already up to date.'));
      }

      const match = output.match(/([a-z0-9]{7})\.{2}([a-z0-9]{7})/i);
      const range = match ? `${highlight(match[1])} → ${highlight(match[2])}` : 'updated';
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      const logSnippet = truncateLog(output || 'git pull completed');

      const display = [];
      display.push(`Updated ${range} in ${highlight(elapsed + 's')}. Restarting...`);
      display.push('');
      display.push(codeblock('diff', logSnippet));

      await editOrReply(
        context,
        createEmbed('success', context, {
          title: 'Manual Git Pull',
          description: display.join('\n'),
        })
      );

      // pm2 will restart us
      setTimeout(() => process.exit(0), 1000);
    } catch (e) {
      console.error(e);
      const errorMsg = e.stderr || e.message || 'Unknown error';
      return await editOrReply(
        context,
        createEmbed('error', context, {
          description: `Failed to update.\n${codeblock('', errorMsg.slice(0, 500))}`,
        })
      );
    }
  },
};
