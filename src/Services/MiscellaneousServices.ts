import { Configuration } from "../Configuration";
import { Fetcher } from "../Fetcher";

export class MiscellaneousServices {

  private constructor() { }

  static async pingAsync(): Promise<any> {
    const response = await Fetcher.instance.fetchAsync({
      method: "GET",
      url: `${Configuration.getServerAddress()}/api/ping`,
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response;
  }

  static async getServerTimeAsync(): Promise<Date> {
    const response = await Fetcher.instance.fetchAsync({
      method: "GET",
      url: `${Configuration.getServerAddress()}/api/time`,
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    const currentServerTime = new Date(response.Data.currentTimeInMilliseconds);

    return currentServerTime;
  }
}
