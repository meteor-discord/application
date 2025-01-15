import { JAVA_VERSION_PATTERN, type ServerSoftware } from './patterns'
import { issuePatterns, pluginPatterns, serverPatterns } from './patterns'

export interface LogAnalysis {
  issues: {
    key: string
    lines: string[]
    plugins?: string[]
  }[]
  technicalInfo: {
    javaVersion?: string
    serverSoftware?: ServerSoftware
    plugins: {
      paper: string[]
      bukkit: string[]
      forge: string[]
      fabric: string[]
    }
  }
}

function extractPlugins(logContent: string, pattern: RegExp): string[] {
  const plugins = new Set<string>()
  let match

  while ((match = pattern.exec(logContent)) !== null) {
    const pluginList = match[2] || match[1]
    if (!pluginList) continue

    for (const part of pluginList.split(/[,\n]/)) {
      const trimmed = part.trim()
      if (trimmed) plugins.add(trimmed)
    }
  }

  return Array.from(plugins)
}

function findFirstMatch(
  content: string,
  patterns: { pattern: RegExp; extract: (match: RegExpMatchArray) => ServerSoftware }[],
): ServerSoftware | undefined {
  const contentLength = content.length
  const searchLimit = Math.min(contentLength, 5000)

  for (const { pattern, extract } of patterns) {
    pattern.lastIndex = 0
    const match = pattern.exec(content.slice(0, searchLimit))
    if (match) return extract(match)
  }

  return undefined
}

function extractTechnicalInfo(logContent: string): LogAnalysis['technicalInfo'] {
  const startupContent = logContent.slice(0, 5000)
  const javaMatch = JAVA_VERSION_PATTERN.exec(startupContent)
  const serverSoftware = findFirstMatch(startupContent, serverPatterns)

  const plugins: Record<'paper' | 'bukkit' | 'forge' | 'fabric', string[]> = {
    paper: [],
    bukkit: [],
    forge: [],
    fabric: [],
  }

  const pluginContent = logContent.slice(0, 10000)
  for (const { pattern, type } of pluginPatterns) {
    plugins[type] = extractPlugins(pluginContent, pattern)
  }

  return {
    javaVersion: javaMatch?.[1],
    serverSoftware,
    plugins,
  }
}

export function analyze(logContent: string): LogAnalysis {
  const issues: LogAnalysis['issues'] = []
  const issueMap = new Map<string, { lines: Set<string>; plugins: Set<string> }>()

  const compiledPatterns = issuePatterns.map(({ pattern, key, extractInfo }) => ({
    regex: new RegExp(pattern, 'i'),
    key,
    extractInfo,
  }))

  let startIndex = 0
  let endIndex = logContent.indexOf('\n', startIndex)

  while (startIndex < logContent.length) {
    const line = endIndex === -1
      ? logContent.slice(startIndex).trim()
      : logContent.slice(startIndex, endIndex).trim()

    if (line) {
      for (const { regex, key, extractInfo } of compiledPatterns) {
        const match = regex.exec(line)
        if (!match) continue

        const entry = issueMap.get(key) || { lines: new Set<string>(), plugins: new Set<string>() }
        entry.lines.add(line)

        if (extractInfo) {
          const plugins = extractInfo(match)
          if (plugins) {
            for (const plugin of plugins) {
              entry.plugins.add(plugin)
            }
          }
        }

        issueMap.set(key, entry)
        break
      }
    }

    if (endIndex === -1) break
    startIndex = endIndex + 1
    endIndex = logContent.indexOf('\n', startIndex)
  }

  for (const [key, { lines, plugins }] of issueMap) {
    issues.push({
      key,
      lines: Array.from(lines),
      plugins: plugins.size > 0 ? Array.from(plugins) : undefined,
    })
  }

  return {
    issues,
    technicalInfo: extractTechnicalInfo(logContent),
  }
}
