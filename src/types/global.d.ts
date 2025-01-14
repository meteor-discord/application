type NodeEnv = 'development' | 'production'

declare module 'bun' {
  interface Env {
    DISCORD_TOKEN: string
    DATABASE_URL: string
    COBALT_API_KEY: string
    COBALT_API_URL: string
    NODE_ENV: NodeEnv
  }
}
