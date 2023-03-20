import { IFetcher } from "./IFetcher";
import { FetchOptions } from "./FetchOptions";
import { FetchResponse } from "./FetchResponse";
import { Platform } from "../Platform";
import { FetchMechanism } from "./Enumerations";

const XmlHttpRequestCreators = [
  () => new XMLHttpRequest(),
  () => new ActiveXObject("Msxml3.XMLHTTP"),
  () => new ActiveXObject("Msxml2.XMLHTTP.6.0"),
  () => new ActiveXObject("Msxml2.XMLHTTP.3.0"),
  () => new ActiveXObject("Msxml2.XMLHTTP"),
  () => new ActiveXObject("Microsoft.XMLHTTP"),
];

export class Fetcher implements IFetcher {

  private supportedXmlHttpRequestCreatorIndex: number = -1;
  private fetchMechanism: FetchMechanism = FetchMechanism.None;

  private constructor() { }

  private retrieveFetchMechanism(): FetchMechanism {
    try {
      if (typeof fetch === "function") { return FetchMechanism.Fetch; }
    } catch { }

    if (Platform.isNodeJS()) { return FetchMechanism.HttpModule; }

    const { xmlHttpRequestCreatorIndex, } = this.createXmlHttpRequest();

    if (xmlHttpRequestCreatorIndex !== -1) {
      this.supportedXmlHttpRequestCreatorIndex = xmlHttpRequestCreatorIndex;

      return FetchMechanism.XmlHttpRequest;
    }

    return FetchMechanism.None;
  }

  public isSupported(): boolean {
    const fetchMechanism = this.retrieveFetchMechanism();
    this.fetchMechanism = fetchMechanism;

    return fetchMechanism !== FetchMechanism.None;
  }

