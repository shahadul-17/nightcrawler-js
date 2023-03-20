import { Configuration } from "../Configuration";
import { Fetcher } from "../Fetcher";
import { HashAlgorithm } from "./Enumerations";
import { IHashProvider } from "./IHashProvider";

export class ServerSideHashProvider implements IHashProvider {

  private constructor() { }

  async computeHashAsync(message: string, algorithm: HashAlgorithm): Promise<string> {
    const response = await Fetcher.instance.fetchAsync({
      method: "POST",
      url: `${Configuration.getServerAddress()}/api/cryptography/hash/${algorithm}`,
      body: {
        Message: message,
      },
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.Hash;
  }

  async isMatchedAsync(message: string, preComputedHash: string, algorithm: HashAlgorithm): Promise<boolean> {
    const hash = await this.computeHashAsync(message, algorithm);

    return hash === preComputedHash;
  }

  private static readonly hashProvider: IHashProvider = new ServerSideHashProvider();

  public static get instance(): IHashProvider {
    return this.hashProvider;
  }
}
