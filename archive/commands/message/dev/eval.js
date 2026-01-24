const { acknowledge } = require('#utils/interactions');
const { codeblock } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

const { Utils } = require('detritus-client');
const { DiscordRegexNames } = require('detritus-client/lib/constants');

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

module.exports = {
  label: 'code',
  name: 'dev',
  metadata: {
    description: 'Evaluate code.',
    description_short: 'Bot eval',
    examples: ["dev console.log('ping'); -async false"],
    category: 'dev',
    usage: 'eval <code> [-async <true|false>] [-noreply <true|false>] [-jsonspacing <integer>]',
  },
  args: [
    { default: false, name: 'noreply', type: 'bool', help: 'Reply with evaluated output' },
    { default: false, name: 'fileout', type: 'bool', help: 'Respond with output as a file' },
    { default: 2, name: 'jsonspacing', type: 'number', help: 'Spacing for formatted json' },
    { default: true, name: 'async', type: 'bool', help: 'Async evaluation' },
  ],
  onBefore: context => context.user.isClientOwner,
  onCancel: () => {},
  run: async (context, args) => {
    await acknowledge(context);

    const { matches } = Utils.regex(DiscordRegexNames.TEXT_CODEBLOCK, args.code);
    if (matches.length) {
      args.code = matches[0].text;
    }

    let language = 'js';
    let message;
    try {
      if (args.async === false) {
        message = await Promise.resolve(eval(args.code));
      } else {
        const func = new AsyncFunction('context', args.code);
        message = await func(context);
      }
      if (typeof message === 'object') {
        message = JSON.stringify(message, null, args.jsonspacing);
        language = 'json';
      }
    } catch (error) {
      message = error ? error.stack || error.message : error;
    }
    const max = 1990 - language.length;
    if (!args.noreply) {
      const reply = codeblock(language, [String(message).slice(0, max)]);
      if (args.fileout) {
        return editOrReply(context, {
          files: [
            {
              filename: 'out.txt',
              value: Buffer.from(message),
            },
          ],
        });
      }
      return context.editOrReply(reply);
    }
  },
  onError: (context, args, error) => {
    console.error(error);
  },
};
