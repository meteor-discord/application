import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  InteractionContextType,
  roleMention,
  SlashCommandBuilder,
  userMention,
} from "discord.js";

import type { I18nFunction } from "~/lib/i18n";
import { Command } from "~/structures/command";
import { Embed } from "~/structures/embed";

export default class Info extends Command {
  public constructor() {
    super(
      new SlashCommandBuilder()
        .setContexts(InteractionContextType.Guild)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
        .setName("info")
        .setDescription("...")
        .addSubcommand(subcommand =>
          subcommand
            .setName("user")
            .setDescription("Get detailed information about a user.")
            .setDescriptionLocalizations({
              "pl": "Uzyskaj szczegółowe informacje o użytkowniku.",
              "es-ES": "Obtén información detallada sobre un usuario.",
            })
            .addUserOption(option =>
              option
                .setName("user")
                .setNameLocalizations({
                  "pl": "użytkownik",
                  "es-ES": "usuario",
                })
                .setDescription("Select the user to retrieve information about.")
                .setDescriptionLocalizations({
                  "pl": "Wybierz użytkownika, aby uzyskać informacje.",
                  "es-ES": "Selecciona al usuario para obtener información.",
                })
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName("server")
            .setNameLocalizations({
              "pl": "serwer",
              "es-ES": "servidor",
            })
            .setDescription("Get detailed information about the server.")
            .setDescriptionLocalizations({
              "pl": "Uzyskaj szczegółowe informacje o serwerze.",
              "es-ES": "Obtén información detallada sobre el servidor.",
            })
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName("role")
            .setNameLocalizations({
              "pl": "rola",
              "es-ES": "rol",
            })
            .setDescription("Get detailed information about a role.")
            .setDescriptionLocalizations({
              "pl": "Uzyskaj szczegółowe informacje o roli.",
              "es-ES": "Obtén información detallada sobre un rol.",
            })
            .addRoleOption(option =>
              option
                .setName("role")
                .setNameLocalizations({
                  "pl": "rola",
                  "es-ES": "rol",
                })
                .setDescription("Select the role to retrieve information about.")
                .setDescriptionLocalizations({
                  "pl": "Wybierz rolę, aby uzyskać informacje.",
                  "es-ES": "Selecciona el rol para obtener información.",
                })
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName("application")
            .setNameLocalizations({
              "pl": "aplikacja",
              "es-ES": "aplicación",
            })
            .setDescription("Get detailed information about an application.")
            .setDescriptionLocalizations({
              "pl": "Uzyskaj szczegółowe informacje o aplikacji.",
              "es-ES": "Obtén información detallada sobre una aplicación.",
            })
            .addStringOption(option =>
              option
                .setName("application")
                .setNameLocalizations({
                  "pl": "aplikacja",
                  "es-ES": "aplicación",
                })
                .setDescription("Identifier of the application.")
                .setDescriptionLocalizations({
                  "pl": "Identyfikator aplikacji.",
                  "es-ES": "Identificador de la aplicación.",
                })
            )
        ),
    );
  }

  public async run(interaction: ChatInputCommandInteraction, $: I18nFunction): Promise<void> {
    const getStatusIcon = (status: boolean) => status ? "<:greendot:1267111982117421097>" : "<:reddot:1267111988907999243>";

    switch (interaction.options.getSubcommand()) {
      case "user": {
        const user = await interaction.client.users.fetch(interaction.options.getUser("user") || interaction.user);
        if (!user) return;

        const embed = new Embed()
          .setDefaults(user)
          .setTitle($("modules.info.user.title"))
          .setURL(`https://discord.com/users/${user.id}`)
          .setThumbnail(user.displayAvatarURL())
          .setImage((await user.fetch()).bannerURL({ size: 4096 }) || null)
          .setFields([
            {
              name: "ID",
              value: user.id,
            },
            {
              name: $("modules.info.user.fields.general"),
              value: [
                `${$("modules.info.user.fields.name")}: ${userMention(user.id)}`,
                `${$("modules.info.user.fields.createdAt")}: ${"<t:" + Math.floor(user.createdTimestamp / 1000) + ":R>" || "N/a"}`,
              ].join("\n"),
            },
          ]);

        const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
        if (member) {
          const roles = member.roles.cache
            .filter(role => role.id !== member.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => `${roleMention(role.id)}`);

          const rolesString = roles.length > 0
            ? roles.slice(0, 3).join(", ") + (roles.length > 3 ? ` (+${roles.length - 3})` : "")
            : "N/a";

          embed.addFields([
            {
              name: $("modules.info.user.fields.member"),
              value: [
                `${$("modules.info.user.fields.joinedAt")}: <t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`,
                `${$("modules.info.user.fields.roles")}: ${rolesString}`,
                `${$("modules.info.user.fields.nickname")}: ${member.nickname || "N/a"}`,
              ].join("\n"),
            },
          ]);
        }

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel($("modules.info.user.buttons.avatar"))
            .setURL(user.displayAvatarURL()),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel($("modules.info.user.buttons.user"))
            .setURL(`https://discord.com/users/${user.id}`),
        );

        interaction.reply({ embeds: [embed], components: [row] });

        break;
      }

      case "server": {
        if (!interaction.guild) {
          await interaction.reply({
            embeds: [new Embed().setDefaults(interaction.user).setDescription($("modules.info.server.noGuild"))],
          });
          return;
        }

        const embed = new Embed()
          .setDefaults()
          .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL({
              size: 1024,
            }) || undefined,
            url: `https://discord.com/channels/${interaction.guild.id}`,
          })
          .setTitle($("modules.info.server.title"))
          .setURL(`https://discord.com/channels/${interaction.guild.id}`)
          .setThumbnail(
            interaction.guild.iconURL({
              size: 1024,
            }) || null,
          )
          .setImage(interaction.guild.bannerURL({ size: 4096 }) || null)
          .setFields([
            {
              name: "ID",
              value: interaction.guild.id,
            },
            {
              name: $("modules.info.server.fields.general"),
              value: [
                `${$("modules.info.server.fields.createdAt")}: <t:${Math.floor(interaction.guild.createdTimestamp! / 1000)}:R>`,
                `${$("modules.info.server.fields.owner")}: ${userMention(interaction.guild.ownerId)}`,
              ].join("\n"),
            },
            {
              name: $("modules.info.server.fields.statistics"),
              value: [
                `${$("modules.info.server.fields.boosts")}: ${interaction.guild.premiumSubscriptionCount}`,
                `${$("modules.info.server.fields.members")}: ${interaction.guild.memberCount}`,
                `${$("modules.info.server.fields.verificationLevel")}: ${interaction.guild.verificationLevel}`,
              ].join("\n"),
            },
          ]);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel($("modules.info.server.buttons.icon"))
            .setURL(interaction.guild.iconURL({ size: 1024 }) || "https://meteors.cc/")
            .setDisabled(interaction.guild.iconURL({ size: 1024 }) === null),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel($("modules.info.server.buttons.banner"))
            .setURL(interaction.guild.bannerURL({ size: 4096 }) || "https://meteors.cc/")
            .setDisabled(interaction.guild.bannerURL({ size: 4096 }) === null),
        );

        await interaction.reply({ embeds: [embed], components: [row] });
        break;
      }

