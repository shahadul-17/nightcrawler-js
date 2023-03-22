import CryptoJS from "crypto-js";
import { ClientSideHashProvider } from "./ClientSideHashProvider";
import { ClientSideSecureRandomGenerator } from "./ClientSideSecureRandomGenerator";
import { HashAlgorithm, SymmetricKeyedEncryptionAlgorithm } from "./Enumerations";
import { IDeriveBytes } from "./IDeriveBytes";
import { ISymmetricKeyedEncryptionProvider } from "./ISymmetricKeyedEncryptionProvider";
import { Rfc2898DeriveBytes } from "./Rfc2898DeriveBytes";

const KeyLength = 128;
const SaltLength = 64;
const BlockSize = 128;
const ByteDerivationIterations = 1024;
const DefaultHashAlgorithm = HashAlgorithm.SHA512;

export class ClientSideSymmetricKeyedEncryptionProvider implements ISymmetricKeyedEncryptionProvider {

  private constructor() { }

  private async generateSaltAsync(): Promise<string> {
    let arbitraryNumberAsString = (Date.now() % 8192).toString();

    // arbitrary number could be of odd length...
    if (arbitraryNumberAsString.length % 2 != 0) {
      arbitraryNumberAsString += await ClientSideSecureRandomGenerator.instance.generateCharacterAsync();
    }

    const randomStringLength = (SaltLength - arbitraryNumberAsString.length) / 2;
    const randomStringA = await ClientSideSecureRandomGenerator.instance.generateStringAsync(randomStringLength);
    const randomStringB = await ClientSideSecureRandomGenerator.instance.generateStringAsync(randomStringLength);
    const salt = `${randomStringA}${arbitraryNumberAsString}${randomStringB}`;

    return salt;
  }

  private async deriveKeyAndInitializationVectorAsync(key: string, salt: string, cipherHelperConfiguration: any) {
    const hashedKey = await ClientSideHashProvider.instance.computeHashAsync(key, DefaultHashAlgorithm);
    const hashedSalt = await ClientSideHashProvider.instance.computeHashAsync(salt, DefaultHashAlgorithm);
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

  async generateKeyAsync(): Promise<string> {
    const key = await ClientSideSecureRandomGenerator.instance.generateStringAsync(KeyLength);

    return key;
  }

  async encryptAsync(plaintext: string, key: string, algorithm: SymmetricKeyedEncryptionAlgorithm): Promise<string> {
    const cipherHelperConfiguration = this.getCipherHelperConfiguration(algorithm);

    if (!cipherHelperConfiguration) { throw new Error("Unsupported encryption algorithm provided."); }

    const salt = await this.generateSaltAsync();
    const { derivedKey, derivedInitializationVector, } = await this.deriveKeyAndInitializationVectorAsync(key, salt, cipherHelperConfiguration);
    const cipherParams = CryptoJS.AES.encrypt(plaintext, derivedKey, {
      iv: derivedInitializationVector,
      mode: cipherHelperConfiguration.mode,
      padding: CryptoJS.pad.Pkcs7,
    });
    const saltAsWordArray = CryptoJS.enc.Utf8.parse(salt);
    const ciphertext = CryptoJS.lib.WordArray.create()
      .concat(saltAsWordArray)
      .concat(cipherParams.ciphertext)
      .toString(CryptoJS.enc.Base64url);

    return ciphertext;
  }

  async decryptAsync(ciphertext: string, key: string, algorithm: SymmetricKeyedEncryptionAlgorithm): Promise<string> {
    const cipherHelperConfiguration = this.getCipherHelperConfiguration(algorithm);

    if (!cipherHelperConfiguration) { throw new Error("Unsupported encryption algorithm provided."); }

    let ciphertextAsWordArray = CryptoJS.enc.Base64url.parse(ciphertext);
    let ciphertextAsWords = ciphertextAsWordArray.words;
    const saltAsWords = ciphertextAsWords.slice(0, SaltLength / 4);
    const saltAsWordArray = CryptoJS.lib.WordArray.create(saltAsWords);
    const salt = saltAsWordArray.toString(CryptoJS.enc.Utf8);

    ciphertextAsWords = ciphertextAsWords.slice(saltAsWords.length);
    ciphertextAsWordArray = CryptoJS.lib.WordArray.create(ciphertextAsWords);

    const { derivedKey, derivedInitializationVector, } = await this.deriveKeyAndInitializationVectorAsync(key, salt, cipherHelperConfiguration);
    const plaintext = CryptoJS.AES.decrypt({
      ciphertext: ciphertextAsWordArray,
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
