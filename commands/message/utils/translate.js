const { googleTranslate } = require('#api');
const { TRANSLATE_LANGUAGES, TRANSLATE_DISPLAY_MAPPINGS, PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { codeblock, icon, pill, stringwrap, smallIconPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');
const { isSupported, getCodeFromAny, translateMessage } = require('#utils/translate');

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
          description: `-# ${icon('locale')} ${fromFlag} ${pill(TRANSLATE_LANGUAGES[translate.response.body.language.from || sourceLanguage] || translate.response.body.language.from || 'Detected Language')} ${icon('arrow_right')} ${toFlag} ${pill(TRANSLATE_LANGUAGES[translate.response.body.language.to] || translate.response.body.language.to)}\n${codeblock('ansi', [stringwrap(translate.response.body.translation, 1900)])}`,
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
