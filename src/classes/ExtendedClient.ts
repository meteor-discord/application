import { Client, Collection } from "discord.js";
import type Command from "./Command";
import type Event from "./Event";

export default class ExtendedClient extends Client {
	public commands: Collection<string, Command> = new Collection();
	public events: Collection<string, Event> = new Collection();
}
