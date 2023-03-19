import { AsymmetricKeyPair } from "./AsymmetricKeyPair";
import { AsymmetricKeyedEncryptionAlgorithm } from "./Enumerations";

export interface IAsymmetricKeyedEncryptionProvider {
  deriveKeyMaterialAsync(privateKeyA: string, publicKeyB: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string>;
  generateKeyPairAsync(algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<AsymmetricKeyPair>;
  encryptAsync(plaintext: string, publicKey: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string>;
  decryptAsync(ciphertext: string, privateKey: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string>;
}
