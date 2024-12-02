import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

import type { I18nFunction } from "~/lib/i18n";

type CommandData = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

export abstract class Command {
  public readonly data: CommandData;

  public constructor(data: CommandData) {
    this.data = data;
  }

  /**
   * Executes the command logic
   * @param interaction The interaction that triggered this command
   * @param i18n Translation function for internationalization
   */
  public abstract run(interaction: ChatInputCommandInteraction, i18n: I18nFunction): Promise<unknown>;
}
