import { Fetcher } from "../Fetcher";
import { AsymmetricKeyPair } from "./AsymmetricKeyPair";
import { AsymmetricKeyedEncryptionAlgorithm } from "./Enumerations";
import { IAsymmetricKeyedEncryptionProvider } from "./IAsymmetricKeyedEncryptionProvider";

const BASE_URL = "https://localhost:61915/api";

export class ServerSideAsymmetricKeyedEncryptionProvider implements IAsymmetricKeyedEncryptionProvider {

  private constructor() { }

  async deriveKeyMaterialAsync(privateKeyA: string, publicKeyB: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string> {
    const response = await Fetcher.instance.fetchAsync({
      method: "POST",
      url: `${BASE_URL}/keys/asymmetric/${algorithm}/derive`,
      body: {
        PrivateKeyA: privateKeyA,
        PublicKeyB: publicKeyB,
      },
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.DerivedKey;
  }

  async generateKeyPairAsync(algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<AsymmetricKeyPair> {
    const response = await Fetcher.instance.fetchAsync({
      method: "GET",
      url: `${BASE_URL}/keys/${algorithm}`,
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return {
      publicKey: response.Data.PublicKey,
      privateKey: response.Data.PrivateKey,
    };
  }

  async encryptAsync(plaintext: string, publicKey: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string> {
    const response = await Fetcher.instance.fetchAsync({
      method: "POST",
      url: `${BASE_URL}/cryptography/asymmetric/${algorithm}/encrypt`,
      body: {
        Plaintext: plaintext,
        PublicKey: publicKey,
      },
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.Ciphertext;
  }

  async decryptAsync(ciphertext: string, privateKey: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string> {
    const response = await Fetcher.instance.fetchAsync({
      method: "POST",
      url: `${BASE_URL}/cryptography/asymmetric/${algorithm}/decrypt`,
      body: {
        Ciphertext: ciphertext,
        PrivateKey: privateKey,
      },
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.Plaintext;
  }

  private static readonly encryptionProvider: IAsymmetricKeyedEncryptionProvider = new ServerSideAsymmetricKeyedEncryptionProvider();

  static get instance(): IAsymmetricKeyedEncryptionProvider {
    return this.encryptionProvider;
  }
}
