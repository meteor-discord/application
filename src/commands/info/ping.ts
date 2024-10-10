import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';

import { Command } from '~/structures';
import { Embed } from '~/structures/embed';
import type { I18nFunction } from '~/lib/i18n';

export default class Ping extends Command {
  public constructor() {
    super(
      new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the latency of our services.')
        .setDescriptionLocalizations({
          pl: 'Sprawdź opóźnienie naszych serwisów.',
          'es-ES': 'Verifica la latencia de nuestros servicios.',
        })
    );
  }

  public async run(interaction: ChatInputCommandInteraction, __: I18nFunction): Promise<void> {
    const embed = new Embed()
      .setDefaults(interaction.user)
      .setDescription(':ping_pong: ' + __('commands.ping.success'))
      .addFields([
        {
          name: __('commands.ping.fields.websocket'),
          value: `${interaction.client.ws.ping}ms`,
          inline: true,
        },
        {
          name: __('commands.ping.fields.database'),
          value: `0ms`,
          inline: true,
        },
        {
          name: __('commands.ping.fields.api'),
          value: `0ms`,
          inline: true,
        },
      ]);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel(__('commands.ping.buttons.reportIssues'))
        .setURL('https://discord.gg/meteorlabs'),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel(__('commands.ping.buttons.servicesStatus'))
        .setURL('https://status.meteors.cc/')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
}