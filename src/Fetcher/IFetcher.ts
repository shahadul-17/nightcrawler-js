import { FetchResponse } from './FetchResponse';

export interface IFetcher {
  isSupported(): boolean;
  isSupportedAsync(): Promise<boolean>;
  fetchAsync(): Promise<FetchResponse>;
}
