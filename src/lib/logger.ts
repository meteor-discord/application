import chalk, { type ChalkInstance } from 'chalk'

type BaseLogLevel = 'DEBUG' | 'INFO' | 'NOTICE' | 'WARN' | 'ERROR' | 'FATAL'
type ExtendedLogLevel = 'WEBSOCKET' | 'PERFORMANCE' | 'SECURITY'
export type LogLevel = BaseLogLevel | ExtendedLogLevel

type LogContext = Record<string, unknown>

export class Logger {
  private static readonly LOG_COLORS: Record<LogLevel, ChalkInstance> = {
    DEBUG: chalk.hex('#78c9ff'),
    INFO: chalk.hex('#4b74fa'),
    NOTICE: chalk.hex('#844af0'),
    WARN: chalk.hex('#fcd04c'),
    ERROR: chalk.hex('#fc5656'),
    FATAL: chalk.bgHex('#9c2424').white,
    WEBSOCKET: chalk.hex('#e866a3'),
    PERFORMANCE: chalk.bgWhite.black,
    SECURITY: chalk.bgBlack.white,
  } as const

  private static readonly DATE_FORMAT: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  } as const

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = chalk.hex('#616161')(new Date().toLocaleString('en-US', Logger.DATE_FORMAT))
    const coloredLevel = Logger.LOG_COLORS[level](level.padStart(11))

    if (!context) {
      return `${timestamp} ${coloredLevel} ${message}`
    }

    const contextString = Object.entries(context)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(', ')

    return `${timestamp} ${coloredLevel} ${message} ${chalk.hex('#949494')(`(${contextString})`)}`
  }

  public debug(message: string, context?: LogContext): void {
    console.debug(this.formatMessage('DEBUG', message, context))
  }

  public info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('INFO', message, context))
  }

  public notice(message: string, context?: LogContext): void {
    console.info(this.formatMessage('NOTICE', message, context))
  }

  public warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context))
  }

  public error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('ERROR', message, context))
  }

  public fatal(message: string, context?: LogContext): void {
    console.error(this.formatMessage('FATAL', message, context))
  }

  public websocket(message: string, context?: LogContext): void {
    console.info(this.formatMessage('WEBSOCKET', message, context))
  }

  public performance(message: string, context?: LogContext): void {
    console.info(this.formatMessage('PERFORMANCE', message, context))
  }

  public security(message: string, context?: LogContext): void {
    console.info(this.formatMessage('SECURITY', message, context))
  }
}

export const logger = new Logger()
