const { OPEN_SOURCE_REPOSITORY_URL, PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { formatNumber } = require('#utils/formatters');
const { acknowledge } = require('#utils/interactions');
const { highlight, iconPill, iconLinkPill, timestamp } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

module.exports = {
  name: 'stats',
  aliases: ['usage', 'uptime', 'status'],
  metadata: {
    description: 'Shows statistics about the bot.',
    description_short: 'Bot statistics',
    category: 'core',
    usage: 'stats',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async context => {
    await acknowledge(context);

    try {
      const memoryUsage = process.memoryUsage();
      const usage = memoryUsage.heapTotal + memoryUsage.external + memoryUsage.arrayBuffers;
      const guilds = context.client.guilds.length;

      const display = [`${iconPill('home', 'Servers      ')} ${highlight(` ${formatNumber(guilds, 1)} `)}`];
      display.push(
        `${iconPill('user', 'Installations')} ${highlight(` ${formatNumber(context.client.application.approximateUserInstallCount, 1)} `)}`
      );
      display.push(`${iconPill('latency', 'Memory Usage ')} ${highlight(` ${Math.round(usage / 1024 / 1024)}MB `)}`);
      display.push(`${iconPill('clock', 'Last Restart ')} ${timestamp(Date.now() - process.uptime() * 1000, 'R')}`);
      display.push(``);
      display.push(
        `${iconLinkPill('gitlab', OPEN_SOURCE_REPOSITORY_URL, 'Source Code')} ${iconLinkPill('link', context.application.oauth2UrlFormat({ scope: 'bot applications.commands', permissions: 412317248576 }), `Invite ${context.client.user.username}`).replace('ptb.discordapp.com', 'discord.com')}`
      );

      return editOrReply(
        context,
        createEmbed('default', context, {
          description: display.join('\n'),
        })
      );
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, 'Unable to fetch bot statistics.'));
    }
  },
};
