import {
  ApplicationIntegrationType,
  ChatInputCommandInteraction,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";

import { client } from "~/app";
import type { I18nFunction } from "~/lib/i18n";
import type { CobaltPicker } from "~/services/cobalt";
import { Command } from "~/structures/command";
import { Embed } from "~/structures/embed";

export default class Cobalt extends Command {
  public constructor() {
    super(
      new SlashCommandBuilder()
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
        .setName("cobalt")
        .setDescription("Free, open-source and efficient media downloader (https://github.com/imputnet/cobalt)")
        .setDescriptionLocalizations({
          "pl": "Bezpłatny, otwartoźródłowy i wydajny downloader multimediów (https://github.com/imputnet/cobalt)",
          "es-ES": "Descargador de medios gratuito, de código abierto y eficiente (https://github.com/imputnet/cobalt)",
        })
        .addStringOption(option =>
          option
            .setName("url")
            .setNameLocalizations({
              "pl": "url",
              "es-ES": "url",
            })
            .setDescription("The URL to download.")
            .setDescriptionLocalizations({
              "pl": "URL do pobrania.",
              "es-ES": "URL para descargar.",
            })
            .setRequired(true)
        )
        .addBooleanOption(option =>
          option
            .setName("ephemeral")
            .setNameLocalizations({
              "pl": "tymczasowe",
              "es-ES": "efímero",
            })
            .setDescription("Whether the message should be ephemeral or not.")
            .setDescriptionLocalizations({
              "pl": "Czy wiadomość powinna być tymczasowa czy nie.",
              "es-ES": "Si el mensaje debe ser efímero o no.",
            })
            .setRequired(false)
        ),
    );
  }

  public async run(interaction: ChatInputCommandInteraction, $: I18nFunction): Promise<void> {
    const url = interaction.options.getString("url");
    const ephemeral = interaction.options.getBoolean("ephemeral") ?? false;

    await interaction.reply({
      embeds: [new Embed().setDefaults(interaction.user).setDescription($("modules.cobalt.status.downloading"))],
      ephemeral,
    });

    const startTime = Date.now();

    const response = await client.cobalt.fetch(url!);

    let files: { attachment: Buffer; name: string; }[] = [];
    switch (response.status) {
      case "redirect":
      case "tunnel": {
        const buffer = await client.cobalt.download(response.url!);
        files = [
          {
            attachment: buffer,
            name: response.filename!,
          },
        ];
        break;
      }
      case "picker": {
        const buffers = await Promise.all(
          response.picker!.map(async (picker: CobaltPicker) => {
            return await client.cobalt.download(picker.url);
          }),
        );
        files = [
          ...buffers.map((buffer: Buffer, index: number) => ({
            attachment: buffer,
            name: `${index + 1}.${
              response.picker![index].type === "video"
                ? "mp4"
                : response.picker![index].type === "photo"
                ? "jpg"
                : "gif"
            }`,
          })),
        ];
        break;
      }
      case "error":
      default: {
        const code = response
          .error!.code.replace("error.api.", "")
          .replaceAll(".", "_")
          .replace("invalid_body", "link_invalid");
        const errorTranslation = $(`commands.cobalt.apiErrors.${code}`);
        await interaction.editReply({
          embeds: [
            new Embed()
              .setDefaults(interaction.user)
              .setDescription(
                errorTranslation === `commands.cobalt.apiErrors.${code}`
                  ? $("modules.cobalt.apiErrors.generic")
                  : errorTranslation,
              ),
          ],
        });
        return;
      }
    }

    const endTime = Date.now();

    if (files?.length === 0) {
      await interaction.editReply({
        embeds: [new Embed().setDefaults(interaction.user).setDescription($("modules.cobalt.status.noFiles"))],
      });
      return;
    }

    const combinedSize = files.reduce((acc, file) => acc + file.attachment.byteLength, 0);
    if (combinedSize > 10 * 1024 * 1024) {
      await interaction.editReply({
        embeds: [
          new Embed().setDefaults(interaction.user).setDescription(
            $("modules.cobalt.status.fileTooLarge", {
              size: `${(combinedSize / 1024 / 1024).toFixed(2)}mb`,
            }),
          ),
        ],
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        new Embed()
          .setDefaults(interaction.user)
          .setDescription(
            $("modules.cobalt.status.downloadComplete", {
              time: `${(endTime - startTime) / 1000}s`,
            }),
          )
          .addFields([
            {
              name: $("modules.cobalt.fields.files"),
              value: files.length.toString(),
              inline: true,
            },
            {
              name: $("modules.cobalt.fields.size"),
              value: `${(combinedSize / 1024 / 1024).toFixed(2)}mb`,
              inline: true,
            },
          ]),
      ],
      files: files.slice(0, 10),
    });
  }
}
