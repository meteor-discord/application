import { codeBlock, type Interaction } from 'discord.js'
import { client } from '~/app'
import { type Locale } from '~/lib/i18n'
import { logger } from '~/lib/logger'
import { Embed } from '~/structures/embed'
import { Event } from '~/structures/event'

export default class InteractionCreate extends Event {
  public constructor() {
    super({ name: 'interactionCreate' })
  }

  private async resolveLocale(guildId: string | null): Promise<Locale> {
    if (!guildId) return 'en'

    const guild = await client.prisma.guild
      .findUnique({
        where: { id: guildId },
        select: { locale: true },
      })
      .catch(() => null)

    return (guild?.locale.toLowerCase() ?? 'en') as Locale
  }

  public async run(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return

    const command = client.commands.get(interaction.commandName)
    if (!command) return

    const locale = await this.resolveLocale(interaction.guildId)
    const translate = (key: string, vars?: Record<string, string>) => client.i18n.translate(locale, key, vars)

    try {
      await command.run(interaction, translate)
      logger.debug(`Executed command '${command.data.name}'`, {
        guild: interaction.guildId,
        channel: interaction.channelId,
        user: interaction.user.id,
      })
    }
    catch (error) {
      const timestamp = Math.floor(Date.now() / 1000)
      const errorMessage = error instanceof Error ? error.message : String(error)

      const errorEmbed = new Embed()
        .setDefaults(interaction.user)
        .setDescription(
          translate('common.executionError', {
            command: command.data.name,
            issueUrl: 'https://github.com/meteor-discord/application/issues/new',
          }),
        )
        .addFields([
          {
            name: translate('common.timestamp'),
            value: `<t:${timestamp}:R> (${timestamp})`,
          },
          {
            name: translate('common.error'),
            value: codeBlock('bf', errorMessage),
          },
        ])

      await interaction.reply({ embeds: [errorEmbed] }).catch(() => null)

      if (error instanceof Error) {
        const [, ...trace] = error.stack?.split('\n') ?? []
        logger.error(error.message, {
          guild: interaction.guildId,
          channel: interaction.channelId,
          user: interaction.user.id,
        })
        trace.forEach(line => logger.error(line))
      }
    }
  }
}
