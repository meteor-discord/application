const { maps, mapsSupplemental } = require('#api');
const { PERMISSION_GROUPS } = require('#constants');

const { hexToDecimalColor } = require('#utils/color');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { link, icon, iconAsEmojiObject, citation } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS, STATIC_ASSETS } = require('#utils/statics');

const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');
const { Components } = require('detritus-client/lib/utils');

function renderPlaceCard(context, place) {
  let cards = [
    createEmbed('defaultNoFooter', context, {
      author: {
        iconUrl: place.style.icon.url,
        name: place.title,
        url: place.url,
      },
      description: `${place.address.full}`,
      url: place.url,
      color: hexToDecimalColor(place.style.color),
    }),
  ];

  if (place.display_type) {
    cards[0].description = `-# ${place.display_type}\n\n` + cards[0].description;
  }

  if (place.ratings?.score) {
    let ratingString = '';

    ratingString += icon('maps_star').repeat(Math.floor(place.ratings.score));

    if (place.ratings.score < 5) {
      if (place.ratings.score - Math.floor(place.ratings.score) >= 0.5) ratingString += icon('maps_star_half');
      else ratingString += icon('maps_star_empty');
      ratingString += icon('maps_star_empty').repeat(5 - Math.ceil(place.ratings.score));
    }

    cards[0].description += `\n\n> -# ${ratingString} **${place.ratings.score}** (${link(place.ratings.url, place.ratings.reviews.toLocaleString('en-US'), 'Amount of user reviews')})`;
  }

  if (place.description) {
    cards[0].description += `\n\n${place.description}`;
  }

  if (place.facts?.length) {
    let fc = 1;
    cards[0].fields = place.facts.map(f => {
      let factField = {
        name: f.label,
        value: f.value,
        inline: true,
      };

      if (f.source) {
        factField.value += citation(fc++, f.source.url, f.source.label);
      }

      return factField;
    });
  }

  if (place.photos?.length) {
    cards[0].image = {
      url: place.photos.shift(),
    };

    if (place.photos.length) {
      for (const p of place.photos) {
        cards.push({
          url: place.url,
          image: {
            url: p,
          },
        });
      }
    }
  }

  return cards;
}

module.exports = {
  name: 'maps',
  description: 'Search for places on Google Maps.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'query',
      description: 'Google Maps search query.',
      type: ApplicationCommandOptionTypes.STRING,
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

    try {
      let search = await maps(context, args.query);
      search = search.response.body;

      // Create initial response page
      let embeds = [];

      let mapCard = createEmbed('default', context, {
        image: {
          url: search.assets.map,
        },
        footer: {
          iconUrl: STATICS.googlemaps,
          text: `Map Data ©${new Date().getFullYear()} Google • ${context.application.name}`,
        },
      });

      embeds.push(mapCard);

      let components = [];

      // Instant Place Result
      if (search.place) {
        embeds = [...embeds, ...renderPlaceCard(context, search.place)];
      } else {
        let supplementalCache = {};

        components = new Components({
          timeout: 100000,
          run: async ctx => {
            if (ctx.userId !== context.userId)
              return await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

            try {
              // Disable component and update the default

              let value = ctx.data.values[0];

              let searchSupplemental;

              for (let i = 0; i < components.components[0].components[0].options.length; i++) {
                let c = components.components[0].components[0];

                components.components[0].components[0].options[i].default =
                  components.components[0].components[0].options[i].value == value;
                components.components[0].components[0].options[i].emoji = iconAsEmojiObject(
                  `maps_${search.places[i].place.icon}_pin`
                );

                // make the selected pin red
                if (c.options[i].value === value)
                  components.components[0].components[0].options[i].emoji = iconAsEmojiObject(`maps_location_pin`);
              }

              if (!supplementalCache[value]) {
                components.components[0].components[0].disabled = true;

                await ctx.editOrRespond({
                  embeds: [
                    mapCard,
                    createEmbed('defaultNoFooter', context, {
                      image: {
                        url: STATIC_ASSETS.chat_loading,
                      },
                    }),
                  ],
                  components,
                });

                searchSupplemental = await mapsSupplemental(context, search.places[parseInt(value)].supplemental_key);

                searchSupplemental = searchSupplemental.response.body;
                supplementalCache[value] = searchSupplemental;

                components.components[0].components[0].disabled = false;
              } else {
                searchSupplemental = supplementalCache[value];
              }

              mapCard = createEmbed('default', context, {
                image: {
                  url: searchSupplemental.assets.map,
                },
                footer: {
                  iconUrl: STATICS.googlemaps,
                  text: `Map Data ©2024 Google • ${context.application.name}`,
                },
              });

              await ctx.editOrRespond({
                embeds: [mapCard, ...renderPlaceCard(context, searchSupplemental.place)],
                components,
              });
            } catch (e) {
              console.log(e);
              components.components[0].components[0].disabled = false;
              await ctx.editOrRespond({
                embeds: [mapCard, createEmbed('error', context, 'Something went wrong trying to view this place.')],
                components,
              });
            }
          },
        });

        components.addSelectMenu({
          type: 3,
          custom_id: 'place-picker',
          placeholder: 'Select a place',
          defaultValues: [],
          options: search.places.map((p, i) => ({
            label: stringwrap(p.place.name, 100),
            value: `${i}`,
            emoji: icon(`maps_${p.place.icon}_pin`),
            description: stringwrap(p.place.address, 100),
          })),
        });
      }

      return await editOrReply(context, {
        embeds,
        components,
      });
    } catch (e) {
      if (e.response?.body?.status && e.response.body.status == 2 && e.response.body.message)
        return editOrReply(context, createEmbed('warning', context, e.response.body.message));
      console.log(JSON.stringify(e.raw) || e);
      return editOrReply(context, createEmbed('error', context, `Something went wrong.`));
    }
  },
};
