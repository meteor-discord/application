const { perspective } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { format } = require('#utils/ansi');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { codeblock, iconPill, smallPill, stringwrap } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

const { Components } = require('detritus-client/lib/utils');

function getPerspectiveColor(score) {
  if (score >= 0.9) return 'm';
  if (score >= 0.76) return 'r';
  if (score >= 0.5) return 'y';
  return 'g';
}

/*
TODO: this entire code is terrible, rework it some day
*/

function renderPerspectiveAnalysis(payload, input, type) {
  if (!payload.annotations[type]) throw 'unknown type';

  let analysis = payload.annotations[type];

  var offset = 0;
  var final = input;

  for (const a of analysis) {
    var length = final.length;
    var before = final.substring(0, a.region[0] + offset - 1);
    var replace = final.substring(a.region[0] - 1 + offset, a.region[1] + offset);
    var after = final.substring(a.region[1] + offset, length);
    final = before + format(replace, getPerspectiveColor(a.score)) + after;
    offset += 10;
  }

  return final;
}

function perspectiveAnalysisEmbed(context, payload, input, type) {
  let score = payload.scores[type];
  return createEmbed('default', context, {
    // the 1000 chars length limit is stupid, blame discord
    description: `${iconPill('agreements', `${type.substr(0, 1).toUpperCase()}${type.substr(1, type.length).toLowerCase().replace(/_/g, ' ')}`)} ${smallPill(`${(score * 100).toFixed(2)}%`)} ${codeblock('ansi', [stringwrap(renderPerspectiveAnalysis(payload, input, type), 1000)])}`,
    footer: {
      iconUrl: STATICS.perspectiveapi,
      text: `Perspective • ${context.application.name}`,
    },
  });
}

module.exports = {
  label: 'input',
  name: 'analyze',
  metadata: {
    description: `Analyzes a sentence with Perspective for Toxicity.`,
    description_short: `Analyze sentences with Perspective.`,
    examples: ['analyze I hate otters. They are bad animals.'],
    category: 'mod',
    usage: 'analyze <prompt>',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    try {
      if (context.message.messageReference) {
        let msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId);
        args.input = msg.content;
      }

      let perspectiveApi = await perspective(context, [args.input]);

      let currentView;

      const components = new Components({
        timeout: 100000,
        run: async ctx => {
          if (ctx.userId !== context.userId) return await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

          // this sucks but works, ensures the newly selected option stays selected
          for (let i = 0; i < components.components[0].components[0].options.length; i++) {
            components.components[0].components[0].options[i].default =
              components.components[0].components[0].options[i].value === ctx.data.values[0];
          }

          currentView = perspectiveAnalysisEmbed(context, perspectiveApi.response.body, args.input, ctx.data.values[0]);
          await ctx.editOrRespond({ embeds: [currentView], components });
        },
      });

      let options = Object.keys(perspectiveApi.response.body.annotations)
        .map(r => {
          return {
            k: r,
            v: perspectiveApi.response.body.scores[r],
          };
        })
        .sort((a, b) => b.v - a.v);

      let selectOptions = options.map(({ k, v }) => {
        return {
          label: `${(v * 100).toFixed(2)}% • ${k.substr(0, 1).toUpperCase()}${k.substr(1, k.length).toLowerCase().replace(/_/g, ' ')}`,
          value: k,
          default: k === options[0].k,
        };
      });

      components.addSelectMenu({
        defaultValues: [],
        placeholder: 'Select filter type',
        customId: 'filter-type',
        options: selectOptions,
      });

      currentView = perspectiveAnalysisEmbed(context, perspectiveApi.response.body, args.input, options[0].k);

      setTimeout(() => {
        editOrReply(context, {
          embeds: [currentView],
          components: [],
        });
      }, 100000);

      return await editOrReply(context, {
        embeds: [currentView],
        components,
      });
    } catch (e) {
      await editOrReply(context, createEmbed('error', context, `Something went wrong.`));
      console.log(e);
    }
  },
};
