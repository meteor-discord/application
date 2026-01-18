const { googleTranslate, googleTranslateMulti } = require('#api');
const { TRANSLATE_LANGUAGES, TRANSLATE_DISPLAY_MAPPINGS, PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { codeblock, icon, pill, stringwrap, smallIconPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');
const { isSupported, getCodeFromAny } = require('#utils/translate');

const { MessageEmbedTypes } = require('detritus-client/lib/constants');

// TODO(unity): interaction/context/translate.js
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

        if (emb.author) newEmbed.author = { ...emb.author };
        if (emb.author?.name) newEmbed.author.name = stringwrap(tr['embeds/' + i + '/author/name'], 256);

        if (emb.footer) newEmbed.footer = { ...emb.footer };
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
        result.embeds[i] = { ...newEmbed };
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
  name: 'translate',
  label: 'text',
  aliases: ['tr'],
  metadata: {
    description: `${smallIconPill('reply', 'Supports Replies')}\n\nTranslates text. Supports automatic source language detection.`,
    description_short: 'Translate text.',
    examples: ['tr groß nussig -from de -to en'],
    category: 'utils',
    usage: `tr <text> [-to <target language>] [-from <origin language>]`,
    slashCommand: 'translate',
  },
  args: [
    { name: 'to', default: 'en', type: 'language', help: 'Target Language' },
    { name: 'from', default: 'auto', type: 'language', help: 'Source Language' },
  ],
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    const content = args.text;

    if (!isSupported(args.to))
      return editOrReply(
        context,
        createEmbed('warning', context, `Invalid target language (${stringwrap(args.to, 10, false)}).`)
      );
    if (!isSupported(args.from))
      return editOrReply(
        context,
        createEmbed('warning', context, `Invalid source language (${stringwrap(args.from, 10, false)}).`)
      );

    const targetLanguage = getCodeFromAny(args.to);
    const sourceLanguage = getCodeFromAny(args.from);

    // Invoke Message Translation
    if (context.message.messageReference) {
      try {
        // Quick language shortcut - lc.tr de
        if (args.text.length >= 1 && getCodeFromAny(args.text) !== undefined) args.to = args.text;

        if (!isSupported(args.to))
          return editOrReply(
            context,
            createEmbed('warning', context, `Invalid target language (${stringwrap(args.to, 10, false)}).`)
          );

        const targetLanguage = getCodeFromAny(args.to);

        const message = await context.message.channel.fetchMessage(context.message.messageReference.messageId);

        const translate = await translateMessage(context, message, targetLanguage, sourceLanguage);

        if (!translate.message)
          return editOrReply(context, createEmbed('warning', context, 'No translatable content found.'));

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
          })
        );
      } catch (e) {
        console.log(e);
        return editOrReply(context, createEmbed('error', context, 'Unable to translate message.'));
      }
    }

    if (!content.length) return editOrReply(context, createEmbed('warning', context, 'No text supplied.'));

    if (!targetLanguage)
      return editOrReply(
        context,
        createEmbed('warning', context, `Invalid target language (${stringwrap(args.to, 10, false)}).`)
      );
    if (!sourceLanguage)
      return editOrReply(
        context,
        createEmbed('warning', context, `Invalid source language (${stringwrap(args.from, 10, false)}).`)
      );

    try {
      const translate = await googleTranslate(context, content, targetLanguage, sourceLanguage);

      const fromFlag = TRANSLATE_DISPLAY_MAPPINGS[translate.response.body.language.from || sourceLanguage] || '';
      const toFlag = TRANSLATE_DISPLAY_MAPPINGS[translate.response.body.language.to] || '';

      return editOrReply(
        context,
        createEmbed('default', context, {
          description: `-# ${icon('locale')} ​ ${fromFlag} ${pill(TRANSLATE_LANGUAGES[translate.response.body.language.from || sourceLanguage] || translate.response.body.language.from || 'Detected Language')} ​ ​ ​​${icon('arrow_right')} ​ ​ ​ ​${toFlag} ${pill(TRANSLATE_LANGUAGES[translate.response.body.language.to] || translate.response.body.language.to)}\n${codeblock('ansi', [stringwrap(translate.response.body.translation, 1900)])}`,
          footer: {
            iconUrl: STATICS.googletranslate,
            text: `Google Translate • ${context.application.name}`,
          },
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
