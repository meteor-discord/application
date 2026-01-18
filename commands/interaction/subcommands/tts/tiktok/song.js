const { tiktok } = require('#api');
const { TIKTOK_VOICES_SONG } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { icon, highlight } = require('#utils/markdown');

const { ApplicationCommandOptionTypes } = require('detritus-client/lib/constants');

let voices = []
for(const k of Object.keys(TIKTOK_VOICES_SONG)) voices.unshift({
  value: k,
  name: TIKTOK_VOICES_SONG[k]
})

module.exports = {
  description: 'Voices that sing songs.',
  name: 'song',
  type: ApplicationCommandOptionTypes.SUB_COMMAND,
  options: [
    {
      name: 'text',
      description: 'Text',
      type: ApplicationCommandOptionTypes.STRING,
      required: true
    },
    {
      name: 'voice',
      description: 'Voice to use',
      choices: voices,
      required: true,
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
    try {
      if(args.text.length >= 101) return await context.editOrRespond({
        embeds: [createEmbed("warning", context, "Text too long (must be 100 or shorter).")]
      })

      let audio = await tiktok(context, args.text, args.voice)

      await context.editOrRespond({
        embeds: [createEmbed("defaultNoFooter", context, { description: `${icon("audio")} Audio Generated in ${highlight(audio.timings + "s")}.` })],
        file: { value: audio.response.body, filename: "tiktok.mp3" }
      })

    } catch (e) {
      console.log(e)
      await context.editOrRespond({
        embeds: [createEmbed("error", context, "Unable to generate audio file.")]
      })
    }
  },
};