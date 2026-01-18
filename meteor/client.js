const { ShardClient, CommandClient, InteractionCommandClient } = require('detritus-client');
const {
  ActivityTypes,
  PresenceStatuses,
  GatewayIntents,
  Permissions,
  ClientEvents,
} = require('detritus-client/lib/constants');

const { DEFAULT_BOT_NAME, DEFAULT_PREFIXES } = require('#constants');
const { PERMISSIONS_TEXT } = require('#permissions');

const Paginator = require('./paginator').Paginator;

const token = process.env.token;

const client = new ShardClient(token, {
  cache: { messages: { expire: 30 * 60 * 1000 } },
  gateway: {
    identifyProperties: {
      $browser: 'Discord Android',
    },
    intents: [
      GatewayIntents.GUILDS,
      GatewayIntents.GUILD_MESSAGES,
      GatewayIntents.GUILD_EMOJIS,
      GatewayIntents.MESSAGE_CONTENT,
    ],
    presence: {
      activity: {
        state: `${DEFAULT_PREFIXES[0]}help ​ • ​ ${DEFAULT_BOT_NAME}`,
        name: `${DEFAULT_PREFIXES[0]}help ​ ​• ​ ${DEFAULT_BOT_NAME}`,
        emoji: {
          name: '🧪',
        },
        type: ActivityTypes.CUSTOM_STATUS,
      },
      status: PresenceStatuses.ONLINE,
    },
  },
});

// Create paginator
module.exports.paginator = new Paginator(client, {
  maxTime: 300000,
  pageLoop: true,
  pageNumber: true,
});

// Clients

commandPrefixes = DEFAULT_PREFIXES;
if (process.env.PREFIX_OVERRIDE) commandPrefixes = process.env.PREFIX_OVERRIDE.split('|');

const commandClient = new CommandClient(client, {
  activateOnEdits: true,
  mentionsEnabled: true,
  prefix: commandPrefixes[0],
  prefixes: commandPrefixes,
  ratelimits: [
    { duration: 60000, limit: 50, type: 'guild' },
    { duration: 5000, limit: 5, type: 'channel' },
  ],
  onCommandCheck: async (context, command) => {
    /*
      I don't know why, I don't know since when - but timeouts apply to bots now.
      This code checks if the bot is currently timed out, preventing any and all
      commands from being executed.
    */

    // Only apply filters below to a GUILD context.
    if (!context.guild) return true;

    let b = context.guild.members.get(context.client.user.id);
    // Bot member is not cached for whatever reason, fetch it.
    if (b === undefined) b = await context.guild.fetchMember(context.client.user.id);

    // Bot is (potentially) timed out.
    if (b.communicationDisabledUntil !== null) {
      // Timeout is active. This additional check is necessary,
      // as our cache does not appear to update when the bots
      // timeout expires.
      if (b.communicationDisabledUntilUnix - Date.now() >= 1) return false;
    }

    // Command should be fine to run.
    return true;
  },
});

const interactionClient = new InteractionCommandClient(client);

const { logError, logMessage, formatErrorMessage } = require('#logging');

const { createEmbed } = require('#utils/embed');
const { icon, highlight } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

// Handle missing permission errors
commandClient.on('commandPermissionsFailClient', ({ context, permissions }) => {
  if (!context.channel.can(Permissions.SEND_MESSAGES)) return;
  const perms = [];
  for (const permission of permissions) {
    if (permission in PERMISSIONS_TEXT) {
      perms.push(highlight(` ${PERMISSIONS_TEXT[permission]} `));
    } else {
      perms.push(highlight(` (Unknown: ${permission}) `));
    }
  }

  // Send a nicer looking embed if the bot has permission to do so
  if (context.channel.can(Permissions.EMBED_LINKS))
    return editOrReply(
      context,
      createEmbed('errordetail', context, {
        error: 'Missing Permissions',
        content: `${context.client.user.username} needs the following permissions in <#${context.channel.id}>:\n${perms.join(' ')}`,
      })
    );
  return editOrReply(context, {
    content: `${context.client.user.username} needs the following permissions in <#${context.channel.id}> to execute this command: ${perms.join(', ')}`,
  });
});

// Delete command responses if the user chooses to delete their trigger or edits the command away
commandClient.on('commandDelete', async ({ context, reply }) => {
  if (context.message?.deleted) return reply.delete();

  let hasPrefix = false;
  for (const p of [...(commandPrefixes || []), context.client.user.mention])
    if (context.message.content.toLowerCase().startsWith(p)) hasPrefix = true;

  // TODO: there has to be a better way to do this, see if the command
  //  client exposes a parser or whatever
  if (hasPrefix) {
    // Extract command
    let command = context.message.content.toLowerCase();
    for (const p of [...(commandPrefixes || []), context.client.user.mention])
      if (command.startsWith(p)) command = command.replace(p, '');
    while (command.startsWith(' ') && command.length) command = command.substring(1, command.length);
    if (
      !context.client.commandClient.commands
        .map(c => [c.name, ...c.aliases])
        .flat()
        .includes(command.split(' ')[0])
    )
      hasPrefix = false;
  }

  if (!reply.deleted && !hasPrefix) reply.delete();
});

