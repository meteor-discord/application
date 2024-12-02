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

  constructor(instanceUrl = process.env.COBALT_API_URL || "https://cobalt.meteors.cc/") {
    this.instance = instanceUrl;
  }

  /**
   * Fetches data from the Cobalt API.
   * @param url The URL to send for processing.
   */
  public async fetch(url: string): Promise<CobaltResponse> {
    const res = await fetch(this.instance, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "meteor-application/1.0.0",
        // https://github.com/imputnet/cobalt/blob/main/docs/api.md#authentication
        "Authorization": `Api-Key ${process.env.COBALT_API_KEY}`,
      },
      // https://github.com/imputnet/cobalt/blob/main/docs/api.md#request-body
      body: JSON.stringify({
        url,
        disableMetadata: true,
      }),
    });

    return await res.json();
  }

  /**
   * Downloads a file from the specified URL and returns a Buffer.
   * @param url The URL to download the file from.
   */
  public async download(url: string): Promise<Buffer> {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to download file: ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
