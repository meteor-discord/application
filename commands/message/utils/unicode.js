const { emojipedia, emojiKitchen, unicodeMetadata} = require("#api");
const { EMOJIPEDIA_PLATFORM_TYPES, EMOJIPEDIA_PLATFORM_TYPE_ALIASES, PERMISSION_GROUPS, EMOJIPEDIA_PLATFORM_PRIORITY} = require("#constants");
const { ingest } = require("#logging");

const { createEmbed, formatPaginationEmbeds, page} = require("#utils/embed");
const { pill, iconPill, highlight, timestamp, smallIconPill, icon, smallPill} = require("#utils/markdown");
const { editOrReply } = require("#utils/message");
const { STATICS, STATIC_ASSETS } = require("#utils/statics");

const { Utils } = require("detritus-client");
const { Components, Snowflake } = require("detritus-client/lib/utils");
const { InteractionCallbackTypes, DiscordRegexNames } = require("detritus-client/lib/constants");
const { acknowledge } = require("#utils/interactions");
const { paginator } = require("#client");
const {createDynamicCardStack} = require("#cardstack/index");

module.exports = {
  label: "input",
  name: "unicode",
  aliases: ['chars'],
  metadata: {
    description: `${smallIconPill("reply", "Supports Replies")}\n\nLists every unicode character in a string or message.`,
    description_short: 'View unicode codepoints and names.',
    examples: ['unicode 😀', 'chars Hello World 🐱🍞'],
    category: 'utils',
    usage: 'unicode <string>',
    slashCommand: "unicode"
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);
    
    let msg = context.message;
    if (context.message.messageReference) {
      msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId)
      args.input = msg.content
    }

    if(!args.input.length) return editOrReply(context, createEmbed("warning", context, "No input provided."))

    try{
      let meta = await unicodeMetadata(context, args.input)

      let chars = meta.response.body;
      let pages = [];

      console.log(meta.response.body)
      while(chars.length){
        let cset = chars.splice(0,20);

        let padLen = 0;
        cset.map((c)=>{
          if(padLen < c.name.length) padLen = c.name.length;
        })
        pages.push(page(createEmbed("default", context, {
          description: cset.map((c)=>`${pill(c.name.padEnd(padLen, " "))} ${smallPill(c.codepoint)}`).join("\n")
        })))
      }

      return createDynamicCardStack(context, {
        cards: pages,
      });
    }catch(e){
      return editOrReply(context, createEmbed("error", context, e?.response?.body?.message || "Something went wrong."))
    }

  }
};