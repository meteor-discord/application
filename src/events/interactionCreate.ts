import { codeBlock, type Interaction } from 'discord.js'
import { client } from '~/app'
import { type Locale } from '~/lib/i18n'
import { logger } from '~/lib/logger'
import { Embed } from '~/structures/embed'
import { Event } from '~/structures/event'

export default class InteractionCreate extends Event {
  public constructor() {
    super({
      name: 'interactionCreate',
    })
  }

  public async run(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return

    const command = client.commands.get(interaction.commandName)
    if (!command) return

    const locale = interaction.guild
      ? await client.prisma.guild
        .findUnique({
          where: { id: interaction.guildId! },
          select: { locale: true },
        })
        .then(guild => guild?.locale.toLowerCase() ?? 'en')
        .catch(() => 'en')
      : 'en'

    const translate = (key: string, vars?: Record<string, string>) => client.i18n.translate(locale as Locale, key, vars)

    await command
      .run(interaction, translate)
      .then(() => {
        logger.debug(`Executed command '${command.data.name}'`, {
          guild: interaction.guildId,
          channel: interaction.channelId,
          user: interaction.user.id,
        })
      })
      .catch(async (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const timestamp = Math.floor(Date.now() / 1000)

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
      })
  }
}
