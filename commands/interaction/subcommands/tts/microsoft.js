const { sapi4 } = require('#api');
const { MICROSOFT_VOICES, MICROSOFT_VOICE_CONFIG } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { icon, highlight } = require('#utils/markdown');

const { ApplicationCommandOptionTypes } = require('detritus-client/lib/constants');

module.exports = {
  description: 'Text to Speech with microsoft voices',
  name: 'microsoft',
  type: ApplicationCommandOptionTypes.SUB_COMMAND,
  options: [
    {
      name: 'voice',
      description: 'TTS Voice to use',
      choices: MICROSOFT_VOICES,
      required: true,
    },
    {
      name: 'text',
      description: 'Text',
      type: ApplicationCommandOptionTypes.STRING,
      required: true,
      maxLength: 256
    },
    {
      name: 'incognito',
      description: 'Makes the response only visible to you.',
      type: ApplicationCommandOptionTypes.BOOLEAN,
      required: false,
      default: false
    }
  ],
  run: async (context, args) => {
    await acknowledge(context, args.incognito);
    try{
      let audio = await sapi4(context, args.text, args.voice, MICROSOFT_VOICE_CONFIG[args.voice].pitch, MICROSOFT_VOICE_CONFIG[args.voice].speed)
      await context.editOrRespond({
        embeds: [createEmbed("defaultNoFooter", context, { description: `${icon("audio")} Audio Generated in ${highlight(audio.timings + "s")}.` })],
        file: { value: audio.response.body, filename: "tts.wav" }
      })
    }catch(e){
      await context.editOrRespond({
        embeds: [createEmbed("error", context, "Unable to generate audio file.")]
      })
    }
  },
};