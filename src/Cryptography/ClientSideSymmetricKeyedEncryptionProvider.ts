import CryptoJS from "crypto-js";
import { Configuration } from "../Configuration";
import { ClientSideKeyedHashProvider } from "./ClientSideKeyedHashProvider";
import { KeyedHashAlgorithm, SymmetricKeyedEncryptionAlgorithm } from "./Enumerations";
import { IDeriveBytes } from "./IDeriveBytes";
import { ISymmetricKeyedEncryptionProvider } from "./ISymmetricKeyedEncryptionProvider";
import { Rfc2898DeriveBytes } from "./Rfc2898DeriveBytes";

const BlockSize = 128;
const ByteDerivationIterations = 1024;

export class ClientSideSymmetricKeyedEncryptionProvider implements ISymmetricKeyedEncryptionProvider {

  private constructor() {
    Configuration.set("symmetricKeyedEncryptionProviderKeyAndInitializationVectorDerivationSecretKey",
      "3a2360922b3db011394c27e3c7871339ffaaba72f85e6f25a245b772a9d079c6b8f38267de7472c92f219aa5c9173fece5f51e0ef11bc22dcf4e2e7f0a173fce");
    Configuration.set("symmetricKeyedEncryptionProviderSalt",
      "f0a3021df20b94a868fccd058d26f7e0579db0e7552c5ded4b919139f3a6c1df852769382527ad37aaa6c4bbd4b64e38142d019a0c4816d74a881374b2acad58");
  }

  private async deriveKeyAndInitializationVectorAsync(key: string, cipherHelperConfiguration: any) {
    const hashedKey = await ClientSideKeyedHashProvider.instance.computeHashAsync(key,
      Configuration.get("symmetricKeyedEncryptionProviderKeyAndInitializationVectorDerivationSecretKey") as string,
      KeyedHashAlgorithm.HMACSHA512);
    const hashedSalt = await ClientSideKeyedHashProvider.instance.computeHashAsync(
      Configuration.get("symmetricKeyedEncryptionProviderSalt"),
      Configuration.get("symmetricKeyedEncryptionProviderKeyAndInitializationVectorDerivationSecretKey") as string,
      KeyedHashAlgorithm.HMACSHA512);
    const deriveBytes: IDeriveBytes = new Rfc2898DeriveBytes(hashedKey, hashedSalt, ByteDerivationIterations);
    const derivedKey = await deriveBytes.getBytesAsync(cipherHelperConfiguration.keySize / 8);
    const derivedInitializationVector = await deriveBytes.getBytesAsync(BlockSize / 8);
    const derivedKeyAndInitializationVector = {
      derivedKey: CryptoJS.lib.WordArray.create(derivedKey),
      derivedInitializationVector: CryptoJS.lib.WordArray.create(derivedInitializationVector),
    };

    return derivedKeyAndInitializationVector;
  }

  private getCipherHelperConfiguration(algorithm: SymmetricKeyedEncryptionAlgorithm) {
    const configuration = {
      keySize: 256,
      mode: CryptoJS.mode.CBC,
    };

    switch (algorithm) {
      case SymmetricKeyedEncryptionAlgorithm.AESCBC128:
        configuration.keySize = 128;
        configuration.mode = CryptoJS.mode.CBC;

        break;
      case SymmetricKeyedEncryptionAlgorithm.AESECB128:
        configuration.keySize = 128;
        configuration.mode = CryptoJS.mode.ECB;

        break;
      case SymmetricKeyedEncryptionAlgorithm.AESCBC192:
        configuration.keySize = 192;
        configuration.mode = CryptoJS.mode.CBC;

        break;
      case SymmetricKeyedEncryptionAlgorithm.AESECB192:
        configuration.keySize = 192;
        configuration.mode = CryptoJS.mode.ECB;

        break;
      case SymmetricKeyedEncryptionAlgorithm.AESCBC256:
        configuration.keySize = 256;
        configuration.mode = CryptoJS.mode.CBC;

        break;
      case SymmetricKeyedEncryptionAlgorithm.AESECB256:
        configuration.keySize = 256;
        configuration.mode = CryptoJS.mode.ECB;

        break;
      default:
        return undefined;
    }

    return configuration;
  }

  async generateKeyAsync(algorithm: SymmetricKeyedEncryptionAlgorithm): Promise<string> {
    throw new Error("This method is not implemented.");
  }

  async encryptAsync(plaintext: string, key: string, algorithm: SymmetricKeyedEncryptionAlgorithm): Promise<string> {
    const cipherHelperConfiguration = this.getCipherHelperConfiguration(algorithm);

    if (!cipherHelperConfiguration) { throw new Error("Unsupported encryption algorithm provided."); }

    const { derivedKey, derivedInitializationVector, } = await this.deriveKeyAndInitializationVectorAsync(key, cipherHelperConfiguration);
    const cipherParams = CryptoJS.AES.encrypt(plaintext, derivedKey, {
      iv: derivedInitializationVector,
      mode: cipherHelperConfiguration.mode,
      padding: CryptoJS.pad.Pkcs7,
    });
    const ciphertext = cipherParams.ciphertext.toString(CryptoJS.enc.Base64url);

    return ciphertext;
  }

  async decryptAsync(ciphertext: string, key: string, algorithm: SymmetricKeyedEncryptionAlgorithm): Promise<string> {
    const cipherHelperConfiguration = this.getCipherHelperConfiguration(algorithm);

    if (!cipherHelperConfiguration) { throw new Error("Unsupported encryption algorithm provided."); }

    const { derivedKey, derivedInitializationVector, } = await this.deriveKeyAndInitializationVectorAsync(key, cipherHelperConfiguration);
    const plaintext = CryptoJS.AES.decrypt({
      ciphertext: CryptoJS.enc.Base64url.parse(ciphertext),
      iv: derivedInitializationVector,
      key: derivedKey,
      padding: CryptoJS.pad.Pkcs7,
      blockSize: BlockSize,
      mode: cipherHelperConfiguration.mode as any,
      algorithm: undefined as any,
      formatter: undefined as any,
      salt: undefined as any,
    }, derivedKey, { iv: derivedInitializationVector, }).toString(CryptoJS.enc.Utf8);

    return plaintext;
  }

  private static readonly encryptionProvider: ISymmetricKeyedEncryptionProvider = new ClientSideSymmetricKeyedEncryptionProvider();

  static get instance(): ISymmetricKeyedEncryptionProvider {
    return this.encryptionProvider;
  }
}
