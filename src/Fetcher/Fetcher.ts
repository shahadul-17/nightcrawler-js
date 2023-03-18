import { IFetcher } from './IFetcher';
import { FetchOptions } from './FetchOptions';
import { FetchResponse } from './FetchResponse';

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

  public isSupported(): boolean {
    if (typeof window?.fetch === 'function') { return true; }

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

  private async isOkResponse(status: number) {
    return status > 199 && status < 300;
  }

  private async getFetchResponseAsJsonAsync(response: Response) {
    try {
      const json = await response.json();

      return json;
    } catch (error) {
      console.error('An error occurred while retrieving JSON response.', error);
    }

    return {};
  }

  private async fetchUsingInBuiltFetchAsync(options: FetchOptions): Promise<undefined | FetchResponse> {
    if (typeof window?.fetch !== 'function') { return undefined; }

    try {
      const response = await window.fetch(options.url, {
        method: options.method,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: options.body as string,
      });
      const status = response.status;
      let responseAsJson = await this.getFetchResponseAsJsonAsync(response);

      if (!this.isOkResponse(status)) {
        return {
          status: status,
          message: `An error occurred while processing the request (${status}).`,
          ...responseAsJson,
        };
      }

      responseAsJson = {
        status: status,
        message: `Request processed successfully (${status}).`,
        ...responseAsJson,
      };

      return responseAsJson;
    } catch (error) {
      console.error('An error occurred while processing the request.', error);

      return {
        status: -1,
        message: 'An error occurred while processing the request.',
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
      }

      var xmlHttpRequest2 = new XMLHttpRequest();
      xmlHttpRequest2.open(options.method, options.url, true);
      xmlHttpRequest2.timeout = 30000;
      xmlHttpRequest2.responseType = "arraybuffer";

      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      };
      const headerKeys = Object.getOwnPropertyNames(headers);

      for (const headerKey of headerKeys) {
        const headerValue = headers[headerKey];

        xmlHttpRequest2.setRequestHeader(headerKey, headerValue);
      }

      xmlHttpRequest2.addEventListener("abort", () => {
        resolve({
          status: -4,
          message: "Your request has been aborted.",
        });
      });

      xmlHttpRequest2.addEventListener("timeout", () => {
        resolve({
          status: -3,
          message: "Your request has timed out.",
        });
      });

      xmlHttpRequest2.addEventListener("error", () => {
        resolve({
          status: -2,
          message: "An error occurred while sending the request.",
        });
      });

      xmlHttpRequest2.addEventListener("readystatechange", event => {
        const status = xmlHttpRequest2.status;

        if (xmlHttpRequest2.readyState !== 4) { return; }
        if (!this.isOkResponse(xmlHttpRequest2.status)) {
          resolve({
            status: status,
            message: `An error occurred while processing the request (${status}).`,
          });

          return;
        }

        // this allows error listener resolve the promise. because,
        // error listener is executed after ready state change listener...
        httpResponse && xmlHttpRequest2.status !== 0 && resolve(httpResponse);
      });

      xmlHttpRequest2.send(options.body as string);
    });
  }

  public async fetchAsync(options: FetchOptions): Promise<FetchResponse> {
    this.isFetcherSupported = await this.isSupportedAsync();

    if (!this.isFetcherSupported) {
      return {
        status: -2,
        message: 'Fetcher is not supported by this platform.',
      };
    }

    if (typeof options.body === "object") {
      options.body = JSON.stringify(options.body);
    }

    let fetchResponse: undefined | FetchResponse;

    if (typeof window?.fetch === 'function') {
      fetchResponse = await this.fetchUsingInBuiltFetchAsync(options);
    } else {
      fetchResponse = await this.fetchUsingXmlHttpRequestAsync(options);
    }

    if (typeof fetchResponse === 'undefined') {
      return {
        status: -3,
        message: 'An error occurred while processing the request.',
      };
    }
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
