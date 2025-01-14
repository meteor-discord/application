import { logger } from '~/lib/logger'
import { Event } from '~/structures/event'

export default class WebSocketDebugEvent extends Event {
  private static readonly MONITORED_MESSAGES = [
    'Connecting to wss://',
    'Identifying',
    'Preparing first heartbeat of the connection with a jitter of',
    'Shard received all its guilds. Marking as fully ready.',
    'First heartbeat sent, starting to beat every',
  ] as const

  private static readonly PATTERNS = {
    SHARD_INFO: /\[WS => Shard (\d+)\] (.+)/,
    IDENTIFY_DATA: /shard id: (\d).*count: (\d).*intents: (\d+)/s,
  } as const

  constructor() {
    super({ name: 'debug' })
  }

  public async run(debugInfo: string): Promise<void> {
    const shardData = this.extractShardInfo(debugInfo)
    if (!shardData) return

    const { shardId, message } = shardData
    if (!this.isMonitoredMessage(message)) return

    this.handleMessage(message, debugInfo, shardId)
  }

  private extractShardInfo(debugInfo: string) {
    const [, shardId, message] = WebSocketDebugEvent.PATTERNS.SHARD_INFO.exec(debugInfo) ?? []
    return shardId && message ? { shardId: Number(shardId), message } : null
  }

  private handleMessage(message: string, debugInfo: string, shardId: number): void {
    if (message.startsWith('Connecting to wss://')) {
      logger.websocket(`Connecting to ${message.slice('Connecting to '.length)}`, { shardId })
      return
    }

    if (message.startsWith('Identifying')) {
      this.handleIdentify(debugInfo, shardId)
      return
    }

    logger.websocket(message, { shardId })
  }

  private handleIdentify(debugInfo: string, shardId: number): void {
    const [, id, count, intents] = WebSocketDebugEvent.PATTERNS.IDENTIFY_DATA.exec(debugInfo) ?? []
    if (!id) return

    logger.websocket(
      `Identifying (shard: ${id}, count: ${count}, intents: ${intents})`,
      { shardId },
    )
  }

  private isMonitoredMessage = (message: string): boolean =>
    WebSocketDebugEvent.MONITORED_MESSAGES.some(monitored => message.startsWith(monitored))
}
