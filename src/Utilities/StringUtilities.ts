import CryptoJS from "crypto-js";

export class StringUtilities {

  private constructor() { }

  static convertBase64ToUrlSafeBase64(base64String: string): string {
    return CryptoJS.enc.Base64.parse(base64String).toString(CryptoJS.enc.Base64url);
  }

  static convertUrlSafeBase64ToBase64(urlSafeBase64String: string): string {
    return CryptoJS.enc.Base64url.parse(urlSafeBase64String).toString(CryptoJS.enc.Base64);
  }
}
