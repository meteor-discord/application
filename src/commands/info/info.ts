import {
  ApplicationIntegrationType,
  ChatInputCommandInteraction,
  InteractionContextType,
  InteractionResponse,
  roleMention,
  userMention,
} from "discord.js";

import type { I18nFunction } from "~/lib/i18n";
import {
  createLinkButtons,
  formatArrayWithEllipsis,
  formatRelativeTimestamp,
  getStatusIcon,
} from "~/lib/utils";
import { Command } from "~/structures/command";
import { Embed } from "~/structures/embed";
import { SlashCommand } from "~/structures/slashCommand";

export default class Info extends Command {
  public constructor() {
    super(
      new SlashCommand()
        .setContexts(InteractionContextType.Guild)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
        .setName("info")
        .addSubcommand(subcommand =>
          subcommand
            .setName("user")
            .setDescription("Get detailed information about a user.")
            .setDescriptionLocalizations({ pl: "Uzyskaj szczegółowe informacje o użytkowniku." })
            .addUserOption(option =>
              option
                .setName("user")
                .setNameLocalizations({ pl: "użytkownik" })
                .setDescription("Select the user to retrieve information about.")
                .setDescriptionLocalizations({ pl: "Wybierz użytkownika, aby uzyskać informacje." })
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName("server")
            .setNameLocalizations({ pl: "serwer" })
            .setDescription("Get detailed information about the server.")
            .setDescriptionLocalizations({ pl: "Uzyskaj szczegółowe informacje o serwerze." })
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName("role")
            .setNameLocalizations({ pl: "rola" })
            .setDescription("Get detailed information about a role.")
            .setDescriptionLocalizations({ pl: "Uzyskaj szczegółowe informacje o roli." })
            .addRoleOption(option =>
              option
                .setName("role")
                .setNameLocalizations({ pl: "rola" })
                .setDescription("Select the role to retrieve information about.")
                .setDescriptionLocalizations({ pl: "Wybierz rolę, aby uzyskać informacje." })
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName("application")
            .setNameLocalizations({ pl: "aplikacja" })
            .setDescription("Get detailed information about an application.")
            .setDescriptionLocalizations({ pl: "Uzyskaj szczegółowe informacje o aplikacji." })
            .addStringOption(option =>
              option
                .setName("application")
                .setNameLocalizations({ pl: "aplikacja" })
                .setDescription("Identifier of the application.")
                .setDescriptionLocalizations({ pl: "Identyfikator aplikacji." })
            )
        ),
    );
  }

  public async run(interaction: ChatInputCommandInteraction, $: I18nFunction): Promise<void> {
    switch (interaction.options.getSubcommand()) {
      case "user": {
        await this.user(interaction, $);
        break;
      }
      case "server": {
        await this.server(interaction, $);
        break;
      }
      case "role": {
        await this.role(interaction, $);
        break;
      }
      case "application": {
        await this.application(interaction, $);
        break;
      }
    }
  }

  private async user(interaction: ChatInputCommandInteraction, $: I18nFunction): Promise<InteractionResponse<boolean>> {
    const user = await interaction.client.users.fetch(
      interaction.options.getUser("user") || interaction.user,
    );

    const embed = new Embed()
      .setDefaults(user)
      .setTitle($("modules.info.user.title"))
      .setURL(`https://discord.com/users/${user.id}`)
      .setThumbnail(user.displayAvatarURL())
      .setImage((await user.fetch()).bannerURL({ size: 4096 }) ?? null)
      .setFields([
        { name: "ID", value: user.id },
        {
          name: $("modules.info.user.fields.general"),
          value: [
            `${$("modules.info.user.fields.name")}: ${userMention(user.id)}`,
            `${$("modules.info.user.fields.createdAt")}: ${formatRelativeTimestamp(user.createdTimestamp)}`,
          ].join("\n"),
        },
      ]);

    const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
    if (member) {
      const roles = member.roles.cache
        .filter(role => role.id !== member.guild.id)
        .sort((a, b) => b.position - a.position);

      const rolesString = formatArrayWithEllipsis(
        Array.from(roles.values()),
        role => roleMention(role.id),
      ) || "N/a";

      embed.addFields([
        {
          name: $("modules.info.user.fields.member"),
          value: [
            `${$("modules.info.user.fields.joinedAt")}: ${formatRelativeTimestamp(member.joinedTimestamp)}`,
            `${$("modules.info.user.fields.roles")}: ${rolesString}`,
            `${$("modules.info.user.fields.nickname")}: ${member.nickname || "N/a"}`,
          ].join("\n"),
        },
      ]);
    }

    const row = createLinkButtons([
      { label: $("modules.info.user.buttons.avatar"), url: user.displayAvatarURL() },
      { label: $("modules.info.user.buttons.user"), url: `https://discord.com/users/${user.id}` },
    ]);

    return await interaction.reply({ embeds: [embed], components: [row] });
  }

  private async server(interaction: ChatInputCommandInteraction, $: I18nFunction): Promise<InteractionResponse<boolean>> {
    if (!interaction.guild) {
      return await interaction.reply({
        embeds: [new Embed().setDefaults(interaction.user).setDescription($("modules.info.server.noGuild"))],
      });
    }

    const guild = interaction.guild;
    const embed = new Embed()
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL({ size: 1024 }) || undefined,
        url: `https://discord.com/channels/${guild.id}`,
      })
      .setTitle($("modules.info.server.title"))
      .setURL(`https://discord.com/channels/${guild.id}`)
      .setThumbnail(guild.iconURL({ size: 1024 }) || null)
      .setImage(guild.bannerURL({ size: 4096 }) || null)
      .setFields([
        { name: "ID", value: guild.id },
        {
          name: $("modules.info.server.fields.general"),
          value: [
            `${$("modules.info.server.fields.createdAt")}: ${formatRelativeTimestamp(guild.createdTimestamp)}`,
            `${$("modules.info.server.fields.owner")}: ${userMention(guild.ownerId)}`,
          ].join("\n"),
        },
        {
          name: $("modules.info.server.fields.statistics"),
          value: [
            `${$("modules.info.server.fields.boosts")}: ${guild.premiumSubscriptionCount}`,
            `${$("modules.info.server.fields.members")}: ${guild.memberCount}`,
            `${$("modules.info.server.fields.verificationLevel")}: ${guild.verificationLevel}`,
          ].join("\n"),
        },
      ]);

    const row = createLinkButtons([
      { label: $("modules.info.server.buttons.icon"), url: guild.iconURL({ size: 1024 }) },
      { label: $("modules.info.server.buttons.banner"), url: guild.bannerURL({ size: 4096 }) },
    ]);

    return await interaction.reply({ embeds: [embed], components: [row] });
  }

