const { moonbase } = require('#api');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { icon, highlight } = require('#utils/markdown');

const { ApplicationCommandOptionTypes } = require('detritus-client/lib/constants');

module.exports = {
  description: 'Moonbase Alpha text to speech voices',
  name: 'moonbase',
  type: ApplicationCommandOptionTypes.SUB_COMMAND,
  options: [
    {
      name: 'text',
      description: 'Text',
      type: ApplicationCommandOptionTypes.STRING,
      required: true,
      maxLength: 1024
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
      let audio = await moonbase(context, args.text, args.voice)

      await context.editOrRespond({
        embeds: [createEmbed("defaultNoFooter", context, { description: `${icon("audio")} Audio Generated in ${highlight(audio.timings + "s")}.` })],
        file: { value: audio.response.body, filename: "moonbase.wav" }
      })

    } catch (e) {
      console.log(e)
      await context.editOrRespond({
        embeds: [createEmbed("error", context, "Unable to generate audio file.")]
      })
    }
  },
};