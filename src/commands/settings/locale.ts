import {
  ApplicationIntegrationType,
  ChatInputCommandInteraction,
  Collection,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { Command } from '~/structures';
import { Embed } from '~/structures/embed';
import type { I18nFunction } from '~/lib/i18n';
import type { Locale as LocalePrismaType } from '@prisma/client';
import { client } from '~/index';
import i18n, { type Locale as LocaleType } from '~/lib/i18n';

export default class Locale extends Command {
  public constructor() {
    super(
      new SlashCommandBuilder()
        .setContexts(InteractionContextType.Guild)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setName('locale')
        .setNameLocalizations({
          pl: 'język',
          'es-ES': 'idioma',
        })
        .setDescription('Change the locale of the bot.')
        .setDescriptionLocalizations({
          pl: 'Zmień język bota.',
          'es-ES': 'Cambia el idioma del bot.',
        })
        .addStringOption(option =>
          option
            .setName('locale')
            .setNameLocalizations({
              pl: 'język',
              'es-ES': 'idioma',
            })
            .setDescription('The new locale of the bot.')
            .setDescriptionLocalizations({
              pl: 'Nowy język bota.',
              'es-ES': 'El nuevo idioma del bot.',
            })
            .setRequired(true)
            .addChoices(
              { name: 'English', value: 'EN' },
              { name: 'Polski', value: 'PL' },
              { name: 'Español', value: 'ES' }
            )
        )
    );
  }

  /**
   * The cooldown for changing the locale per server.
   * Cooldown: 1 minute
   */
  private readonly cooldowns = new Collection<string, number>();

  public async run(interaction: ChatInputCommandInteraction, __: I18nFunction): Promise<unknown> {
    if (this.cooldowns.has(interaction.guildId!)) {
      if (Date.now() - this.cooldowns.get(interaction.guildId!)! < 1 * 60 * 1000) {
        const embed = new Embed().setDefaults(interaction.user).setDescription(__('commands.locale.cooldown'));

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      }

      this.cooldowns.delete(interaction.guildId!);
    }

    const result = await client.prisma.guild
      .upsert({
        where: {
          id: interaction.guildId!,
        },
        update: {
          locale: interaction.options.getString('locale', true) as LocalePrismaType,
        },
        create: {
          id: interaction.guildId!,
          locale: interaction.options.getString('locale', true) as LocalePrismaType,
        },
      })
      .catch(() => null)
      .finally(() => this.cooldowns.set(interaction.guildId!, Date.now()));

    if (!result) {
      const embed = new Embed().setDefaults(interaction.user).setDescription(__('commands.locale.error'));

      return await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    const embed = new Embed()
      .setDefaults(interaction.user)
      .setDescription(
        i18n.__(interaction.options.getString('locale', true).toLowerCase() as LocaleType, 'commands.locale.success')
      );

    await interaction.reply({
      embeds: [embed],
    });
  }
}
