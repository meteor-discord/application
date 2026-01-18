const { PERMISSION_GROUPS } = require('#constants');
const { webAsk } = require('#obelisk');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { iconPill, smallIconPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATIC_ICONS } = require('#utils/statics');
const { hasFeature } = require('#utils/testing');

// TODO: general purpose constant?
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([^> \n]*)/;

module.exports = {
  name: 'ask',
  label: 'text',
  metadata: {
    description: `${iconPill('generative_ai', 'LIMITED TESTING')}\n${smallIconPill('reply', 'Supports Replies')}\n\nAsk questions about web pages and videos. You have to **reply** to a message or embed containing a link to ask questions about it.`,
    description_short: 'Website prompts.',
    examples: ['ask why do they call it oven when you of in the cold food of out hot eat the food'],
    category: 'broken',
    usage: 'ask <question>',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    return;
    if (!(await hasFeature(context, 'flamingo/summary'))) return;
    await acknowledge(context);

    if (!args.text) return editOrReply(context, createEmbed('warning', context, 'You need to ask a question.'));
    if (!context.message.messageReference)
      return editOrReply(context, createEmbed('warning', context, 'You need to reply to a message containing a link.'));

    let msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId);

    if (msg.content && msg.content.length) content = msg.content;
    else if (msg.embeds?.length)
      for (const e of msg.embeds) {
        if (e[1].description?.length) content = e[1].description;
        if (e[1].author?.url) content = e[1].author?.url;
        if (e[1].url) content = e[1].url;
      }

    let webUrl = content.match(URL_REGEX);
    if (!webUrl) return editOrReply(context, createEmbed('warning', context, `No URLs found.`));
    try {
      await editOrReply(context, createEmbed('ai_custom', 'Generating response...', STATIC_ICONS.ai_summary));

      let res = await webAsk(context, webUrl[0], args.text);
      if (!res.response.body.response)
        return editOrReply(context, createEmbed('error', context, 'Unable to generate answer. Try again later.'));

      let description = '';
      let files = [];
      if (res.response.body.response.length <= 4000) description = res.response.body.response;
      else {
        files.push({
          filename: `ask.${Date.now().toString(36)}.txt`,
          value: Buffer.from(res.response.body.response),
        });
      }

      return editOrReply(context, {
        embeds: [
          createEmbed('defaultNoFooter', context, {
            author: {
              iconUrl: STATIC_ICONS.ai_summary,
              name: res.response.body.title || 'Answer from the page',
              url: webUrl[0],
            },
            description,
            footer: {
              text: 'Generative AI is experimental. Response may be factually wrong or completely made up.',
            },
          }),
        ],
        files,
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, e.response.body.message));
    }
  },
};
