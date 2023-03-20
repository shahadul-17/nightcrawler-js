import { Configuration } from "../Configuration";
import { Fetcher } from "../Fetcher";
import { ISecureRandomGenerator } from "./ISecureRandomGenerator";

export class ServerSideSecureRandomGenerator implements ISecureRandomGenerator {

  private constructor() { }

  async generateByteAsync(): Promise<number> {
    const response = await Fetcher.instance.fetchAsync({
      method: "GET",
      url: `${Configuration.getServerAddress()}/api/random/byte`,
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.Random;
  }

  async generateIntegerAsync(digits?: number, minimum?: number, maximum?: number): Promise<number> {
    const response = await Fetcher.instance.fetchAsync({
      method: "GET",
      url: `${Configuration.getServerAddress()}/api/random/integer?digits=${digits ?? ""}&minimum=${minimum ?? ""}&maximum=${maximum ?? ""}`,
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.Random;
  }

  async generateLongAsync(digits?: number, minimum?: number, maximum?: number): Promise<number> {
    const response = await Fetcher.instance.fetchAsync({
      method: "GET",
      url: `${Configuration.getServerAddress()}/api/random/long?digits=${digits ?? ""}&minimum=${minimum ?? ""}&maximum=${maximum ?? ""}`,
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.Random;
  }

  async generateCharacterAsync(): Promise<string> {
    const response = await Fetcher.instance.fetchAsync({
      method: "GET",
      url: `${Configuration.getServerAddress()}/api/random/character`,
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.Random;
  }

  async generateStringAsync(length: number): Promise<string> {
    const response = await Fetcher.instance.fetchAsync({
      method: "GET",
      url: `${Configuration.getServerAddress()}/api/random/string/${length}`,
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.Random;
  }

  private static readonly secureRandomGenerator: ISecureRandomGenerator = new ServerSideSecureRandomGenerator();

  public static get instance(): ISecureRandomGenerator {
    return this.secureRandomGenerator;
  }
}
