import CryptoJS from "crypto-js";
import { IDeriveBytes } from "./IDeriveBytes";

export class Rfc2898DeriveBytes implements IDeriveBytes {

  private totalByteCount: number = 0;
  private totalBytesGenerated: number = 0;

  private readonly iterations: number;
  private readonly password: CryptoJS.lib.WordArray;
  private readonly salt: CryptoJS.lib.WordArray;

  constructor(password: string, salt: string, iterations: number) {
    this.password = CryptoJS.enc.Base64url.parse(password);
    this.salt = CryptoJS.enc.Base64url.parse(salt);
    this.iterations = iterations;
  }

  getBytesAsync(byteCount: number): Promise<Array<number>> {
    return new Promise<Array<number>>(resolve => {
      // const previouslyCalculatedTotalByteCount = this.totalByteCount;
      const previouslyCalculatedTotalBytesGenerated = this.totalBytesGenerated;

      this.totalByteCount += byteCount;

      const derivedBytes = CryptoJS.PBKDF2(this.password, this.salt, {
        iterations: this.iterations,
        hasher: CryptoJS.algo.SHA512,
        keySize: this.totalByteCount / 4,
      });
      const encodedDerivedBytes = derivedBytes.toString(CryptoJS.enc.Hex);
      const trimmedEncodedDerivedBytes = encodedDerivedBytes.substring(previouslyCalculatedTotalBytesGenerated, this.totalByteCount * 2);

      this.totalBytesGenerated += trimmedEncodedDerivedBytes.length;

      const trimmedDerivedBytes = CryptoJS.enc.Hex.parse(trimmedEncodedDerivedBytes).words;

      resolve(trimmedDerivedBytes);
    });
  }
}
