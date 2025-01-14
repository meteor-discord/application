export interface CobaltPicker {
  type: "photo" | "video" | "gif";
  url: string;
  thumb?: string;
}

export interface CobaltResponse {
  status: "error" | "tunnel" | "redirect" | "picker";
  picker?: CobaltPicker[];
  url?: string;
  filename?: string;
  error?: {
    code: string;
  };
}

export class CobaltService {
  private instance: string;
  public latency = -1;
  private isConnected = false;

  constructor(instanceUrl = Bun.env.COBALT_API_URL || "https://cobalt.meteors.cc/") {
    this.instance = instanceUrl;

    const checkLatency = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const start = Date.now();
        const response = await fetch(this.instance, {
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          this.latency = Date.now() - start;
          this.isConnected = true;
        }
        else {
          this.latency = -1;
          this.isConnected = false;
        }
      }
      catch (error: unknown) {
        this.latency = -1;
        this.isConnected = false;
        console.error(`Failed to connect to Cobalt API at ${this.instance}:`, error instanceof Error ? error.message : "Unknown error");
      }
    };

    void checkLatency();
    setInterval(checkLatency, 15 * 60 * 1000);
  }

  /**
   * Fetches data from the Cobalt API.
   * @param url The URL to send for processing.
   */
  public async fetch(url: string): Promise<CobaltResponse> {
    if (!this.isConnected) {
      return {
        status: "error",
        error: {
          code: "connection_failed",
        },
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch(this.instance, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "meteor-application/1.0.0",
        },
        body: JSON.stringify({
          url,
          disableMetadata: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      return await res.json();
    }
    catch (error: unknown) {
      console.error(`Failed to fetch from Cobalt API:`, error instanceof Error ? error.message : "Unknown error");
      return {
        status: "error",
        error: {
          code: "request_failed",
        },
      };
    }
  }

  /**
   * Downloads a file from the specified URL and returns a Buffer.
   * @param url The URL to download the file from.
   */
  public async download(url: string): Promise<Buffer> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Failed to download file: ${res.status} ${res.statusText}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    catch (error: unknown) {
      console.error(`Download failed:`, error instanceof Error ? error.message : "Unknown error");
      throw error;
    }
  }
}
