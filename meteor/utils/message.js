const { Permissions, MessageFlags } = require('detritus-client/lib/constants');
const { basecamp, formatErrorMessage } = require('../logging');
const { MESSAGE_BLOCK_REASONS } = require('#constants');
const { applyIncognitoNotice } = require('./incognito');

module.exports.editOrReply = function (context, message, disableReference = false) {
  // Apply message_reference
  if (
    !message.content &&
    !message.embed &&
    !message.embeds &&
    !message.components &&
    !message.files &&
    typeof message === 'object'
  )
    message = { embeds: [message] };
  else if (typeof message === 'string') message = { content: message };
  if (!message.message_reference && !disableReference) message.reference = true;
  // Disable mentions
  if (!message.allowedMentions) message.allowedMentions = { parse: [], repliedUser: false };

  let flags = 0;

  // Special Meteor context clues for the command.
  // Currently only used to identify incognito requests
  // on user slash commands.
  if (context._meta) {
    if (context._meta.isIncognito) flags = MessageFlags.EPHEMERAL;
  }

  message.flags = flags;

  // Handle responses for interaction context
  if (context.editOrRespond) {
    if (context._meta?.replacementMessageId) {
      return context.editMessage(context._meta.replacementMessageId, message).catch(e => {
        basecamp(
          formatErrorMessage(
            3,
            'MESSAGE_ERROR',
            `Command \`${context.command.name}\` failed to respond:\nGuild: \`${context.guild?.id}\`\nChannel: \`${context.channel?.id}\`\nUser: \`${context.user?.id}\`\`\`\`js\n${e}\`\`\``
          ),
          message
        );
      });
    }

    if (context._meta?.incognitoReason) {
      applyIncognitoNotice(message, context._meta.incognitoReason, context._meta.incognitoMetadata);
    }

    return context.editOrRespond(message).catch(async e => {
      try {
        const errorData = await e.response.json();
        if (MESSAGE_BLOCK_REASONS[errorData.code]) {
          // Delete the public response
          await context.deleteResponse();

          message.flags = MessageFlags.EPHEMERAL;

          applyIncognitoNotice(message, errorData.code);

          const replacementMessage = await context.createMessage(message);

          if (!context._meta) context._meta = {};
          context._meta.replacementMessageId = replacementMessage.id;

          return replacementMessage;
        }
      } catch (e) {
        console.log(e);
      }
      basecamp(
        formatErrorMessage(
          3,
          'MESSAGE_ERROR',
          `Command \`${context.command?.name || context.message?.content || 'Unknown Command (check console)'}\` failed to respond: @ \`${Date.now()}\`\nGuild: \`${context.guild?.id}\`\nChannel: \`${context.channel?.id}\`\nUser: \`${context.user?.id}\`\`\`\`js\n${e}\`\`\``
        ),
        message
      );
      if (!context.command?.name && !context.message?.content) console.log(context);
    });
  }

  // Only respond if the command is still available and we have permissions to respond.
  if (!context.message.deleted && context.channel.can(Permissions.SEND_MESSAGES))
    return context.editOrReply(message).catch(e => {
      console.log(e.status);
      basecamp(
        formatErrorMessage(
          3,
          'MESSAGE_ERROR',
          `Command \`${context.message?.content}\` failed to respond:\nGuild: \`${context.guild?.id}\`\nChannel: \`${context.channel?.id}\`\nUser: \`${context.user?.id}\`\`\`\`js\n${e}\`\`\``
        ),
        message
      );
    });
};
