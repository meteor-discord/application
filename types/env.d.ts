declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DISCORD_TOKEN: string;
			PREFIX_OVERRIDE?: string;
			USE_LOCAL_API?: string;
			BACKEND_API_KEY: string;
		}
	}
}

export {};
