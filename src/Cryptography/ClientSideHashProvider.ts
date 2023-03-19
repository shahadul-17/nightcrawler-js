import CryptoJS from "crypto-js";
import { HashAlgorithm } from "./Enumerations";
import { IHashProvider } from "./IHashProvider";

export class ClientSideHashProvider implements IHashProvider {

  private constructor() { }

  private getHasherHelper(algorithm: HashAlgorithm) {
    let hasherHelper;

    switch (algorithm) {
      case HashAlgorithm.MD5:
        hasherHelper = CryptoJS.MD5;

        break;
      case HashAlgorithm.SHA160:
        hasherHelper = CryptoJS.SHA1;

        break;
      case HashAlgorithm.SHA256:
        hasherHelper = CryptoJS.SHA256;

        break;
      case HashAlgorithm.SHA384:
        hasherHelper = CryptoJS.SHA384;

        break;
      case HashAlgorithm.SHA512:
        hasherHelper = CryptoJS.SHA512;

        break;
      default:
        return undefined;
    }

    return hasherHelper;
  }

  computeHashAsync(message: string, algorithm: HashAlgorithm): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        const hasherHelper = this.getHasherHelper(algorithm);

        if (!hasherHelper) { throw new Error("Unsupported hash algorithm provided."); }

        const hash = hasherHelper(message).toString(CryptoJS.enc.Base64url);

        resolve(hash);
      } catch (error) {
        reject(error);
      }
    });
  }

  async isMatchedAsync(message: string, preComputedHash: string, algorithm: HashAlgorithm): Promise<boolean> {
    const hash = await this.computeHashAsync(message, algorithm);

    return hash === preComputedHash;
  }

  private static readonly hashProvider: IHashProvider = new ClientSideHashProvider();

  public static get instance(): IHashProvider {
    return this.hashProvider;
  }
}
