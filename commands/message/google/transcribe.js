const { PERMISSION_GROUPS } = require('#constants');
const { AudioTranscribe } = require('#obelisk');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { codeblock, icon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message')
const { STATICS } = require('#utils/statics');

module.exports = {
  name: 'transcribe',
  aliases: ['tcr'],
  metadata: {
    description: `${icon("reply")} __Replying__ to a voice message when using this command will transcribe the contents of the voice message.`,
    description_short: 'Discord voice message transcription',
    category: 'utils',
    usage: 'transcribe',
    slashCommand: "Transcribe Voice Message"
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context) => {
    await acknowledge(context);
    
    if (!context.message.messageReference) return editOrReply(context, createEmbed("warning", context, "You need to reply to a voice message."))
    try {
      let msg;
      try {
        msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId)
      } catch (e) {
        return editOrReply(context, createEmbed("error", context, "Unable to fetch message."))
      }

      if(!msg.attachments.first()) return editOrReply(context, createEmbed("warning", context, "No voice message found."))
      if(!msg.attachments.first().url.split('?')[0].endsWith('voice-message.ogg')) return editOrReply(context, createEmbed("warning", context, "No voice message found."))
      
      const recog = await AudioTranscribe(context, msg.attachments.first().url)

      return editOrReply(context, createEmbed("default", context, {
        description: codeblock("md", [ recog.response.body.transcript ]),
        footer: {
          iconUrl: STATICS.google,
          text: `Google Speech to Text • ${context.application.name}`
        }
      }))
      
    } catch (e) {
      console.log(e)
      if(e.response?.body?.error) return editOrReply(context, createEmbed("warning", context, e.response.body.error.message))
      return editOrReply(context, createEmbed("error", context, `Unable to transcribe audio (too long?).`))
    }
  },
};