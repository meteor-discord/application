const { AudioTranscribe } = require('#obelisk');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');
const { codeblock } = require('#utils/markdown');
const { STATICS } = require('#utils/statics');

const { ApplicationCommandTypes, MessageFlags, InteractionContextTypes, ApplicationIntegrationTypes } = require("detritus-client/lib/constants");
const { PERMISSION_GROUPS } = require('#constants');
;

module.exports = {
  name: 'Transcribe Voice Message',
  type: ApplicationCommandTypes.MESSAGE,
  contexts: [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.PRIVATE_CHANNEL,
    InteractionContextTypes.BOT_DM
  ],
  integrationTypes: [
    ApplicationIntegrationTypes.USER_INSTALL
  ],
  run: async (context, args) => {
    await acknowledge(context, false, [...PERMISSION_GROUPS.baseline_slash]);

    try {
      const { message } = args;

      if (!message.attachments.first()) return editOrReply(context, {
        embeds: [createEmbed("warning", context, "No voice message found.")],
        flags: MessageFlags.EPHEMERAL
      })
      if (!message.attachments.first().url.split('?')[0].endsWith('voice-message.ogg')) return editOrReply(context, {
        embeds: [createEmbed("warning", context, "No voice message found.")],
        flags: MessageFlags.EPHEMERAL
      })

      const recog = await AudioTranscribe(context, message.attachments.first().url)

      return editOrReply(context, {
        embeds: [createEmbed("default", context, {
          description: codeblock("md", [recog.response.body.transcript.substr(0, 3900)]),
          footer: {
            iconUrl: STATICS.google,
            text: `Google Speech to Text • ${context.application.name}`
          }
        })],
        flags: MessageFlags.EPHEMERAL
      })

    } catch (e) {
      return editOrReply(context, {
        embeds: [createEmbed("error", context, "Unable to transcribe message.")],
        flags: MessageFlags.EPHEMERAL
      })
    }
  },
};