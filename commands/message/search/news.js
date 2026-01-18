const { googleNews, googleNewsSupplemental} = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { createDynamicCardStack } = require("#cardstack/index");
const { ResolveCallbackTypes, InteractiveComponentTypes} = require("#cardstack/constants");

const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');
const { STATIC_ASSETS, STATIC_ICONS, STATICS} = require("#utils/statics");

function renderNewsCard(context, res, supplementalKey, includeSupplementalData = true){

  // search_service/endpoints/google-news#NEWS_CARD_TYPES.COLLECTION
  if(res.type && res.type === 2) res = res.cards[0];

  let result = createEmbed("default", context, {
    author: {
      name: res.publisher.name,
      iconUrl: res.publisher.icon
    },
    title: res.title,
    description: `${res.description}`,
    fields: [],
    footer: {
      iconUrl: STATICS.googlenews,
      text: `Google News • ${context.application.name}`
    }
  })

  if(res.url) result.url = res.url;

  if(res.image) result.image = { url: res.image };

  return page(result, {}, includeSupplementalData ? {
    full_coverage_key: supplementalKey
  } : {});
}

module.exports = {
  name: 'news',
  label: 'query',
  aliases: ['n'],
  metadata: {
    description: 'Show the latest News from around the world or search for topics.',
    description_short: 'Search News',
    examples: [
      'news germany',
      'news latest movies'
    ],
    category: 'search',
    usage: 'news [<query>]',
    //slashCommand: "anime"
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    try{
      let search = await googleNews(context, args.query)
      search = search.response

      if(search.body.status === 2) return editOrReply(context, createEmbed("error", context, search.body.message))

      let pages = []
      for(const res of search.body.cards){
        let sup;
        if(res.supplemental_key || res.supplemental_key === 0) sup = search.body.supplemental_keys[res.supplemental_key]
        pages.push(renderNewsCard(context, res, sup, true))
      }

      if(!pages.length) return editOrReply(context, createEmbed("warning", context, `No results found.`))

      createDynamicCardStack(context, {
        cards: pages,
        interactive: {
          full_coverage_button: {
            type: InteractiveComponentTypes.BUTTON,
            label: "Full Coverage",
            icon: "button_full_coverage",
            visible: (pg) => {
              return (pg.getState("full_coverage_key") !== null)
            },
            condition: true,
            renderLoadingState: () => {
              return createEmbed("default", context, {
                author: {
                  name: "Full Coverage",
                  iconUrl: STATIC_ICONS.full_coverage,
                },
                image: {
                  url: STATIC_ASSETS.card_skeleton
                }
              })
            },
            resolvePage: async (pg) => {
              let fullCoverage = await googleNewsSupplemental(context, pg.getState("full_coverage_key"));

              let cards = fullCoverage.response.body.cards.map((c)=>renderNewsCard(context, c, undefined, false))

              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: cards.length >= 1 ? cards : [
                  // This happens if the episode metadata resolver fails.
                  page(createEmbed("defaultNoFooter", context, {
                    author: {
                      name: "Full Coverage",
                      iconUrl: STATIC_ICONS.full_coverage,
                    },
                    description: `\n## Full Coverage Unavailable\n\nWe're unable to display Full Coverage for this story.`
                  }))
                ],
              };
            }
          }
        }
      });
    }catch(e){
      if(e.response?.body?.status === 1) return editOrReply(context, createEmbed("warning", context, e.response?.body?.message))
      if(e.response?.body?.status === 2) return editOrReply(context, createEmbed("warning", context, e.response?.body?.message))

      console.log(e)
      return editOrReply(context, createEmbed("error", context, `Unable to perform news search.`))
    }
  }
};
