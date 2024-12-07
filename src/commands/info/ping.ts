import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import { client } from "~/app";

import type { I18nFunction } from "~/lib/i18n";
import { Command } from "~/structures/command";
import { Embed } from "~/structures/embed";

export default class Ping extends Command {
  public constructor() {
    super(
      new SlashCommandBuilder()
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
        .setName("ping")
        .setDescription("Check the latency of our services.")
        .setDescriptionLocalizations({
          "pl": "Sprawdź opóźnienie naszych serwisów.",
          "es-ES": "Verifica la latencia de nuestros servicios.",
        }),
    );
  }

  public async run(interaction: ChatInputCommandInteraction, $: I18nFunction): Promise<void> {
    const embed = new Embed()
      .setDefaults(interaction.user)
      .setDescription(":ping_pong: " + $("modules.ping.response"))
      .addFields([
        {
          name: $("modules.ping.fields.websocket"),
          value: `${interaction.client.ws.ping}ms`,
          inline: true,
        },
        {
          name: $("modules.ping.fields.database"),
          value: `${client.prisma.latency}ms`,
          inline: true,
        },
        {
          name: $("modules.ping.fields.api"),
          value: `0ms`,
          inline: true,
        },
        {
          name: "Cobalt",
          value: `${client.cobalt.latency}ms`,
          inline: true,
        },
      ]);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel($("modules.ping.buttons.reportIssues"))
        .setURL("https://discord.meteors.cc"),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel($("modules.ping.buttons.servicesStatus"))
        .setURL("https://meteors.cc/status"),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
}
