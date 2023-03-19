import { HttpMethod } from "./HttpMethod";

export type FetchOptions = {
  method: HttpMethod,
  url: string,
  headers?: Record<string, string>,
  body?: string | Record<string, any>,
};
