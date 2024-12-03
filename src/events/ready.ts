import { logger } from "~/lib/logger";
import { Event } from "~/structures/event";
import { client } from "../app";

export default class Ready extends Event {
  public constructor() {
    super({
      name: "ready",
      once: true,
    });
  }

  public async run(): Promise<void> {
    logger.notice("Client has started up successfully!");

    client.application?.commands.set(client.commands.map(command => command.data)).then(commands => {
      logger.notice("Synchronized all commands with Discord", {
        commands: commands.size,
      });
    });
  }
}