  private async role(interaction: ChatInputCommandInteraction, $: I18nFunction): Promise<InteractionResponse<boolean>> {
    const role = await interaction.guild?.roles
      .fetch(interaction.options.getRole("role", true).id)
      .catch(() => null);

    if (!role) {
      return await interaction.reply({
        embeds: [new Embed().setDefaults(interaction.user).setDescription($("modules.info.role.noRole"))],
      });
    }

    const embed = new Embed()
      .setDefaults(interaction.user)
      .setTitle($("modules.info.role.title"))
      .setImage(role.iconURL({ size: 1024 }) || null)
      .setFields([
        { name: "ID", value: role.id },
        {
          name: $("modules.info.role.fields.general"),
          value: [
            `${$("modules.info.role.fields.name")}: ${roleMention(role.id)}`,
            `${$("modules.info.role.fields.position")}: ${role.position}`,
            `${$("modules.info.role.fields.members")}: ${role.members.size}`,
            `${$("modules.info.role.fields.created")}: ${formatRelativeTimestamp(role.createdTimestamp)}`,
          ].join("\n"),
        },
        {
          name: $("modules.info.role.fields.other"),
          value: [
            `${$("modules.info.role.fields.color")}: #${role.color.toString(16).padStart(6, "0")}`,
            `${$("modules.info.role.fields.hoist")}: ${getStatusIcon(role.hoist)}`,
            `${$("modules.info.role.fields.mentionable")}: ${getStatusIcon(role.mentionable)}`,
          ].join("\n"),
        },
      ]);

    return await interaction.reply({ embeds: [embed] });
  }

  private async application(interaction: ChatInputCommandInteraction, $: I18nFunction): Promise<InteractionResponse<boolean>> {
    const applicationId = interaction.options.getString("application") || interaction.client.application.id;
    const data = await fetch(`https://discord.com/api/v10/oauth2/applications/${applicationId}/rpc`).then(res => res.json());

    if (!data) {
      return await interaction.reply({
        embeds: [new Embed().setDefaults(interaction.user).setDescription($("modules.info.app.noApp"))],
      });
    }

    const formatAppField = (label: string, value: boolean) => `${$(`modules.info.app.fields.${label}`)}: ${getStatusIcon(value)}`;

    const embed = new Embed()
      .setDefaults(interaction.user)
      .setThumbnail(`https://cdn.discordapp.com/avatars/${applicationId}/${data.icon}?size=1024`)
      .setTitle(data.name)
      .setDescription(data.description !== "" ? data.description : "N/a")
      .setFields([
        { name: "ID", value: applicationId },
        {
          name: $("modules.info.app.fields.general"),
          value: ["verified", "monetized", "discoverable", "bot_public"]
            .map(key => formatAppField(key, data[`is_${key}`] || data[key]))
            .join("\n"),
        },
        {
          name: $("modules.info.app.fields.links"),
          value: [
            `[${
              $("modules.info.app.fields.invite")
            }](https://discord.com/api/oauth2/authorize?client_id=${applicationId}&permissions=8&scope=applications.commands)`,
            data.terms_of_service_url && `[${$("modules.info.app.fields.tos")}](${data.terms_of_service_url})`,
            data.privacy_policy_url && `[${$("modules.info.app.fields.privacy_policy")}](${data.privacy_policy_url})`,
          ].filter(Boolean).join("\n"),
        },
      ]);

    if (data.tags?.length) {
      embed.addFields([{ name: $("modules.info.app.fields.tags"), value: data.tags.join(", ") }]);
    }

    const row = createLinkButtons([
      { label: $("modules.info.app.buttons.icon"), url: `https://cdn.discordapp.com/avatars/${applicationId}/${data.icon}?size=1024` },
      { label: $("modules.info.app.buttons.invite"), url: `https://discord.com/api/oauth2/authorize?client_id=${applicationId}&scope=bot` },
      {
        label: $("modules.info.app.buttons.admin_invite"),
        url: `https://discord.com/api/oauth2/authorize?client_id=${applicationId}&scope=bot&permissions=8`,
      },
    ]);

    return await interaction.reply({ embeds: [embed], components: [row] });
  }
}
