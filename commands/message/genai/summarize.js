const { PERMISSION_GROUPS } = require('#constants');
const { SparkWebSummarize } = require('#api');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { smallIconPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { HTTP_URL_REGEX } = require('#utils/urls');
const { STATIC_ICONS } = require('#utils/statics');

module.exports = {
  name: 'summarize',
  aliases: ['summary', 'tldr'],
  label: 'text',
  cooldown: 10,
  metadata: {
    description: `${smallIconPill('reply', 'Supports Replies')}\n\nSummarize web pages and articles.`,
    description_short: 'Website summaries',
    examples: ['tldr https://www.theverge.com/2023/11/17/23965185/discord-is-shutting-down-its-ai-chatbot-clyde'],
    category: 'genai',
    usage: 'summarize',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    let content = args.text;
    if (context.message.messageReference) {
      const msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId);

      if (msg.content && msg.content.length) content = msg.content;
      else if (msg.embeds?.length)
        for (const e of msg.embeds) {
          if (e[1].description?.length) content = e[1].description;
          if (e[1].author?.url) content = e[1].author?.url;
          if (e[1].url) content = e[1].url;
        }
    }

    const webUrl = content.match(HTTP_URL_REGEX);
    if (!webUrl) return editOrReply(context, createEmbed('warning', context, `No URLs found.`));
    try {
      await editOrReply(context, createEmbed('ai_custom', 'Generating page summary...', STATIC_ICONS.ai_summary));

      const res = await SparkWebSummarize(context, webUrl[0]);
      if (!res.response.body.summaries)
        return editOrReply(context, createEmbed('error', context, 'Summary generation failed.'));

      const summaries = res.response.body.summaries.map(m => m.split('\n')[0]);

      const responseEmbed = createEmbed('defaultNoFooter', context, {
        author: {
          iconUrl: STATIC_ICONS.ai_summary,
          name: res.response.body.page_metadata?.title || 'Key points about the page',
          url: webUrl[0],
        },
        description: '- ' + summaries.join('\n- '),
        footer: {
          text: 'Generative AI is experimental. Response may be factually incorrect or biased.',
        },
      });

      if (res.response.body.page_metadata?.thumbnail)
        responseEmbed.thumbnail = { url: res.response.body.page_metadata.thumbnail };

      return editOrReply(context, responseEmbed);
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, e.response.body.error.message));
    }
  },
};
