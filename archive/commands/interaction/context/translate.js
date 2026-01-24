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
const { translateMessage } = require('#utils/translate');

const {
  ApplicationCommandTypes,
  InteractionCallbackTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');
const { Components } = require('detritus-client/lib/utils');

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

            const fromFlag = TRANSLATE_DISPLAY_MAPPINGS[translate.metadata.language.from || 'auto'] || '';
            const toFlag = TRANSLATE_DISPLAY_MAPPINGS[translate.metadata.language.to] || '';

            const newMessage = translate.message;
            let newMessageContent = '';
            if (newMessage.content) newMessageContent += '\n' + newMessage.content;

            return await ctx.editOrRespond({
              content: stringwrap(
                `-# ${icon('subtext_translate')} Translated from  ${fromFlag} **${TRANSLATE_LANGUAGES[translate.metadata.language.from] || translate.metadata.language.from || 'Auto'}** to  ${toFlag} **${TRANSLATE_LANGUAGES[translate.metadata.language.to] || translate.metadata.language.to}**  •  Google Translate${newMessageContent}`,
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

      const fromFlag = TRANSLATE_DISPLAY_MAPPINGS[translate.metadata.language.from || 'auto'] || '';
      const toFlag = TRANSLATE_DISPLAY_MAPPINGS[translate.metadata.language.to] || '';

      const newMessage = translate.message;
      let newMessageContent = '';
      if (newMessage.content) newMessageContent += '\n' + newMessage.content;

      return editOrReply(
        context,
        createEmbed('default', context, {
          content: stringwrap(
            `-# ${icon('subtext_translate')} Translated from  ${fromFlag} **${TRANSLATE_LANGUAGES[translate.metadata.language.from] || translate.metadata.language.from || 'Auto'}** to  ${toFlag} **${TRANSLATE_LANGUAGES[translate.metadata.language.to] || translate.metadata.language.to}**  •  Google Translate${newMessageContent}`,
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
