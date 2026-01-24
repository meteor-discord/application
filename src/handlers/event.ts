import fs from "node:fs";
import path from "node:path";
import type ExtendedClient from "../classes/ExtendedClient";

export default async (client: ExtendedClient) => {
	const eventsPath = path.join(__dirname, "../events");
	const eventFiles = fs
		.readdirSync(eventsPath)
		.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

	for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		const event = require(filePath).default;

		if (!event || !event.name) continue;

		console.log(`Loaded Event: ${event.name}`);

		if (event.once) {
			client.once(event.name, (...args) => event.execute(client, ...args));
		} else {
			client.on(event.name, (...args) => event.execute(client, ...args));
		}
	}

	// Load interaction handler
	await require("./interaction")(client);
};
