const { darksky } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { pill, iconPill, smallPill, weatherIcon, timestamp, icon, link, stringwrap } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

const {
  ApplicationCommandOptionTypes,
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} = require('detritus-client/lib/constants');

const modifiers = {
  '°C': i => i,
  '°F': i => i * (9 / 5) + 32,
  K: i => i + 273.15,
};

const unitNames = {
  '°C': 'Celcius',
  '°F': 'Fahrenheit',
  K: 'Kelvin',
};

function temperature(value, units) {
  return `${Math.floor(modifiers[units](value))}${units}`;
}

function getUvIndex(i) {
  if (i <= 2) return 'uv_index_0';
  else if (i <= 5) return 'uv_index_1';
  else if (i <= 7) return 'uv_index_2';
  else if (i <= 10) return 'uv_index_3';
  else if (i <= 11) return 'uv_index_4';
  else return 'question';
}

function renderWeatherCard(context, data, units) {
  let description = `### ${weatherIcon(data.result.current.icon.id)} ${temperature(data.result.current.temperature.current, units)} • ${data.result.current.condition.label}\n-# Feels like ${temperature(data.result.current.temperature.feels_like, units)} • High ${temperature(data.result.current.temperature.max, units)} • Low ${temperature(data.result.current.temperature.min, units)}\n\n${pill('Wind')} `;

  if (units === '°F') description += smallPill((data.result.current.wind.speed / 1.609).toFixed(2) + ' mph');
  else description += smallPill(data.result.current.wind.speed.toFixed(2) + ' km/h');

  const secondaryPills = [];
  if (data.result.current.humidity > 0)
    secondaryPills.push(`${pill('Humidity')} ${smallPill(Math.floor(data.result.current.humidity * 100) + '%')}`);
  if (data.result.current.uvindex > 0)
    secondaryPills.push(
      `${iconPill(getUvIndex(data.result.current.uvindex), 'UV Index')} ${smallPill(data.result.current.uvindex)}`
    );

  if (secondaryPills.length >= 1) description += '\n' + secondaryPills.join(`\n`);
  if (data.result.air_quality) {
    description += `\n${iconPill('air_quality_' + data.result.air_quality.type, 'Air Quality')} ${smallPill(`${data.result.air_quality.label} (${data.result.air_quality.value})`)}`;
  }

  description += `\n\n${iconPill('sun', 'Sunrise')} ${timestamp(data.result.current.sun.sunrise, 't')} ${iconPill('moon', 'Sunset')} ${timestamp(data.result.current.sun.sunset, 't')}`;

  // Render weather alerts
  if (data.result.warnings.length >= 1) {
    for (const w of [data.result.warnings[0]]) {
      if (description.includes(stringwrap(w.label, 50))) continue;
      description += `\n\n${icon('weather_warning_' + (w.icon || 'generic').toLowerCase())} **${stringwrap(w.label, 50)}**\n-# ${stringwrap(w.source, 50)} • ${link(w.url, 'Learn More', 'Learn more about this alert')}`;
    }
  }

  // Render Forecasts
  description += `\n`;

  let space = 3;
  if (units === '°F') space = 4;
  for (const i of data.result.forecast) {
    description += `\n${pill(i.day)} ${weatherIcon(i.icon)}`;
    if (temperature(i.temperature.max, units).toString().length === space)
      description += `${pill(temperature(i.temperature.max, units) + ' ')}`;
    else description += `${pill(temperature(i.temperature.max, units))}`;
    description += `/**`;
    if (temperature(i.temperature.min, units).toString().length === space)
      description += `${smallPill(temperature(i.temperature.min, units) + ' ')}`;
    else description += `${smallPill(temperature(i.temperature.min, units))}`;
  }

  const e = createEmbed('default', context, {
    description,
    timestamp: new Date(data.result.current.date),
  });

  e.footer.iconUrl = STATICS.weather;
  if (data.result.location) e.footer.text = data.result.location;

  if (data.result.current.icon) e.thumbnail = { url: data.result.current.icon.url };
  if (data.result.current.image) e.image = { url: data.result.current.image };

  return e;
}

module.exports = {
  name: 'weather',
  description: 'Check the weather at a location.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'location',
      description: 'City or place to check.',
      type: ApplicationCommandOptionTypes.STRING,
      required: true,
    },
    {
      name: 'units',
      description: 'Temperature units to use.',
      type: ApplicationCommandOptionTypes.STRING,
      choices: [
        {
          value: 'celcius',
          name: 'Celcius',
        },
        {
          value: 'fahrenheit',
          name: 'Fahrenheit',
        },
        {
          value: 'kelvin',
          name: 'Kelvin',
        },
      ],
      required: false,
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
      let data = await darksky(context, args.location);

      data = data.response.body;

      let units = ['°C', '°F'];
      if (args.units) {
        if (args.units === 'fahrenheit') units = ['°F'];
        else if (args.units === 'kelvin') units = ['K'];
      }

      const pages = [];
      for (const u of units) pages.push(page(renderWeatherCard(context, data, u)));

      if (pages.length === 1) return editOrReply(context, pages[0]);

      await paginator.createPaginator({
        context,
        pages,
        buttons: [
          {
            customId: 'next',
            emoji: icon('button_thermometer'),
            label: `Toggle ${unitNames[units[0]]}/${unitNames[units[1]]}`,
            style: 2,
          },
        ],
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('warning', context, `No weather data available for given location.`));
    }
  },
};
