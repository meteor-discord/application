import { client } from '~/app'
import type { Locale } from '~/lib/i18n'
import type { LogAnalysis } from './analyzer'

const MAX_LOG_LINES = 5
const MAX_CHARS_PER_LINE = 200

function truncateLogLine(line: string): string {
  return line.length > MAX_CHARS_PER_LINE
    ? `${line.slice(0, MAX_CHARS_PER_LINE - 3)}...`
    : line
}

export function formatTechnicalInfo(technicalInfo: LogAnalysis['technicalInfo']): string[] {
  const fields = []

  if (technicalInfo.javaVersion) fields.push(`- Java: ${technicalInfo.javaVersion}`)
  if (technicalInfo.serverSoftware) fields.push(`- ${technicalInfo.serverSoftware}`)
  if (technicalInfo.plugins.paper.length) fields.push(`- Paper Plugins: ${technicalInfo.plugins.paper.join(', ')}`)
  if (technicalInfo.plugins.bukkit.length) fields.push(`- Bukkit Plugins: ${technicalInfo.plugins.bukkit.join(', ')}`)

  return fields
}

export function formatIssue(issue: LogAnalysis['issues'][number], locale: Locale): {
  type: string
  value: string
} {
  const solution = client.i18n.translate(locale, `modules.mclogs.patterns.${issue.key}.solution`)
  const formattedSolution = issue.plugins
    ? solution.replace(/\{plugins\}/g, issue.plugins.join(', '))
    : solution

  return {
    type: client.i18n.translate(locale, `modules.mclogs.patterns.${issue.key}.type`),
    value: [
      formattedSolution,
      '```',
      ...issue.lines.slice(0, MAX_LOG_LINES).map(truncateLogLine),
      '```',
    ].join('\n'),
  }
}
