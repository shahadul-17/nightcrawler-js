import CryptoJS from "crypto-js";
import JSEncrypt from "jsencrypt";
import { AsymmetricKeyPair } from "./AsymmetricKeyPair";
import { AsymmetricKeyedEncryptionAlgorithm } from "./Enumerations";
import { IAsymmetricKeyedEncryptionProvider } from "./IAsymmetricKeyedEncryptionProvider";

export class ClientSideAsymmetricKeyedEncryptionProvider implements IAsymmetricKeyedEncryptionProvider {

  private constructor() { }

  async deriveKeyMaterialAsync(privateKeyA: string, publicKeyB: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string> {
    throw new Error("This method is not implemented.");
  }

  generateKeyPairAsync(algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<AsymmetricKeyPair> {
    return new Promise<AsymmetricKeyPair>((resolve, reject) => {
      try {
        const cipherHelperConfiguration = this.getCipherHelperConfiguration(algorithm);

        if (!cipherHelperConfiguration) { throw new Error("Unsupported encryption algorithm provided."); }

        const jsEncrypt = new JSEncrypt({
          default_key_size: cipherHelperConfiguration.keySize.toString(),
        });

        resolve({
          privateKey: CryptoJS.enc.Base64.parse(jsEncrypt.getPrivateKeyB64()).toString(CryptoJS.enc.Base64url),
          publicKey: CryptoJS.enc.Base64.parse(jsEncrypt.getPublicKeyB64()).toString(CryptoJS.enc.Base64url),
        });
      } catch (error) { reject(error); }
    });
  }

  private getCipherHelperConfiguration(algorithm: AsymmetricKeyedEncryptionAlgorithm) {
    const configuration = { keySize: 1024, };

    switch (algorithm) {
      case AsymmetricKeyedEncryptionAlgorithm.RSA1024:
        configuration.keySize = 1024;

        break;
      case AsymmetricKeyedEncryptionAlgorithm.RSA2048:
        configuration.keySize = 2048;

        break;
      case AsymmetricKeyedEncryptionAlgorithm.RSA4096:
        configuration.keySize = 4096;

        break;
      default:
        return undefined;
    }

    return configuration;
  }

  encryptAsync(plaintext: string, publicKey: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        const cipherHelperConfiguration = this.getCipherHelperConfiguration(algorithm);

        if (!cipherHelperConfiguration) { throw new Error("Unsupported encryption algorithm provided."); }

        const jsEncrypt = new JSEncrypt({
          default_key_size: cipherHelperConfiguration.keySize.toString(),
        });
        jsEncrypt.setPublicKey(publicKey);

        const ciphertext = jsEncrypt.encrypt(plaintext);

        if (typeof ciphertext !== "string") { throw new Error("An error occurred while performing encryption operation."); }

        resolve(CryptoJS.enc.Base64.parse(ciphertext).toString(CryptoJS.enc.Base64url));
      } catch (error) { reject(error); }
    });
  }

  decryptAsync(ciphertext: string, privateKey: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        const cipherHelperConfiguration = this.getCipherHelperConfiguration(algorithm);

        if (!cipherHelperConfiguration) { throw new Error("Unsupported encryption algorithm provided."); }

        const jsEncrypt = new JSEncrypt({
          default_key_size: cipherHelperConfiguration.keySize.toString(),
        });
        jsEncrypt.setPrivateKey(privateKey);

        const plaintext = jsEncrypt.decrypt(CryptoJS.enc.Base64url.parse(ciphertext).toString(CryptoJS.enc.Base64));

        if (typeof plaintext !== "string") { throw new Error("An error occurred while performing decryption operation."); }

        resolve(plaintext);
      } catch (error) { reject(error); }
    });
  }

  private static readonly encryptionProvider: IAsymmetricKeyedEncryptionProvider = new ClientSideAsymmetricKeyedEncryptionProvider();

  static get instance(): IAsymmetricKeyedEncryptionProvider {
    return this.encryptionProvider;
  }
}