  public isSupportedAsync(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const isSupported = this.isSupported();

      resolve(isSupported);
    });
  }

  private isOkResponse(statusCode: number) {
    return statusCode > 199 && statusCode < 300;
  }

  private async getFetchResponseAsJsonAsync(response: Response) {
    try {
      const json = await response.json();

      return json;
    } catch (error) {
      console.error("An error occurred while retrieving JSON response.", error);
    }

    return {};
  }

  private async fetchUsingInBuiltFetchAsync(options: FetchOptions): Promise<undefined | FetchResponse> {
    if (typeof window?.fetch !== "function") { return undefined; }

    try {
      const response = await window.fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body as string,
      });
      const statusCode = response.status;
      let responseAsJson = await this.getFetchResponseAsJsonAsync(response);

      if (!this.isOkResponse(statusCode)) {
        return {
          StatusCode: statusCode,
          Message: `An error occurred while processing the request (${statusCode}).`,
          ...responseAsJson,
        };
      }

      responseAsJson = {
        StatusCode: statusCode,
        Message: `Request processed successfully (${statusCode}).`,
        ...responseAsJson,
      };

      return responseAsJson;
    } catch (error) {
      console.error("An error occurred while processing the request.", error);

      return {
        StatusCode: -3,
        Message: "An error occurred while processing the request.",
      };
    }
  }

  private async fetchUsingXmlHttpRequestAsync(options: FetchOptions): Promise<undefined | FetchResponse> {
    return new Promise<undefined | FetchResponse>(resolve => {
      const {
        xmlHttpRequestCreatorIndex,
        xmlHttpRequest,
      } = this.createXmlHttpRequest(this.supportedXmlHttpRequestCreatorIndex);

      if (xmlHttpRequestCreatorIndex === -1) {
        resolve(undefined);

        return;
      }

      xmlHttpRequest.open(options.method, options.url, true);
      xmlHttpRequest.timeout = 30000;
      xmlHttpRequest.responseType = "json";

      const headerKeys = Object.getOwnPropertyNames(options.headers);

      for (const headerKey of headerKeys) {
        const headerValue = options.headers![headerKey];

        xmlHttpRequest.setRequestHeader(headerKey, headerValue);
      }

      xmlHttpRequest.addEventListener("abort", () => {
        resolve({
          StatusCode: -4,
          Message: "Your request has been aborted.",
        });
      });

      xmlHttpRequest.addEventListener("timeout", () => {
        resolve({
          StatusCode: -5,
          Message: "Your request has timed out.",
        });
      });

      xmlHttpRequest.addEventListener("error", () => {
        resolve({
          StatusCode: -6,
          Message: "An error occurred while sending the request.",
        });
      });

      xmlHttpRequest.addEventListener("readystatechange", () => {
        const statusCode = xmlHttpRequest.status;

        if (xmlHttpRequest.readyState !== 4) { return; }
        if (!this.isOkResponse(statusCode)) {
          resolve({
            StatusCode: statusCode,
            Message: `An error occurred while processing the request (${statusCode}).`,
          });

          return;
        }

        xmlHttpRequest.response && statusCode !== 0 && resolve({
          StatusCode: statusCode,
          Message: `Request processed successfully (${statusCode}).`,
          ...xmlHttpRequest.response,
        });
      });

      xmlHttpRequest.send(options.body as string);
    });
  }

  private fetchUsingInBuiltHttpModuleAsync(options: FetchOptions): Promise<FetchResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        const url = new URL(options.url);
        let port: number;
        let httpClient: any;

        if (options.url.charAt(4) === "s") {
          port = url.port.length === 0 ? 443 : parseInt(url.port);
          httpClient = require("https");
        } else {
          port = url.port.length === 0 ? 80 : parseInt(url.port);
          httpClient = require("http");
        }

        const isBodyProvided = typeof options.body === "string";
        const headers = { ...options.headers, };

        if (isBodyProvided) { headers["Content-Length"] = Buffer.byteLength(options.body as string).toString(); }

        const clientRequest = httpClient.request({
          hostname: url.hostname,
          path: url.pathname,
          search: url.search,
          port: port,
          method: options.method,
          headers: headers,
        }, (response: any) => {
          const statusCode: number = typeof response.statusCode === "undefined" ? -7 : response.statusCode;

          if (!this.isOkResponse(statusCode)) {
            response.destroy();
            clientRequest.destroy();

            resolve({
              StatusCode: statusCode,
              Message: `An error occurred while processing the request (${statusCode}).`,
            });

            return;
          }

          const chunks: string[] = [];

          response.setEncoding("utf8");

          response.on("data", (chunk: string) => {
            chunks.push(chunk);
          });

          response.on("end", () => {
            response.destroy();
            clientRequest.destroy();

            try {
              const responseAsJson = chunks.join("");
              const responseObject = JSON.parse(responseAsJson);

              resolve({
                StatusCode: statusCode,
                Message: `Request processed successfully (${statusCode}).`,
                ...responseObject,
              });
            } catch (error) {
              reject(new Error("An unexpected error occurred while parsing response as JSON."));
            }
          });

          response.on("error", (error: Error) => {
            response.destroy();
            clientRequest.destroy();

            reject(error);
          });
        });

        clientRequest.on("error", (error: Error) => reject(error));
        clientRequest.on("timeout", () => reject(new Error("Request timed out.")));

        if (isBodyProvided) { clientRequest.write(options.body as string); }

        clientRequest.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  public async fetchAsync(options: FetchOptions): Promise<FetchResponse> {
    const isSupported = await this.isSupportedAsync();

    if (!isSupported) {
      return {
        StatusCode: -1,
        Message: "Fetcher is not supported by this platform.",
      };
    }

    if (typeof options.body === "object") {
      options.body = JSON.stringify(options.body);
    }

    options.headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    };

    let fetchResponse: undefined | FetchResponse;

    if (this.fetchMechanism === FetchMechanism.Fetch) {
      fetchResponse = await this.fetchUsingInBuiltFetchAsync(options);
    } else if (this.fetchMechanism === FetchMechanism.XmlHttpRequest) {
      fetchResponse = await this.fetchUsingXmlHttpRequestAsync(options);
    } else if (this.fetchMechanism === FetchMechanism.HttpModule) {
      try {
        fetchResponse = await this.fetchUsingInBuiltHttpModuleAsync(options);
      } catch (error) {
        console.error("An unexpected error occurred while processing the request.", error);
      }
    }

    if (typeof fetchResponse === "undefined") {
      return {
        StatusCode: -2,
        Message: "An error occurred while processing the request.",
      };
    }

    return fetchResponse;
  }

  private createXmlHttpRequest(index?: number): any {
    let xmlHttpRequestCreatorIndex: number = -1;
    let xmlHttpRequest: any = undefined;

    for (let i = index ?? 0; i < XmlHttpRequestCreators.length; i++) {
      try {
        xmlHttpRequest = XmlHttpRequestCreators[i]();
        xmlHttpRequestCreatorIndex = i;

        break;
      } catch (error) {
        console.error("An error occurred during XmlHttpRequest creation.", error);
      }
    }

    return {
      xmlHttpRequestCreatorIndex: xmlHttpRequestCreatorIndex,
      xmlHttpRequest: xmlHttpRequest,
    };
  }

  private static readonly fetcher: IFetcher = new Fetcher();

  public static get instance(): IFetcher {
    return this.fetcher;
  }
}
