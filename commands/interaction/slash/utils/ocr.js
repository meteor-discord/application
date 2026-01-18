const { googleVisionOcr, googleTranslate } = require('#api');
const { PERMISSION_GROUPS, TRANSLATE_DISPLAY_MAPPINGS, TRANSLATE_LANGUAGES } = require('#constants');

const { validateAttachment } = require('#utils/attachment');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { codeblock, stringwrap, icon, pill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
  InteractionCallbackTypes,
} = require('detritus-client/lib/constants');
const { Components } = require('detritus-client/lib/utils');

module.exports = {
  name: 'ocr',
  description: 'Reads text contents from an image.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'image',
      description: 'Image to scan',
      type: ApplicationCommandOptionTypes.ATTACHMENT,
      required: true,
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

    if (!validateAttachment(args.image, 'image'))
      return await editOrReply(context, createEmbed('warning', context, 'Unsupported attachment type.'));

    try {
      const ocr = await googleVisionOcr(context, args.image.url);

      if (ocr.response.body.status === 1)
        return context.editOrRespond({ embeds: [createEmbed('warning', context, ocr.response.body.text)] });

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
              description: `-# ${icon('locale')} ${fromFlag} ${pill(TRANSLATE_LANGUAGES[translate.response.body.language.from] || translate.response.body.language.from || 'Detected Language')} ${icon('arrow_right')} ${toFlag} ${pill(TRANSLATE_LANGUAGES[translate.response.body.language.to] || translate.response.body.language.to)}\n${codeblock('ansi', [stringwrap(translate.response.body.translation, 1900)])}`,
              thumbnail: {
                url: args.image.url,
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

      return await editOrReply(context, {
        embeds: [
          createEmbed('default', context, {
            thumbnail: {
              url: args.image.url,
            },
            description: codeblock('ansi', ['​' + stringwrap(ocr.response.body.text, 2000)]),
            footer: {
              iconUrl: STATICS.googlelens,
              text: `Google Lens • ${context.application.name} • Took ${ocr.timings}s`,
            },
          }),
        ],
        components,
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, 'Unable to perform OCR.'));
    }
  },
};
