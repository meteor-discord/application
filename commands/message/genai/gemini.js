const { PERMISSION_GROUPS } = require('#constants');
const { LlmPrivateBard } = require('#obelisk');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { stringwrap, icon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATIC_ICONS } = require('#utils/statics');

const { InteractionCallbackTypes } = require('detritus-client/lib/constants');
const { Components } = require('detritus-client/lib/utils');

module.exports = {
  name: 'gemini',
  label: 'text',
  aliases: ['bard', 'gem'],
  cooldown: 10,
  metadata: {
    description: `Chat with ${icon('brand_google_gemini')} Gemini.`,
    description_short: 'Chat with Gemini.',
    examples: ['gemini How many otter species are there?'],
    category: 'genai',
    usage: 'gemini <input>',
  },
  args: [],
  permissionsClient: [...PERMISSION_GROUPS.baseline, ...PERMISSION_GROUPS.attachments],
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.text) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (text).`));

    let input = args.text;

    // Get content if the user replies to anything
    if (context.message.messageReference) {
      const msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId);

      if (msg.content && msg.content.length) input = `> ${msg.content.split('\n').join('\n> ')}\n${input}`;
      if (msg.embeds?.length)
        for (const e of msg.embeds)
          if (e[1].description?.length) {
            input = `> ${e[1].description.split('\n').join('\n> ')}\n${input}`;
            break;
          }
    }

    try {
      await editOrReply(context, createEmbed('ai_custom', context, STATIC_ICONS.ai_bard));

      let res = await LlmPrivateBard(context, input);
      res = res.response;

      let description = [];
      let files = [];

      if (!res.body.candidates)
        return editOrReply(context, createEmbed('error', context, `Gemini returned an error. Try again later.`));

      if (res.body.candidates[0].length <= 4000) description.push(res.body.candidates[0]);
      else {
        files.push({
          filename: `chat.${Date.now().toString(36)}.txt`,
          value: Buffer.from(res.body.candidates[0]),
        });
      }

      if (!res.body.candidates || res.body.candidates?.length <= 1)
        return editOrReply(context, {
          embeds: [
            createEmbed('defaultNoFooter', context, {
              author: {
                name: stringwrap(args.text, 50, false),
                iconUrl: STATIC_ICONS.ai_bard_idle,
              },
              description: description.join('\n'),
              footer: {
                text: `Gemini • Gemini may display inaccurate info, so double-check its responses.`,
              },
            }),
          ],
          files,
        });
      // Draft support
      else {
        let currentView;

        const components = new Components({
          timeout: 100000,
          run: async ctx => {
            if (ctx.userId !== context.userId)
              return await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

            // this sucks but works, ensures the newly selected option stays selected
            for (let i = 0; i < components.components[0].components[0].options.length; i++) {
              components.components[0].components[0].options[i].default =
                components.components[0].components[0].options[i].value === ctx.data.values[0];
            }

            const draft = res.body.candidates[parseInt(ctx.data.values[0].replace('draft-', ''))];

            description = [];
            files = [];

            if (draft.length <= 4000) description.push(draft);
            else {
              files.push({
                filename: `chat.${Date.now().toString(36)}.txt`,
                value: Buffer.from(draft),
              });
            }

            currentView = createEmbed('defaultNoFooter', context, {
              author: {
                name: stringwrap(args.text, 50, false),
                iconUrl: STATIC_ICONS.ai_bard_idle,
              },
              description: description.join('\n'),
              footer: {
                text: `Gemini • Gemini may display inaccurate info, so double-check its responses.`,
              },
            });

            await ctx.editOrRespond({
              embeds: [currentView],
              files,
              components,
            });
          },
        });

        const draftOptions = [];
        for (let i = 0; i < res.body.candidates.length; i++) {
          draftOptions.push({
            label: `Draft ${i + 1}: ${stringwrap(res.body.candidates[i], 50, false)}`,
            value: 'draft-' + i,
            default: false,
          });
        }

        components.addSelectMenu({
          defaultValues: [],
          placeholder: 'View other drafts',
          customId: 'bard-drafts',
          options: draftOptions,
        });

        setTimeout(() => {
          editOrReply(context, {
            embeds: [currentView],
            components: [],
          });
        }, 100000);

        currentView = createEmbed('defaultNoFooter', context, {
          author: {
            name: stringwrap(args.text, 50, false),
            iconUrl: STATIC_ICONS.ai_bard_idle,
          },
          description: description.join('\n'),
          footer: {
            text: `Gemini • Gemini may display inaccurate info, so double-check its responses.`,
          },
        });

        return editOrReply(context, {
          embeds: [currentView],
          files,
          components,
        });
      }
    } catch (e) {
      if (e.response?.body?.message)
        return editOrReply(context, createEmbed('warning', context, e.response.body.message));

      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to generate response.`));
    }
  },
};
