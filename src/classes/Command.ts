import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Message,
} from "discord.js";

interface CommandMetadata {
	description: string;
	description_short?: string;
	category?: string;
	usage?: string;
	aliases?: string[];
}

export default class Command {
	public name?: string;
	public description?: string;
	public metadata?: CommandMetadata;
	public permissionsClient?: string[];
	public permissionsUser?: string[];
	public cooldown?: number;
	public enabled?: boolean;
	public deferReply?: boolean;
	public ephemeral?: boolean;
	public run?: (
		context: Message | ChatInputCommandInteraction,
	) => Promise<void>;
	public execute?: (interaction: ChatInputCommandInteraction) => Promise<void>;
	public autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}
