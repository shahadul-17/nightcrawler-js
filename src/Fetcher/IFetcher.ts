import { FetchOptions } from "./FetchOptions";
import { FetchResponse } from "./FetchResponse";

export interface IFetcher {
  isSupported(): boolean;
  isSupportedAsync(): Promise<boolean>;
  fetchAsync(options: FetchOptions): Promise<FetchResponse>;
}
