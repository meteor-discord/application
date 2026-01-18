const { wolframAlpha, wolframSupplemental} = require("#api");
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { citation, smallIconPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message')
const { STATICS, STATIC_ASSETS} = require('#utils/statics')
const {createDynamicCardStack} = require("#cardstack/index");
const {InteractiveComponentTypes, ResolveCallbackTypes} = require("#cardstack/constants");

function createWolframPage(context, pod, query, sources) {
  let res = createEmbed("default", context, {
    author: {
      name: pod.title,
      url: `https://www.wolframalpha.com/input?i=${encodeURIComponent(query)}`
    },
    description: undefined,
    footer: {
      iconUrl: STATICS.wolframalpha,
      text: `Wolfram|Alpha • ${context.application.name}`
    }
  })
  if (pod.icon) res.author.iconUrl = pod.icon
  if (pod.value) res.description = pod.value.substr(0, 1000)
  if (pod.value && pod.refs) {
    for (const r of pod.refs) {
      let src = Object.values(sources).filter((s) => s.ref === r)[0]
      if (!src) continue;

      // Only add a direct source if one is available
      if (src.collections) {
        res.description += citation(r, src.url, src.title + (src.collections[0] ? ' | ' + src.collections[0].text : ""))
        continue;
      }
      if (src.url) res.description += citation(r, src.url, src.title)
    }
  }
  if (pod.image) res.image = { url: pod.image };
  return page(res, {}, {
    supplemental: pod.states,
    pod_icon: pod.icon,
    pod_title: pod.title
  });
}

module.exports = {
  name: 'wolframalpha',
  label: 'query',
  aliases: ['wa', 'wolfram-alpha', 'wolfram'],
  metadata: {
    description: `${smallIconPill("reply", "Supports Replies")}\n\nComputes a query using Wolfram|Alpha.`,
    description_short: 'Compute via Wolfram|Alpha',
    examples: ['wa x^2+5x+6=0', 'wa 5€ to $', 'wa 5\'11 to cm'],
    category: 'search',
    usage: 'wolframalpha <query>',
    slashCommand: "wolframalpha"
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    if(context.message.messageReference && !args.query.length) {
      let msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId);
      if(msg.content && msg.content.length) args.query = msg.content
      if(msg.embeds?.length) for(const e of msg.embeds) if(e[1].description?.length) { args.query += '\n' + e[1].description; break; } 
    }

    if (!args.query) return editOrReply(context, createEmbed("warning", context, `Missing Parameter (query).`))
    try {
      let search = await wolframAlpha(context, args.query)
      search = search.response

      if (search.body.status === 1) return editOrReply(context, createEmbed("warning", context, search.body.message))

      let pages = []
      for (const res of search.body.data) {
        pages.push(createWolframPage(context, res, args.query, search.body.sources))
      }

      return await createDynamicCardStack(context, {
        cards: pages,
        interactive: {
          state_buttons: {
            type: InteractiveComponentTypes.BUTTON_GENERATOR,
            // Resolve Components
            resolveComponents: (pg)=>{
              if(!pg.getState("supplemental") || pg.getState("supplemental").length === 0) return [];
              return pg.getState("supplemental").map((b)=>{
                return {
                  label: b.label,
                  visible: true,
                  condition: true,
                  customId: b.supplemental_key,
                  icon: "button_wolfram_compute",
                  renderLoadingState: (pg, component) => {
                    return createEmbed("default", context, {
                      author: {
                        name: `${pg.getState("pod_title")} › ${component.label}`,
                        iconUrl: pg.getState("pod_icon")
                      },
                      image: {
                        url: STATIC_ASSETS.chat_loading
                      }
                    })
                  },
                  resolvePage: async (pg, component)=>{
                    let sup = await wolframSupplemental(context, component.customId);

                    return {
                      type: ResolveCallbackTypes.REPLACE_PARENT_CARD,
                      card: createWolframPage(context, sup.response.body.pod_supplemental, args.query, sup.response.body.sources)
                    }
                  }
                }
              })
            }
          }
        }
      });
    } catch (e) {
      if(e.response?.body?.error) return editOrReply(context, createEmbed("warning", context, e.response.body.message))
      console.log(e)
      return editOrReply(context, createEmbed("error", context, `Unable to perform Wolfram|Alpha search.`))
    }
  },
};