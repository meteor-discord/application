export interface ServerSoftware {
  name: string
  version: string
  type: 'paper' | 'spigot' | 'bukkit' | 'forge' | 'fabric' | 'vanilla' | 'hybrid' | 'unknown'
  subtype?: string
  modLoader?: {
    name: string
    version: string
  }
}

export interface LogPattern {
  pattern: RegExp
  key: string
  extractInfo?: (match: RegExpMatchArray) => string[]
}

export const JAVA_VERSION_PATTERN = /(?:Running|Using|Starting with) (?:Java|JDK|OpenJDK) (?:version )?([^)\s]+)/i

export const issuePatterns: LogPattern[] = [
  {
    pattern: /(?:java\.lang\.OutOfMemoryError|OutOfMemoryError: Java heap space)/i,
    key: 'outOfMemory',
  },
  {
    pattern: /Failed to load ['"]([^'"]+)['"] \(.*?\)(?:: Plugin .+? does not exist)?/i,
    key: 'pluginLoading',
    extractInfo: (match: RegExpMatchArray) => [match[1]],
  },
  {
    pattern: /(?:Reached end of stream|Read timed out|Connection refused|Connection reset|No route to host)/i,
    key: 'networkTimeout',
  },
  {
    pattern: /Could not pass event (.*?) to (\S+)(?:\sv?[\d.]\S*)?/i,
    key: 'pluginEvent',
    extractInfo: (match: RegExpMatchArray) => [match[2].split('@')[0]],
  },
]

export const serverPatterns = [
  {
    pattern: /This server is running (Paper|Purpur|Pufferfish|Airplane|Folia)(?:MC)? version ([^(]+) \(MC: ([^)]+)\)/i,
    extract: (match: RegExpMatchArray): ServerSoftware => ({
      name: match[1].toLowerCase(),
      version: match[2].trim(),
      type: 'paper',
    }),
  },
  {
    pattern: /This server is running (Spigot|CraftBukkit) version ([^(]+) \(MC: ([^)]+)\)/i,
    extract: (match: RegExpMatchArray): ServerSoftware => ({
      name: match[1].toLowerCase(),
      version: match[2].trim(),
      type: match[1].toLowerCase() === 'craftbukkit' ? 'bukkit' : 'spigot',
    }),
  },
  {
    pattern: /(?:MinecraftForge|Forge Mod Loader) v?(\S+) ?(?:Initialized|Loading|for Minecraft) ([^\s,]+)/i,
    extract: (match: RegExpMatchArray): ServerSoftware => ({
      name: 'forge',
      version: match[2].trim(),
      type: 'forge',
      modLoader: {
        name: 'forge',
        version: match[1].trim(),
      },
    }),
  },
  {
    pattern: /Loading (?:Fabric|Quilt) \(?([^)\s]+)[)\s]+ for MC[:\s]+([^\s)]+)/i,
    extract: (match: RegExpMatchArray): ServerSoftware => ({
      name: 'fabric',
      version: match[2].trim(),
      type: 'fabric',
      modLoader: {
        name: 'fabric',
        version: match[1].trim(),
      },
    }),
  },
  {
    pattern: /(Mohist|Magma|Arclight) version (\S+)(?: \(MC: ([^)]+)\))?/i,
    extract: (match: RegExpMatchArray): ServerSoftware => ({
      name: match[1].toLowerCase(),
      version: match[2].trim(),
      type: 'hybrid',
      subtype: 'forge-paper',
    }),
  },
  {
    pattern: /Starting minecraft server version (\S+)/i,
    extract: (match: RegExpMatchArray): ServerSoftware => ({
      name: 'vanilla',
      version: match[1].trim(),
      type: 'vanilla',
    }),
  },
]

export const pluginPatterns = [
  {
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    pattern: /(?:Paper|Bukkit|Spigot) plugins \((\d+)\):\s*(?:-\s*)?([^[\n]+)(?=\[|$)/gm,
    type: 'paper' as const,
  },
  {
    pattern: /(?:Mod|Loading mod|Loaded mod) ['"]([^'"]+)['"]/g,
    type: 'forge' as const,
  },
  {
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    pattern: /Loading (\d+) mods:[^\n]*\n\s*(?:-\s*)?([^[\n]+)(?=\[|$)/gm,
    type: 'fabric' as const,
  },
]
