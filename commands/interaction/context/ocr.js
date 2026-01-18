const { googleVisionOcr, googleTranslate } = require('#api');
const { TRANSLATE_DISPLAY_MAPPINGS, TRANSLATE_LANGUAGES, PERMISSION_GROUPS } = require('#constants');

const { getMessageAttachment, validateAttachment } = require('#utils/attachment');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { codeblock, pill, icon, stringwrap } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');
const { Context, Argument } = require('detritus-client/lib/command');

const {
  ApplicationCommandTypes,
  MessageFlags,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
  InteractionCallbackTypes,
} = require('detritus-client/lib/constants');
const { Components } = require('detritus-client/lib/utils');

module.exports = {
  name: 'OCR',
  type: ApplicationCommandTypes.MESSAGE,
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  /**
   *
   * @param {Context} context
   * @param {Argument} args
   * @returns
   */
  run: async (context, args) => {
    try {
      await acknowledge(context, false, [...PERMISSION_GROUPS.baseline_slash]);

      const { message } = args;

      let attachment = getMessageAttachment(message);
      if (attachment && validateAttachment(attachment, 'image')) {
        attachment = attachment.url;
      } else {
        attachment = false;
      }
      if (!attachment) return editOrReply(context, createEmbed('warning', context, 'No images found.'));

      const ocr = await googleVisionOcr(context, attachment);

      if (ocr.response.body.status === 1)
        return editOrReply(context, createEmbed('warning', context, ocr.response.body.text));

      const components = new Components({
        timeout: 100000,
        run: async ctx => {
          if (ctx.userId !== context.userId) return await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

          const translate = await googleTranslate(context, ocr.response.body.text, 'en', 'auto');

          const fromFlag = TRANSLATE_DISPLAY_MAPPINGS[translate.response.body.language.from] || '';
          const toFlag = TRANSLATE_DISPLAY_MAPPINGS[translate.response.body.language.to] || '';

          return editOrReply(
            context,
            createEmbed('default', context, {
              description: `-# ${icon('locale')} ​ ${fromFlag} ${pill(TRANSLATE_LANGUAGES[translate.response.body.language.from] || translate.response.body.language.from || 'Detected Language')} ​ ​ ​​${icon('arrow_right')} ​ ​ ​ ​${toFlag} ${pill(TRANSLATE_LANGUAGES[translate.response.body.language.to] || translate.response.body.language.to)}\n${codeblock('ansi', [stringwrap(translate.response.body.translation, 1900)])}`,
              thumbnail: {
                url: attachment,
              },
              footer: {
                iconUrl: STATICS.googletranslate,
                text: `Google Translate • ${context.application.name}`,
              },
            })
          );
        },
      });

      components.addButton({
        label: 'Translate',
        emoji: icon('button_translate'),
        custom_id: 'actions-translate',
        style: 2,
      });

      await editOrReply(
        context,
        createEmbed('default', context, {
          embeds: [
            createEmbed('default', context, {
              thumbnail: {
                url: attachment,
              },
              description: codeblock('ansi', ['​' + ocr.response.body.text.substr(0, 3900)]),
              footer: {
                iconUrl: STATICS.googlelens,
                text: `Google Lens • ${context.application.name} • Took ${ocr.timings}s`,
              },
            }),
          ],
          components,
        })
      );
    } catch (e) {
      console.log(e);
      await editOrReply(context, {
        embeds: [createEmbed('error', context, 'Unable to perform Optical Character Recognition.')],
        flags: MessageFlags.EPHEMERAL,
      });
    }
  },
};
