import CryptoJS from "crypto-js";
import { KeyedHashAlgorithm } from "./Enumerations";
import { IKeyedHashProvider } from "./IKeyedHashProvider";

export class ClientSideKeyedHashProvider implements IKeyedHashProvider {

  private constructor() { }

  private getHmacHasherHelper(algorithm: KeyedHashAlgorithm) {
    let hmacHasherHelper;

    switch (algorithm) {
      case KeyedHashAlgorithm.HMACMD5:
        hmacHasherHelper = CryptoJS.HmacMD5;

        break;
      case KeyedHashAlgorithm.HMACSHA160:
        hmacHasherHelper = CryptoJS.HmacSHA1;

        break;
      case KeyedHashAlgorithm.HMACSHA256:
        hmacHasherHelper = CryptoJS.HmacSHA256;

        break;
      case KeyedHashAlgorithm.HMACSHA384:
        hmacHasherHelper = CryptoJS.HmacSHA384;

        break;
      case KeyedHashAlgorithm.HMACSHA512:
        hmacHasherHelper = CryptoJS.HmacSHA512;

        break;
      default:
        return undefined;
    }

    return hmacHasherHelper;
  }

  computeHashAsync(message: string, key: string, algorithm: KeyedHashAlgorithm): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        const hmacHasherHelper = this.getHmacHasherHelper(algorithm);

        if (!hmacHasherHelper) { throw new Error("Unsupported keyed hash algorithm provided."); }

        const hash = hmacHasherHelper(message, key).toString(CryptoJS.enc.Base64url);

        resolve(hash);
      } catch (error) {
        reject(error);
      }
    });
  }

  async isMatchedAsync(message: string, key: string, preComputedHash: string, algorithm: KeyedHashAlgorithm): Promise<boolean> {
    const hash = await this.computeHashAsync(message, key, algorithm);

    return hash === preComputedHash;
  }

  private static readonly keyedHashProvider: IKeyedHashProvider = new ClientSideKeyedHashProvider();

  public static get instance(): IKeyedHashProvider {
    return this.keyedHashProvider;
  }
}
