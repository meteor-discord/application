import type Event from "../classes/Event";

const event: Event = {
	name: "ready",
	once: true,
	execute(client) {
		console.log(`Logged in as: ${client.user?.tag}`);
	},
};

export default event;
