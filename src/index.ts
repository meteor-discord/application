import * as Discord from "discord.js";
import ExtendedClient from "./classes/ExtendedClient";

const client = new ExtendedClient({
	intents: 3276799,
	partials: [
		Discord.Partials.Channel,
		Discord.Partials.GuildMember,
		Discord.Partials.Message,
		Discord.Partials.Reaction,
		Discord.Partials.User,
	],
});

// Initialize collections
client.commands = new Discord.Collection();
client.events = new Discord.Collection();

// Load handlers
async function start() {
	await require("./handlers/event")(client);
	await client.login(process.env.DISCORD_TOKEN);
}

start().catch(console.error);