commandClient.on('commandRunError', async ({ context, error }) => {
  try {
    console.error(error ? error.stack || error.message : error);

    // Prepare error packages for logging
    const packages = {
      data: {},
      origin: {},
      meta: {},
    };

    if (context.user) {
      packages.origin.user = {
        name: `${context.user.username}#${context.user.discriminator}`,
        id: context.user.id,
      };
    }
    if (context.guild) {
      packages.origin.guild = {
        name: context.guild.name,
        id: context.guild.id,
      };
    }
    if (context.channel) {
      packages.origin.channel = {
        name: context.channel.name,
        id: context.channel.id,
      };
    }

    packages.data.command = context.message.content;
    packages.data.error = error ? error.stack || error.message : error;
    if (error.raw) packages.data.raw = JSON.stringify(error.raw, null, 2);

    // Log to Discord webhook (non-blocking)
    logError(packages, '01').catch(err => console.error('Failed to log error:', err));

    await editOrReply(context, {
      content: `${icon('cross')} Something went wrong while attempting to run this command.`,
    });
  } catch {
    await editOrReply(context, {
      content: `${icon('cross')} Something went wrong while attempting to run this command.`,
    });
  }
});

interactionClient.on('commandRunError', async ({ context, error }) => {
  try {
    console.error(error ? error.stack || error.message : error);

    // Prepare error packages for logging
    const packages = {
      data: {},
      origin: {},
      meta: {},
    };

    if (context.user) {
      packages.origin.user = {
        name: `${context.user.username}#${context.user.discriminator}`,
        id: context.user.id,
      };
    }
    if (context.guild) {
      packages.origin.guild = {
        name: context.guild.name,
        id: context.guild.id,
      };
    }
    if (context.channel) {
      packages.origin.channel = {
        name: context.channel.name,
        id: context.channel.id,
      };
    }

    packages.data.command = context.command.name;
    packages.data.error = error ? error.stack || error.message : error;
    if (error.raw) packages.data.raw = JSON.stringify(error.raw, null, 2);

    // Log to Discord webhook (non-blocking)
    logError(packages, '01').catch(err => console.error('Failed to log error:', err));

    await editOrReply(context, {
      content: `${icon('cross')} Something went wrong while attempting to run this command.`,
    });
  } catch (e) {
    console.log(e);
    await editOrReply(context, {
      content: `${icon('cross')} Something went wrong while attempting to run this command.`,
    });
  }
});

(async () => {
  client.on(ClientEvents.REST_RESPONSE, async ({ response, restRequest }) => {
    const route = response.request.route;
    if (route) {
      if (!response.ok) {
        const message = `(NOT OK) ${response.statusCode} ${response.request.method}-${response.request.url} (${route.path})`;
        console.log(message);
        const responseText = await response.text();
        console.log(responseText);

        // Log to Discord webhook (non-blocking)
        logMessage(
          formatErrorMessage(
            3,
            'REST_ERROR',
            `REST request error: \`${response.statusCode}\`\n**\` ${response.request.method}  \`** \`${response.request.url}\` (${route.path})\n\`\`\`js\n${responseText.substring(0, 500)}\`\`\``
          )
        ).catch(err => console.error('Failed to log REST error:', err));
      }
    }
  });

  client.on(ClientEvents.WARN, async ({ error }) => {
    console.warn(error);

    // Log to Discord webhook (non-blocking)
    logMessage(formatErrorMessage(2, 'CLIENT_WARNING', `Client reported warning:\n\`\`\`${error}\`\`\``)).catch(err =>
      console.error('Failed to log warning:', err)
    );
  });

  try {
    const startTimings = Date.now();
    await client.run();
    console.log(`[meteor] client connected (${Date.now() - startTimings}ms)`);

    {
      await commandClient.addMultipleIn('./commands/message/');
      await commandClient.run();
      console.log(`[meteor] command client ready (${Date.now() - startTimings}ms)`);
    }
    {
      await interactionClient.addMultipleIn('./commands/interaction/context');
      await interactionClient.addMultipleIn('./commands/interaction/user');
      await interactionClient.addMultipleIn('./commands/interaction/slash');
      await interactionClient.run();
      console.log(`[meteor] interaction command client ready (${Date.now() - startTimings}ms)`);
    }
  } catch (e) {
    console.log(e);
    console.log(e.errors);
  }
})();
