const { createEmbed } = require('#utils/embed');
const { icon, highlight, link, stringwrap } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

const superagent = require('superagent');

const { Routes } = require('detritus-client-rest/lib/endpoints');
const { PERMISSION_GROUPS } = require('#constants');
const { acknowledge } = require('#utils/interactions');

const applicationFlags = {
  EMBEDDED_RELEASED: 1,
  GATEWAY_PRESENCE: 12,
  GATEWAY_PRESENCE_LIMITED: 13,
  GATEWAY_GUILD_MEMBERS: 14,
  GATEWAY_GUILD_MEMBERS_LIMITED: 15,
  VERIFICATION_PENDING_GUILD_LIMIT: 16,
  EMBEDDED: 17,
  GATEWAY_MESSAGE_CONTENT: 18,
  GATEWAY_MESSAGE_CONTENT_LIMITED: 19,
  EMBEDDED_FIRST_PARTY: 20,
  APPLICATION_COMMAND_BADGE: 23,
};

const applicationFlagNames = {
  EMBEDDED_RELEASED: 'Embedded Released',
  GATEWAY_PRESENCE: 'Presence Intent',
  GATEWAY_PRESENCE_LIMITED: 'Presence Intent (Not approved)',
  GATEWAY_GUILD_MEMBERS: 'Server Members Intent',
  GATEWAY_GUILD_MEMBERS_LIMITED: 'Server Members Intent (Not approved)',
  VERIFICATION_PENDING_GUILD_LIMIT: 'Pending Server Limit',
  EMBEDDED: 'Embedded',
  GATEWAY_MESSAGE_CONTENT: 'Message Content Intent',
  GATEWAY_MESSAGE_CONTENT_LIMITED: 'Message Content Intent (Not approved)',
  EMBEDDED_FIRST_PARTY: 'Embedded First Party',
  APPLICATION_COMMAND_BADGE: `Has Slash Commands ${icon('slash')}`,
};

module.exports = {
  name: 'appinfo',
  label: 'id',
  aliases: ['ai'],
  metadata: {
    description: 'Displays information about a discord application.',
    description_short: 'Information about discord applications',
    examples: ['ai 682654466453012553'],
    category: 'info',
    usage: 'appinfo <application id>',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    let id;
    if (/\d{17,19}/.test(args.id)) {
      id = args.id.match(/\d{17,19}/);
    } else {
      return editOrReply(context, createEmbed('warning', context, 'Invalid Application ID'));
    }

    let application;
    let assets;
    try {
      application = await superagent.get(`${Routes.URL}/api/v9/applications/${id}/rpc`);
      application = application.body;
    } catch {
      return editOrReply(context, createEmbed('warning', context, 'Invalid Application'));
    }

    try {
      assets = await superagent.get(`${Routes.URL}/api/oauth2/applications/${id}/assets`);
      assets = assets.body;
    } catch {
      // :)
    }

    const embed = createEmbed('default', context, {
      description: `${icon('robot')} **${application.name}** ${highlight(`(${application.id})`)}\n${application.description}`,
      fields: [],
    });

    if (application.icon !== null)
      embed.thumbnail = {
        url: `https://cdn.discordapp.com/app-icons/${application.id}/${application.icon}.png?size=4096`,
      };

    if (application.terms_of_service_url || application.privacy_policy_url) {
      const content = [];
      if (application.terms_of_service_url)
        content.push(`${icon('agreements')} ${link(application.terms_of_service_url, 'Terms of Service')}`);
      if (application.privacy_policy_url)
        content.push(`${icon('padlock')} ${link(application.privacy_policy_url, 'Privacy Policy')}`);

      embed.fields.push({
        name: `${icon('link')} Links`,
        value: content.join('\n'),
        inline: true,
      });
    }

    if ('bot_public' in application) {
      const content = [];
      if (application.bot_public) content.push(`• App is public`);
      if (application.custom_install_url)
        content.push(`${icon('link')} ${link(application.custom_install_url, 'Invite App')}`);
      if (application.install_params)
        content.push(
          `${icon('link')} ${link(`https://discord.com/api/oauth2/authorize?client_id=${application.id}&permissions=${application.install_params.permissions}&scope=${application.install_params.scopes.join('+')}`, 'OAuth2 Invite URL')}`
        );
      if (application.bot_require_code_grant) content.push(`\n• App requires code grant`);

      if (content.length)
        embed.fields.push({
          name: `${icon('user')} Bot`,
          value: content.join('\n'),
          inline: true,
        });
    }

    if (application.tags) {
      embed.fields.push({
        name: `${icon('list')} Tags`,
        value: application.tags.map(t => highlight(t + '​')).join(', '),
        inline: true,
      });
    }

    if (application.max_participants) {
      const content = [];

      content.push(`Max Participants: **${application.max_participants}**`);
      if (application.embedded_activity_config !== null) {
        if (application.embedded_activity_config?.supported_platforms)
          content.push(
            `Supported Platforms: ${application.embedded_activity_config.supported_platforms.map(t => highlight(t)).join(', ')}`
          );
      }

      embed.fields.push({
        name: `${icon('activity')} Embedded Activity`,
        value: content.join('\n').substr(0, 1024),
        inline: true,
      });
    }

    if (application.flags) {
      const fl = [];
      for (const flag of Object.keys(applicationFlags)) {
        if (application.flags & (1 << applicationFlags[flag])) fl.push('• ' + applicationFlagNames[flag]);
      }

      embed.fields.push({
        name: `${icon('flag')} Flags`,
        value: fl.join('\n').substr(0, 1024),
        inline: true,
      });
    }

    if (assets.length) {
      const asset = assets.map(a =>
        link(
          `https://cdn.discordapp.com/app-assets/${application.id}/${a.id}.png?size=4096`,
          stringwrap(a.name, 23, false)
        )
      );
      if (asset.length >= 6)
        asset[5] = link(
          `https://canary.discord.com/api/oauth2/applications/${application.id}/assets`,
          `View ${asset.length - 6} remaining assets`
        );
      embed.fields.push({
        name: `${icon('image')} Assets`,
        value: '• ' + asset.splice(0, 6).join('\n• ').substr(0, 1020),
        inline: true,
      });
    }

    return editOrReply(context, embed);
  },
};
