import { ApplicationIntegrationType, ChatInputCommandInteraction, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import type { I18nFunction, Locale } from '~/lib/i18n'
import { logger } from '~/lib/logger'
import { analyze } from '~/services/mclogs/analyzer'
import { formatIssue, formatTechnicalInfo } from '~/services/mclogs/formatter'
import { Command } from '~/structures/command'
import { Embed } from '~/structures/embed'

const ALLOWED_FILE_EXTENSIONS = ['.log', '.txt']

export default class MCLogs extends Command {
  public constructor() {
    super(
      new SlashCommandBuilder()
        .setContexts(
          InteractionContextType.Guild,
          InteractionContextType.BotDM,
          InteractionContextType.PrivateChannel,
        )
        .setIntegrationTypes(
          ApplicationIntegrationType.GuildInstall,
          ApplicationIntegrationType.UserInstall,
        )
        .setName('mclogs')
        .setDescription('Analyze Minecraft server logs for common issues')
        .setDescriptionLocalizations({
          'pl': 'Przeanalizuj logi serwera Minecraft pod kątem typowych problemów',
          'es-ES': 'Analiza los registros del servidor de Minecraft en busca de problemas comunes',
        })
        .addAttachmentOption(option =>
          option
            .setName('logfile')
            .setNameLocalizations({ 'pl': 'plik', 'es-ES': 'archivo' })
            .setDescription('The log file to analyze')
            .setDescriptionLocalizations({
              'pl': 'Plik dziennika do przeanalizowania',
              'es-ES': 'El archivo de registro para analizar',
            })
            .setRequired(true)
        ),
    )
  }

  private isValidFileType(fileName: string): boolean {
    return ALLOWED_FILE_EXTENSIONS.some(ext => fileName?.endsWith(ext))
  }

  private async fetchLogContent(url: string): Promise<string> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch log file: ${response.statusText}`)
    }
    return response.text()
  }

  public async run(interaction: ChatInputCommandInteraction, $: I18nFunction): Promise<void> {
    const attachment = interaction.options.getAttachment('logfile', true)

    if (!this.isValidFileType(attachment.name)) {
      await interaction.reply({
        embeds: [
          new Embed()
            .setDefaults(interaction.user)
            .setDescription($('modules.mclogs.errors.invalidFileType')),
        ],
      })
      return
    }

    await interaction.deferReply()

    try {
      const logContent = await this.fetchLogContent(attachment.url)
      const analysis = analyze(logContent)

      if (analysis.issues.length === 0) {
        await interaction.editReply({
          embeds: [
            new Embed()
              .setDefaults(interaction.user)
              .setDescription($('modules.mclogs.noIssues')),
          ],
        })
        return
      }

      const embed = new Embed()
        .setDefaults(interaction.user)
        .setTitle($('modules.mclogs.analysisResults'))

      const techFields = formatTechnicalInfo(analysis.technicalInfo)
      if (techFields.length) {
        embed.addFields([{
          name: $('modules.mclogs.fields.technicalInfo'),
          value: techFields.join('\n'),
        }])
      }

      for (const issue of analysis.issues) {
        const formatted = formatIssue(issue, interaction.locale as Locale)
        embed.addFields([{
          name: formatted.type,
          value: formatted.value,
        }])
      }

      await interaction.editReply({ embeds: [embed] })
    }
    catch (error) {
      logger.error('Failed to analyze log file', { error })
      await interaction.editReply({
        embeds: [
          new Embed()
            .setDefaults(interaction.user)
            .setDescription($('modules.mclogs.errors.analysisError')),
        ],
      })
    }
  }
}
