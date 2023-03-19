import { Fetcher } from "../Fetcher";

const BASE_URL = "https://localhost:61915/api";

export class MiscellaneousServices {

  private constructor() { }

  static async pingAsync(): Promise<any> {
    const response = await Fetcher.instance.fetchAsync({
      method: "GET",
      url: `${BASE_URL}/ping`,
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response;
  }

  static async getServerTimeAsync(): Promise<Date> {
    const response = await Fetcher.instance.fetchAsync({
      method: "GET",
      url: `${BASE_URL}/time`,
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    const currentServerTime = new Date(response.Data.currentTimeInMilliseconds);

    return currentServerTime;
  }
}