      case "role": {
        const role = await interaction.guild?.roles
          .fetch(interaction.options.getRole("role", true).id)
          .catch(() => null);

        if (!role) {
          await interaction.reply({
            embeds: [new Embed().setDefaults(interaction.user).setDescription($("modules.info.role.noRole"))],
          });
          return;
        }

        const embed = new Embed()
          .setDefaults(interaction.user)
          .setTitle($("modules.info.role.title"))
          .setImage(role.iconURL({ size: 1024 }) || null)
          .setFields([
            {
              name: "ID",
              value: role.id,
            },
            {
              name: $("modules.info.role.fields.general"),
              value: [
                `${$("modules.info.role.fields.name")}: ${roleMention(role.id)}`,
                `${$("modules.info.role.fields.position")}: ${role.position}`,
                `${$("modules.info.role.fields.members")}: ${role.members.size}`,
                `${$("modules.info.role.fields.created")}: <t:${Math.floor(role.createdTimestamp / 1000)}:R>`,
              ].join("\n"),
            },
            {
              name: $("modules.info.role.fields.other"),
              value: [
                `${$("modules.info.role.fields.color")}: #${role.color.toString(16).padStart(6, "0")}`,
                `${$("modules.info.role.fields.hoist")}: ${role.hoist ? "<:greendot:1267111982117421097>" : "<:reddot:1267111988907999243>"}`,
                `${$("modules.info.role.fields.mentionable")}: ${
                  role.mentionable ? "<:greendot:1267111982117421097>" : "<:reddot:1267111988907999243>"
                }`,
              ].join("\n"),
            },
          ]);

        interaction.reply({ embeds: [embed] });

        break;
      }

      case "application": {
        const applicationId = interaction.options.getString("application") || interaction.client.application.id;
        const data = await fetch(`https://discord.com/api/v10/oauth2/applications/${applicationId}/rpc`).then(res => res.json());

        if (!data) {
          interaction.reply({
            embeds: [new Embed().setDefaults(interaction.user).setDescription($("modules.info.app.noApp"))],
          });
          return;
        }

        const formatField = (label: string, value: boolean) => `${$(`modules.info.app.fields.${label}`)}: ${getStatusIcon(value)}`;

        const embed = new Embed()
          .setDefaults(interaction.user)
          .setThumbnail(`https://cdn.discordapp.com/avatars/${applicationId}/${data.icon}?size=1024`)
          .setTitle(data.name)
          .setFields([
            { name: "ID", value: applicationId },
            {
              name: $("modules.info.app.fields.general"),
              value: ["verified", "monetized", "discoverable", "bot_public"]
                .map(key => formatField(key, data[`is_${key}`] || data[key]))
                .join("\n"),
            },
            {
              name: $("modules.info.app.fields.links"),
              value: [
                `[${
                  $("modules.info.app.fields.invite")
                }](https://discord.com/api/oauth2/authorize?client_id=${applicationId}&permissions=8&scope=applications.commands)`,
                data.terms_of_service_url && `[${$("modules.info.app.fields.tos")}](${data.terms_of_service_url})`,
                data.privacy_policy_url &&
                `[${$("modules.info.app.fields.privacy_policy")}](${data.privacy_policy_url})`,
              ].join("\n"),
            },
          ]);

        if (data.tags?.length) {
          embed.addFields([{ name: $("modules.info.app.fields.tags"), value: data.tags.join(", ") }]);
        }

        if (data.description) {
          embed.setDescription(data.description);
        }

        interaction.reply({ embeds: [embed] });

        break;
      }
    }
  }
}
