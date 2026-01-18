const { googleTranslateMulti } = require('#api');
const {
  TRANSLATE_DISPLAY_MAPPINGS,
  TRANSLATE_LANGUAGES,
  TRANSLATE_LANGUAGE_MAPPINGS,
  TRANSLATE_DEFAULT_LANGUAGE_LIST,
  PERMISSION_GROUPS,
} = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { icon, stringwrap } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

const {
  ApplicationCommandTypes,
  InteractionCallbackTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
  MessageEmbedTypes,
} = require('detritus-client/lib/constants');
const { Components } = require('detritus-client/lib/utils');

// TODO(unity): utils/translate.js
async function translateMessage(context, message, to, from) {
  const mappings = {};

  if (message.content) {
    // Special Case - this is (very very very likely) a 1p translated message
    if (message.content.startsWith(`-# ${icon('subtext_translate')}`)) {
      const cnt = message.content.split('\n');
      cnt.shift();
      if (cnt.length >= 1) {
        mappings.content = cnt.join('\n');
      }
    } else mappings.content = message.content;
  }
  if (message.embeds) {
    let i = 0;
    // Message Translation supports Descriptions and Fields
    for (const e of message.embeds) {
      const emb = e[1];

      if (![MessageEmbedTypes.ARTICLE, MessageEmbedTypes.RICH, MessageEmbedTypes.LINK].includes(emb.type)) continue;
      if (emb.description) mappings['embeds/' + i + '/description'] = emb.description;
      if (emb.title) mappings['embeds/' + i + '/title'] = emb.title;
      if (emb.author?.name) mappings['embeds/' + i + '/author/name'] = emb.author.name;
      if (emb.footer?.text) mappings['embeds/' + i + '/footer/text'] = emb.footer.text;

      if (emb.fields) {
        let fi = 0;
        for (const f of emb.fields) {
          mappings['embeds/' + i + '/fields/' + fi + '/name'] = f[1].name;
          mappings['embeds/' + i + '/fields/' + fi + '/value'] = f[1].value;
          fi++;
        }
      }
      i++;
    }
  }

  // Cancel if we don't have anything that can be translated
  if (Object.keys(mappings).length === 0) return {};

  // Translate message via multitranslate endpoint on 1p
  try {
    const translation = await googleTranslateMulti(context, mappings, to, from);

    const tr = translation.response.body.translations;

    // Deserialize message
    const result = {};

    // This relies on mappings.content to handle the special case
    if (mappings.content) result.content = tr.content;

    if (message.embeds) {
      let i = 0;
      result.embeds = [];
      // Message Translation supports Descriptions and Fields
      for (const e of message.embeds) {
        const emb = e[1];

        if (![MessageEmbedTypes.ARTICLE, MessageEmbedTypes.RICH, MessageEmbedTypes.LINK].includes(emb.type)) continue;
        const newEmbed = {
          fields: [],
        };

        // Elements we don't translate
        if (emb.color) newEmbed.color = emb.color;
        if (emb.url) newEmbed.url = emb.url;

        if (emb.thumbnail) {
          // Special Case, articles render differently
          if (emb.type === MessageEmbedTypes.ARTICLE) newEmbed.image = emb.thumbnail;
          else newEmbed.thumbnail = emb.thumbnail;
        }
        if (emb.image) newEmbed.image = emb.image;

        if (emb.title) newEmbed.title = stringwrap(tr['embeds/' + i + '/title'], 256);

        if (emb.description) newEmbed.description = stringwrap(tr['embeds/' + i + '/description'], 4096);

        if (emb.author) newEmbed.author = { ...emb.author};
        if (emb.author?.name) newEmbed.author.name = stringwrap(tr['embeds/' + i + '/author/name'], 256);

        if (emb.footer) newEmbed.footer = { ...emb.footer};
        if (emb.footer?.text) newEmbed.footer.text = stringwrap(tr['embeds/' + i + '/footer/text'], 2048);

        if (emb.fields) {
          let fi = 0;
          for (const f of emb.fields) {
            newEmbed.fields[fi] = {
              inline: f[1].inline,
            };

            newEmbed.fields[fi].name = stringwrap(tr['embeds/' + i + '/fields/' + fi + '/name'], 256);
            newEmbed.fields[fi].value = stringwrap(tr['embeds/' + i + '/fields/' + fi + '/value'], 1024);
            fi++;
          }
        }
        result.embeds[i] = { ...newEmbed};
        i++;
      }
    }

    return {
      message: result,
      metadata: translation.response.body,
    };
  } catch (e) {
    console.log(e);
    console.log(mappings);
    throw 'Translation Failed.';
  }
}

