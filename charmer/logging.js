const { icon } = require('#utils/markdown');
const { USER_AGENT } = require('#utils/user-agent');
const { COLORS } = require('#constants');
const superagent = require('superagent');

const ERROR_WEBHOOK = process.env.ERROR_WEBHOOK;

const formatErrorMessage = (sev = 0, code, content) => {
  return `${icon('webhook_exclaim_' + parseInt(sev))} \`[${Date.now()}]\` @ \`[${process.env.HOSTNAME || 'meteor'}]\` **\` ${code}  \`** | ${content}`;
};

/**
 * This is a list of error messages that will show up at least
 * 50 times a day and cannot be reasonably avoided.
 */
const BLOCKED_LOGS = ['Unknown Message', 'Unknown interaction', 'Message was blocked by AutoMod'];

/**
 * Logs errors to Discord webhook
 * @param {Object} packages - Error packages containing origin, data, and meta
 * @param {string} type - Type of error (e.g., '01' for command error)
 */
module.exports.logError = async function (packages, type = '01') {
  if (!ERROR_WEBHOOK) {
    console.warn('No error webhook configured.');
    return;
  }

  // Check if error should be blocked
  const errorString = JSON.stringify(packages);
  for (const blockedLog of BLOCKED_LOGS) {
    if (errorString.includes(blockedLog)) return;
  }

  try {
    const embed = {
      color: COLORS.error,
      timestamp: new Date().toISOString(),
      fields: [],
    };

    // Add origin information
    if (packages.origin) {
      if (packages.origin.user) {
        embed.fields.push({
          name: `${icon('user')} User`,
          value: `${packages.origin.user.name}\n\`${packages.origin.user.id}\``,
          inline: true,
        });
      }
      if (packages.origin.guild) {
        embed.fields.push({
          name: `${icon('home')} Server`,
          value: `${packages.origin.guild.name}\n\`${packages.origin.guild.id}\``,
          inline: true,
        });
      }
      if (packages.origin.channel) {
        embed.fields.push({
          name: `${icon('channel')} Channel`,
          value: `${packages.origin.channel.name}\n\`${packages.origin.channel.id}\``,
          inline: true,
        });
      }
    }

    // Add command/action information
    if (packages.data && packages.data.command) {
      const commandText =
        packages.data.command.length > 1000 ? packages.data.command.substring(0, 1000) + '...' : packages.data.command;
      embed.fields.push({
        name: `${icon('slash')} Command`,
        value: `\`\`\`\n${commandText}\n\`\`\``,
        inline: false,
      });
    }

    // Add error information
    if (packages.data && packages.data.error) {
      const errorText =
        packages.data.error.length > 1000 ? packages.data.error.substring(0, 1000) + '...' : packages.data.error;
      embed.fields.push({
        name: `${icon('exclaim_3')} Error`,
        value: `\`\`\`js\n${errorText}\n\`\`\``,
        inline: false,
      });
    }

    // Add raw error data if available
    if (packages.data && packages.data.raw) {
      const rawText = packages.data.raw.length > 500 ? packages.data.raw.substring(0, 500) + '...' : packages.data.raw;
      embed.fields.push({
        name: `${icon('note')} Raw Data`,
        value: `\`\`\`json\n${rawText}\n\`\`\``,
        inline: false,
      });
    }

    embed.title = `${icon('warning')} Error Report`;
    embed.footer = {
      text: `${process.env.HOSTNAME || 'meteor'} • type ${type}`,
    };

    await superagent.post(ERROR_WEBHOOK).send({
      embeds: [embed],
    });
  } catch (e) {
    console.error('Failed to log error to webhook:', e.message);
  }
};

/**
 * Logs general messages/warnings to Discord webhook
 * @param {string} message - The formatted message to log
 */
module.exports.logMessage = async function (message) {
  if (!ERROR_WEBHOOK) {
    console.warn('No error webhook configured.');
    return;
  }

  // Check if message should be blocked
  for (const blockedLog of BLOCKED_LOGS) {
    if (message.includes(blockedLog)) return;
  }

  try {
    await superagent.post(ERROR_WEBHOOK).send({
      content: message,
    });
  } catch (e) {
    console.error('Failed to log message to webhook:', e.message);
  }
};

/**
 * Legacy alias for logMessage
 * @param {string} message - The formatted message to log
 * @param {Object} [context] - Optional context (currently unused but kept for backward compatibility)
 */
module.exports.basecamp = async function (message, context) {
  return module.exports.logMessage(message);
};

module.exports.formatErrorMessage = formatErrorMessage;
