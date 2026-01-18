const { MessageFlags, InteractionCallbackTypes } = require('detritus-client/lib/constants');

const { Context } = require('detritus-client/lib/command');
const { InteractionContext } = require('detritus-client/lib/interaction');
const { PERMISSION_GROUPS, INCOGNITO_REASONS } = require('#constants');
const { PERMISSIONS_TEXT } = require('#permissions');
const { checkPermissions } = require('detritus-client/lib/utils/permissions');

/**
 * Acknowledges a command or interaction.
 * @param { InteractionContext|Context } context Command/interaction context
 * @param { boolean } incognito Specifies if the interaction should run privately (only applicable for interactions)
 * @param { Array } permissions Array of permissions that are required to execute this command
 */
module.exports.acknowledge = async function (
  context,
  incognito = false,
  permissions = [...PERMISSION_GROUPS.baseline_slash]
) {
  // Interaction flow
  if (context.editOrRespond) {
    if (!context._meta) context._meta = {};

    // Handle permissions for user commands in a guild context
    if (context.member && permissions.length >= 1) {
      const perr = [];
      for (const p of permissions) {
        if (!checkPermissions(context.member.permissions, p)) {
          incognito = true;
          context._meta.incognitoReason = INCOGNITO_REASONS.permissions;
        }
        perr.push([PERMISSIONS_TEXT[p], checkPermissions(context.member.permissions, p)]);
      }
      if (perr.length >= 1) {
        // via pbdiag (https://canary.discord.com/channels/949405492491452496/949414053418242118/1326684780355653815)
        context._meta.incognitoMetadata =
          'https://bignutty.gitlab.io/diag?pbdiag=' +
          Buffer.from(JSON.stringify([1, [perr.map(p => p[0]), perr.map(p => p[1])]])).toString('base64');
      }
    }

    if (incognito) {
      context._meta.isIncognito = true;
      return await context.respond({
        data: { flags: MessageFlags.EPHEMERAL },
        type: InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      });
    }
    return await context.respond({ data: {}, type: InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
  }

  // Command Flow

  /**
   * This endpoint will sometimes error when
   * - Discord breaks their platform again
   * - Discord disables it via cloudflare to reduce
   *   platform load.
   *
   * In order to avoid our bot from crashing, we catch the
   * error here.
   */
  return await context.triggerTyping().catch(e => {});
};