module.exports = {
  name: 'Translate Message',
  type: ApplicationCommandTypes.MESSAGE,
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  run: async (context, args) => {
    await acknowledge(context, false, [...PERMISSION_GROUPS.baseline_slash]);

    const { message } = args;

    if (!message.content && !message.embeds)
      return editOrReply(context, createEmbed('warning', context, 'No content found.'));

    try {
      const translate = await translateMessage(context, message, 'en', 'auto');

      if (!translate.message)
        return editOrReply(context, createEmbed('warning', context, 'No translatable content found.'));

      const components = new Components({
        timeout: 100000,
        run: async ctx => {
          try {
            if (ctx.userId !== context.userId)
              return await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

            const translate = await translateMessage(context, message, ctx.data.values[0], 'auto');

            for (let i = 0; i < components.components[0].components[0].options.length; i++) {
              components.components[0].components[0].options[i].default =
                components.components[0].components[0].options[i].value === ctx.data.values[0];
            }

            const fromFlag = TRANSLATE_DISPLAY_MAPPINGS[translate.metadata.language.from || sourceLanguage] || '';
            const toFlag = TRANSLATE_DISPLAY_MAPPINGS[translate.metadata.language.to] || '';

            const newMessage = translate.message;
            let newMessageContent = '';
            if (newMessage.content) newMessageContent += '\n' + newMessage.content;

            return await ctx.editOrRespond({
              content: stringwrap(
                `-# ${icon('subtext_translate')} Translated from  ${fromFlag} **${TRANSLATE_LANGUAGES[translate.metadata.language.from || sourceLanguage] || translate.metadata.language.from || args.from}** to  ${toFlag} **${TRANSLATE_LANGUAGES[translate.metadata.language.to] || translate.metadata.language.to}**  •  Google Translate${newMessageContent}`,
                2000
              ),
              embeds: newMessage.embeds,
              components,
            });
          } catch (e) {
            console.log(e);
          }
        },
      });

      const selectLanguageOptions = TRANSLATE_DEFAULT_LANGUAGE_LIST.map((r, i) => {
        return {
          label: TRANSLATE_LANGUAGES[r],
          value: r,
          emoji: TRANSLATE_LANGUAGE_MAPPINGS[r] || undefined,
          default: !i,
        };
      });

      components.addSelectMenu({
        defaultValues: [],
        placeholder: 'Change target language',
        customId: 'target-language',
        options: selectLanguageOptions,
      });

      const fromFlag = TRANSLATE_DISPLAY_MAPPINGS[translate.metadata.language.from || sourceLanguage] || '';
      const toFlag = TRANSLATE_DISPLAY_MAPPINGS[translate.metadata.language.to] || '';

      const newMessage = translate.message;
      let newMessageContent = '';
      if (newMessage.content) newMessageContent += '\n' + newMessage.content;

      return editOrReply(
        context,
        createEmbed('default', context, {
          content: stringwrap(
            `-# ${icon('subtext_translate')} Translated from  ${fromFlag} **${TRANSLATE_LANGUAGES[translate.metadata.language.from || sourceLanguage] || translate.metadata.language.from || args.from}** to  ${toFlag} **${TRANSLATE_LANGUAGES[translate.metadata.language.to] || translate.metadata.language.to}**  •  Google Translate${newMessageContent}`,
            2000
          ),
          embeds: newMessage.embeds,
          components,
        })
      );
    } catch (e) {
      if (e.response?.body?.status && e.response.body.status === 2)
        return editOrReply(context, createEmbed('error', context, `Unable to translate text.`));
      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Something went wrong.`));
    }
  },
};
