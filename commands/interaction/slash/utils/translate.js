const { googleTranslate } = require('#api');
const { TRANSLATE_LANGUAGES, TRANSLATE_DISPLAY_MAPPINGS, PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { codeblock, icon, pill, stringwrap } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');
const { isSupported, getCodeFromAny } = require('#utils/translate');

const { translateLanguage } = require('#parameters').autocomplete;

const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');
const { acknowledge } = require('#utils/interactions');

module.exports = {
  name: 'translate',
  description: 'Translate text from and to other languages.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'text',
      description: 'Text to be translated.',
      type: ApplicationCommandOptionTypes.STRING,
      required: true,
    },
    {
      name: 'from',
      description: 'Source Language.',
      onAutoComplete: translateLanguage,
      required: false,
    },
    {
      name: 'to',
      description: 'Target Language.',
      onAutoComplete: translateLanguage,
      required: false,
    },
    {
      name: 'incognito',
      description: 'Makes the response only visible to you.',
      type: ApplicationCommandOptionTypes.BOOLEAN,
      required: false,
      default: false,
    },
  ],
  run: async (context, args) => {
    await acknowledge(context, args.incognito, [...PERMISSION_GROUPS.baseline_slash]);

    if (!args.to) args.to = 'en';
    if (!args.from) args.from = 'auto';

    const content = args.text;

    if (!content.length) return editOrReply(context, createEmbed('warning', context, 'No text supplied.'));

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
          description: `-# ${icon('locale')} ${fromFlag} ${pill(TRANSLATE_LANGUAGES[translate.response.body.language.from || 'auto'] || translate.response.body.language.from || 'Detected Language')} ${icon('arrow_right')} ${toFlag} ${pill(TRANSLATE_LANGUAGES[translate.response.body.language.to] || translate.response.body.language.to)}\n${codeblock('ansi', [translate.response.body.translation])}`,
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
