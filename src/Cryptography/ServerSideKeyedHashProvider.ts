import { Configuration } from "../Configuration";
import { Fetcher } from "../Fetcher";
import { KeyedHashAlgorithm } from "./Enumerations";
import { IKeyedHashProvider } from "./IKeyedHashProvider";

export class ServerSideKeyedHashProvider implements IKeyedHashProvider {

  private constructor() { }

  async computeHashAsync(message: string, key: string, algorithm: KeyedHashAlgorithm): Promise<string> {
    const response = await Fetcher.instance.fetchAsync({
      method: "POST",
      url: `${Configuration.getServerAddress()}/api/cryptography/keyedHash/${algorithm}`,
      body: {
        Message: message,
        Key: key,
      },
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.KeyedHash;
  }

  async isMatchedAsync(message: string, key: string, preComputedHash: string, algorithm: KeyedHashAlgorithm): Promise<boolean> {
    const hash = await this.computeHashAsync(message, key, algorithm);

    return hash === preComputedHash;
  }

  private static readonly keyedHashProvider: IKeyedHashProvider = new ServerSideKeyedHashProvider();

  public static get instance(): IKeyedHashProvider {
    return this.keyedHashProvider;
  }
}
