export interface CobaltPicker {
  type: 'photo' | 'video' | 'gif'
  url: string
  thumb?: string
}

export interface CobaltResponse {
  status: 'error' | 'tunnel' | 'redirect' | 'picker'
  picker?: CobaltPicker[]
  url?: string
  filename?: string
  error?: {
    code: string
  }
}

export class CobaltService {
  private readonly instance: string
  public latency = -1
  private isConnected = false
  private static readonly TIMEOUT = 5000
  private static readonly DOWNLOAD_TIMEOUT = 30000

  constructor(instanceUrl = Bun.env.COBALT_API_URL || 'https://cobalt.meteors.cc/') {
    this.instance = instanceUrl
    void this.checkLatency()
    setInterval(() => void this.checkLatency(), 15 * 60 * 1000)
  }

  private async checkLatency(): Promise<void> {
    try {
      const start = Date.now()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), CobaltService.TIMEOUT)
      })

      const fetchPromise = fetch(this.instance)
      const response = await Promise.race([fetchPromise, timeoutPromise])

      if (response instanceof Response && response.ok) {
        this.latency = Date.now() - start
        this.isConnected = true
        return
      }
      throw new Error('Invalid response')
    }
    catch (error) {
      this.latency = -1
      this.isConnected = false
      console.error(
        `Failed to connect to Cobalt API at ${this.instance}:`,
        error instanceof Error ? error.message : 'Unknown error',
      )
    }
  }

  public async fetch(url: string): Promise<CobaltResponse> {
    if (!this.isConnected) {
      return {
        status: 'error',
        error: { code: 'connection_failed' },
      }
    }

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.error('Cobalt API request timed out after 5 seconds')
          reject(new Error('Timeout'))
        }, CobaltService.TIMEOUT)
      })

      const fetchPromise = fetch(this.instance, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'meteor-application/1.0.0',
        },
        body: JSON.stringify({ url, disableMetadata: true }),
      })

      const response = await Promise.race([fetchPromise, timeoutPromise])

      if (!(response instanceof Response) || !response.ok) {
        throw new Error(`HTTP error! status: ${response instanceof Response ? response.status : 'Unknown'}`)
      }

      return await response.json()
    }
    catch (error) {
      console.error('Failed to fetch from Cobalt API:', error instanceof Error ? error.message : 'Unknown error')
      return {
        status: 'error',
        error: { code: 'request_failed' },
      }
    }
  }

  public async download(url: string): Promise<Buffer> {
    try {
      const timeoutPromise = new Promise<Buffer>((_, reject) => {
        setTimeout(() => reject(new Error('Download timeout')), CobaltService.DOWNLOAD_TIMEOUT)
      })

      const fetchPromise = fetch(url).then(async response => {
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
        }
        return Buffer.from(await response.arrayBuffer())
      })

      return await Promise.race([fetchPromise, timeoutPromise])
    }
    catch (error) {
      console.error('Download failed:', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }
}
