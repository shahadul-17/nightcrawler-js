import { Configuration } from "../Configuration";
import { Fetcher } from "../Fetcher";
import { AsymmetricKeyPair } from "./AsymmetricKeyPair";
import { AsymmetricKeyedEncryptionAlgorithm } from "./Enumerations";
import { IAsymmetricKeyedEncryptionProvider } from "./IAsymmetricKeyedEncryptionProvider";

export class ServerSideAsymmetricKeyedEncryptionProvider implements IAsymmetricKeyedEncryptionProvider {

  private constructor() { }

  async deriveKeyMaterialAsync(privateKeyA: string, publicKeyB: string, algorithm: AsymmetricKeyedEncryptionAlgorithm): Promise<string> {
    const response = await Fetcher.instance.fetchAsync({
      method: "POST",
      url: `${Configuration.getServerAddress()}/api/keys/asymmetric/${algorithm}/derive`,
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
      url: `${Configuration.getServerAddress()}/api/keys/${algorithm}`,
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
      url: `${Configuration.getServerAddress()}/api/cryptography/asymmetric/${algorithm}/encrypt`,
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
      url: `${Configuration.getServerAddress()}/api/cryptography/asymmetric/${algorithm}/decrypt`,
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
