import { MiscellaneousUtilities, StringUtilities } from "../Utilities";
import { AsymmetricKeyPair } from "./AsymmetricKeyPair";
import { AsymmetricKeyedEncryptionAlgorithm } from "./Enumerations";
import { IAsymmetricKeyedEncryptionProvider } from "./IAsymmetricKeyedEncryptionProvider";

export class ClientSideAsymmetricKeyedEncryptionProvider implements IAsymmetricKeyedEncryptionProvider {

  private constructor() { }

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

  private getJsEncryptAsync(algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      try {
        const cipherHelperConfiguration = this.getCipherHelperConfiguration(algorithm);

        if (!cipherHelperConfiguration) { throw new Error("Unsupported encryption algorithm provided."); }

        let JSEncrypt: any;

        MiscellaneousUtilities.defineWindowIfNotDefined();

        try {
          JSEncrypt = require("jsencrypt").JSEncrypt;

          if (typeof JSEncrypt === "undefined") { throw new Error("JSEncrypt is undefined."); }
        } catch {
          try {
            JSEncrypt = require("jsencrypt");
          } catch {
            import("jsencrypt")
              .then(value => { JSEncrypt = value; })
              .catch(() => { JSEncrypt = undefined; });
          }
        }

        if (typeof JSEncrypt === "undefined") { throw new Error("Unsupported platform detected."); }

        const jsEncrypt = new JSEncrypt({
          default_key_size: cipherHelperConfiguration.keySize.toString(),
        });

        resolve(jsEncrypt);
      } catch (error) { reject(error); }
    });
  }

  async deriveKeyMaterialAsync(privateKeyA: string, publicKeyB: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string> {
    throw new Error("This method is not implemented.");
  }

  generateKeyPairAsync(algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<AsymmetricKeyPair> {
    return new Promise<AsymmetricKeyPair>(async (resolve, reject) => {
      try {
        const cipherHelperConfiguration = this.getCipherHelperConfiguration(algorithm);

        if (!cipherHelperConfiguration) { throw new Error("Unsupported encryption algorithm provided."); }

        const jsEncrypt = await this.getJsEncryptAsync(algorithm);

        resolve({
          privateKey: StringUtilities.convertBase64ToUrlSafeBase64(jsEncrypt.getPrivateKeyB64()),
          publicKey: StringUtilities.convertBase64ToUrlSafeBase64(jsEncrypt.getPublicKeyB64()),
        });
      } catch (error) { reject(error); }
    });
  }

  encryptAsync(plaintext: string, publicKey: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        const cipherHelperConfiguration = this.getCipherHelperConfiguration(algorithm);

        if (!cipherHelperConfiguration) { throw new Error("Unsupported encryption algorithm provided."); }

        const jsEncrypt = await this.getJsEncryptAsync(algorithm);
        jsEncrypt.setPublicKey(publicKey);

        const ciphertext = jsEncrypt.encrypt(plaintext);

        if (typeof ciphertext !== "string") { throw new Error("An error occurred while performing encryption operation."); }

        resolve(StringUtilities.convertBase64ToUrlSafeBase64(ciphertext));
      } catch (error) { reject(error); }
    });
  }

  decryptAsync(ciphertext: string, privateKey: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        const cipherHelperConfiguration = this.getCipherHelperConfiguration(algorithm);

        if (!cipherHelperConfiguration) { throw new Error("Unsupported encryption algorithm provided."); }

        const jsEncrypt = await this.getJsEncryptAsync(algorithm);
        jsEncrypt.setPrivateKey(privateKey);

        const plaintext = jsEncrypt.decrypt(StringUtilities.convertUrlSafeBase64ToBase64(ciphertext));

        if (typeof plaintext !== "string") { throw new Error("An error occurred while performing decryption operation."); }

        resolve(plaintext);
      } catch (error) { reject(error); }
    });
  }

  private static readonly encryptionProvider: IAsymmetricKeyedEncryptionProvider
    = new ClientSideAsymmetricKeyedEncryptionProvider();

  static get instance(): IAsymmetricKeyedEncryptionProvider {
    return this.encryptionProvider;
  }
}
