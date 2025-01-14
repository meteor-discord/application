import {
  ApplicationIntegrationType,
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js'
import { client } from '~/app'
import type { I18nFunction } from '~/lib/i18n'
import type { CobaltResponse } from '~/services/cobalt'
import { Command } from '~/structures/command'
import { Embed } from '~/structures/embed'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const FILE_EXTENSIONS: Record<string, string> = {
  video: 'mp4',
  photo: 'jpg',
  gif: 'gif',
}

export default class Cobalt extends Command {
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
        .setName('cobalt')
        .setDescription('Free, open-source and efficient media downloader (https://github.com/imputnet/cobalt)')
        .setDescriptionLocalizations({
          'pl': 'Bezpłatny, otwartoźródłowy i wydajny downloader multimediów (https://github.com/imputnet/cobalt)',
          'es-ES': 'Descargador de medios gratuito, de código abierto y eficiente (https://github.com/imputnet/cobalt)',
        })
        .addStringOption(option =>
          option
            .setName('url')
            .setNameLocalizations({ 'pl': 'url', 'es-ES': 'url' })
            .setDescription('The URL to download.')
            .setDescriptionLocalizations({
              'pl': 'URL do pobrania.',
              'es-ES': 'URL para descargar.',
            })
            .setRequired(true)
        )
        .addBooleanOption(option =>
          option
            .setName('ephemeral')
            .setNameLocalizations({ 'pl': 'tymczasowe', 'es-ES': 'efímero' })
            .setDescription('Whether the message should be ephemeral or not.')
            .setDescriptionLocalizations({
              'pl': 'Czy wiadomość powinna być tymczasowa czy nie.',
              'es-ES': 'Si el mensaje debe ser efímero o no.',
            })
        ),
    )
  }

  private async handleError(
    interaction: ChatInputCommandInteraction,
    error: { code: string },
    $: I18nFunction,
  ): Promise<void> {
    const code = error.code?.replace('error.api.', '').replaceAll('.', '_').replace('invalid_body', 'link_invalid')
    const errorTranslation = $(`commands.cobalt.apiErrors.${code}`)

    await interaction.editReply({
      embeds: [
        new Embed()
          .setDefaults(interaction.user)
          .setDescription(
            errorTranslation === `commands.cobalt.apiErrors.${code}`
              ? $('modules.cobalt.apiErrors.generic')
              : errorTranslation,
          ),
      ],
    })
  }

  private async processFiles(response: CobaltResponse): Promise<{ attachment: Buffer; name: string }[]> {
    if (response.status === 'redirect' || response.status === 'tunnel') {
      const buffer = await client.cobalt.download(response.url!)
      return [{ attachment: buffer, name: response.filename! }]
    }

    if (response.status === 'picker') {
      const buffers = await Promise.all(
        response.picker!.map(picker => client.cobalt.download(picker.url)),
      )

      return buffers.map((buffer, index) => ({
        attachment: buffer,
        name: `${index + 1}.${FILE_EXTENSIONS[response.picker![index].type]}`,
      }))
    }

    return []
  }

  public async run(interaction: ChatInputCommandInteraction, $: I18nFunction): Promise<void> {
    const url = interaction.options.getString('url', true)
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? false

    await interaction.reply({
      embeds: [new Embed().setDefaults(interaction.user).setDescription($('modules.cobalt.status.downloading'))],
      flags: ephemeral ? MessageFlags.Ephemeral : undefined,
    })

    const startTime = Date.now()
    const response = await client.cobalt.fetch(url)

    if (response.status === 'error') {
      await this.handleError(
        interaction,
        response.error ?? { code: 'unknown_error' },
        $,
      )
      return
    }

    const files = await this.processFiles(response)
    if (!files.length) {
      await interaction.editReply({
        embeds: [new Embed().setDefaults(interaction.user).setDescription($('modules.cobalt.status.noFiles'))],
      })
      return
    }

    const combinedSize = files.reduce((acc, file) => acc + file.attachment.byteLength, 0)
    if (combinedSize > MAX_FILE_SIZE) {
      await interaction.editReply({
        embeds: [
          new Embed()
            .setDefaults(interaction.user)
            .setDescription($('modules.cobalt.status.fileTooLarge', {
              size: `${(combinedSize / 1024 / 1024).toFixed(2)} MiB`,
            })),
        ],
      })
      return
    }

    await interaction.editReply({
      embeds: [
        new Embed()
          .setDefaults(interaction.user)
          .setDescription($('modules.cobalt.status.downloadComplete', {
            time: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
          }))
          .addFields([
            {
              name: $('modules.cobalt.fields.files'),
              value: files.length.toString(),
              inline: true,
            },
            {
              name: $('modules.cobalt.fields.size'),
              value: `${(combinedSize / 1024 / 1024).toFixed(2)} MiB`,
              inline: true,
            },
          ]),
      ],
      files: files.slice(0, 10),
    })
  }
}
