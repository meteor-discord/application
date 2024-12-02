import {
  Client as DiscordClient,
  type ClientOptions,
  Collection,
} from "discord.js";

import { join } from "path";

import { PrismaClient } from "@prisma/client";
import { I18n } from "~/lib/i18n";
import { logger } from "~/lib/logger";
import { CobaltService } from "~/services/cobalt";
import type { Command } from "~/structures/command";
import type { Event } from "./event";

export class Client<Ready extends boolean = true> extends DiscordClient<Ready> {
  public readonly prisma = new PrismaClient();
  public readonly i18n = new I18n();
  public readonly cobalt = new CobaltService();
  public readonly commands = new Collection<string, Command>();

  public constructor(options: ClientOptions) {
    super(options);
  }

  private async registerItems<T>(dir: string, extension: string, handler: (item: T) => void): Promise<void> {
    const glob = new Bun.Glob(`**/*${extension}`);

    for await (const filePath of glob.scan(dir)) {
      try {
        const fileUrl = join(dir, filePath);
        const { default: ItemClass } = (await import(fileUrl)) as { default: new () => T; };
        handler(new ItemClass());
      }
      catch (error) {
        console.error(`Error registering ${filePath}:`, error);
      }
    }
  }

  private async registerEvents(): Promise<void> {
    await this.registerItems<Event>(join(import.meta.dir, "..", "events"), ".ts", event => {
      const handler = (...args: Parameters<Event["run"]>) => event.run(...args);
      event.once ? this.once(event.name, handler) : this.on(event.name, handler);
    });
    logger.info(`Registered ${this.eventNames().length} events`);
  }

  private async registerCommands(): Promise<void> {
    await this.registerItems<Command>(join(import.meta.dir, "..", "commands"), ".ts", command => {
      this.commands.set(command.data.name, command);
    });
    logger.info(`Registered ${this.commands.size} commands`);
  }

  public async init(): Promise<void> {
    await Promise.all([this.registerEvents(), this.registerCommands(), this.i18n.init()]);
    await this.login();
  }
}
