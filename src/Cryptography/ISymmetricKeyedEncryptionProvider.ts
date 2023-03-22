import { SymmetricKeyedEncryptionAlgorithm } from "./Enumerations";

export interface ISymmetricKeyedEncryptionProvider {
  generateKeyAsync(): Promise<string>;
  encryptAsync(plaintext: string, key: string, algorithm: SymmetricKeyedEncryptionAlgorithm): Promise<string>;
  decryptAsync(ciphertext: string, key: string, algorithm: SymmetricKeyedEncryptionAlgorithm): Promise<string>;
}
