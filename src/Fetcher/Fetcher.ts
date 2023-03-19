import { IFetcher } from "./IFetcher";
import { FetchOptions } from "./FetchOptions";
import { FetchResponse } from "./FetchResponse";

const XmlHttpRequestCreators = [
  () => new XMLHttpRequest(),
  () => new ActiveXObject("Msxml3.XMLHTTP"),
  () => new ActiveXObject("Msxml2.XMLHTTP.6.0"),
  () => new ActiveXObject("Msxml2.XMLHTTP.3.0"),
  () => new ActiveXObject("Msxml2.XMLHTTP"),
  () => new ActiveXObject("Microsoft.XMLHTTP"),
];

export class Fetcher implements IFetcher {

  private isFetcherSupported: boolean = false;
  private supportedXmlHttpRequestCreatorIndex: number = -1;

  private constructor() { }

  public isSupported(): boolean {
    if (typeof window?.fetch === "function") { return true; }

    const { xmlHttpRequestCreatorIndex, } = this.createXmlHttpRequest();

    if (xmlHttpRequestCreatorIndex !== -1) {
      this.supportedXmlHttpRequestCreatorIndex = xmlHttpRequestCreatorIndex;

      return true;
    }

    return false;
  }

  public isSupportedAsync(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const isSupported = this.isSupported();

      resolve(isSupported);
    });
  }

  private async isOkResponse(statusCode: number) {
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

  public async fetchAsync(options: FetchOptions): Promise<FetchResponse> {
    this.isFetcherSupported = await this.isSupportedAsync();

    if (!this.isFetcherSupported) {
      return {
        StatusCode: -1,
        Message: "Fetcher is not supported by this platform.",
      };
    }

    options.headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (typeof options.body === "object") {
      options.body = JSON.stringify(options.body);
    }

    let fetchResponse: undefined | FetchResponse;

    if (typeof window?.fetch === "function") {
      fetchResponse = await this.fetchUsingInBuiltFetchAsync(options);
    } else {
      fetchResponse = await this.fetchUsingXmlHttpRequestAsync(options);
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
