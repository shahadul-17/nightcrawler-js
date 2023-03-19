import { Fetcher } from '../Fetcher';
import { HashAlgorithm } from './Enumerations';
import { IHashProvider } from "./IHashProvider";

const BASE_URL = "https://localhost:61915/api/cryptography/hash";

export class ServerSideHashProvider implements IHashProvider {

  private constructor() { }

  async computeHashAsync(message: string, algorithm: HashAlgorithm): Promise<string> {
    const response = await Fetcher.instance.fetchAsync({
      method: "POST",
      url: `${BASE_URL}/${algorithm}`,
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
