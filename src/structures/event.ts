import type { ClientEvents } from "discord.js";

export abstract class Event<K extends keyof ClientEvents = keyof ClientEvents> {
  public readonly name: K;
  public readonly once: boolean;

  public constructor({ name, once }: { name: K; once?: boolean; }) {
    this.name = name;
    this.once = once ?? false;
  }

  /**
   * Executes the event logic
   * @param args Event arguments
   */
  public abstract run(...args: ClientEvents[K]): Promise<unknown>;
}
