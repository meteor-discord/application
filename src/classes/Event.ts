import type { Client } from "discord.js";

export default class Event {
	public name?: string;
	public once?: boolean;
	public execute?: (
		client: Client<boolean>,
		...args: unknown[]
	) => Promise<void> | void;
}
