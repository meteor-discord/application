const { createEmbed } = require('#utils/embed');
const { codeblock, smallPill, highlight } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

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

      await editOrReply(
        context,
        createEmbed('success', context, {
          title: 'Manual Git Pull',
          description: `Updated ${range} in ${highlight(elapsed + 's')}. Restarting...\n\n${codeblock('diff', [output.slice(0, 1800)])}`,
        })
      );

      // Wait for message to be sent, then exit so pm2 can restart us
      await new Promise(resolve => setTimeout(resolve, 2000));
      process.exit(0);
    } catch (e) {
      console.error(e);
      return await editOrReply(context, createEmbed('error', context, 'Failed to update.'));
    }
  },
};
