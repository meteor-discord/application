import { logger } from '~/lib/logger'
import { Event } from '~/structures/event'

export default class WebSocketDebugEvent extends Event {
  private static readonly MONITORED_MESSAGES = [
    'Preparing first heartbeat of the connection with a jitter of',
    'Shard received all its guilds. Marking as fully ready.',
    'First heartbeat sent, starting to beat every',
  ] as const

  public constructor() {
    super({
      name: 'debug',
    })
  }

  public async run(debugInfo: string): Promise<void> {
    const shardInfo = this.parseShardInfo(debugInfo)
    if (!shardInfo) return

    const { shardId, message } = shardInfo

    if (!this.isMonitoredMessage(message)) {
      return
    }

    logger.websocket(message, {
      shardId: Number(shardId),
    })
  }

  private parseShardInfo(debugInfo: string): { shardId: string; message: string } | null {
    const match = debugInfo.match(/\[WS => Shard (\d+)\] (.+)/)
    if (!match) return null

    const [, shardId, message] = match
    return { shardId, message }
  }

  private isMonitoredMessage(message: string): boolean {
    return WebSocketDebugEvent.MONITORED_MESSAGES.some(monitoredMessage => message.startsWith(monitoredMessage))
  }
}
