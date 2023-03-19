import { Fetcher } from '../Fetcher';
import { SymmetricKeyedEncryptionAlgorithm } from './Enumerations';
import { ISymmetricKeyedEncryptionProvider } from './ISymmetricKeyedEncryptionProvider';

const BASE_URL = "https://localhost:61915/api";

export class ServerSideSymmetricKeyedEncryptionProvider implements ISymmetricKeyedEncryptionProvider {

  private constructor() { }

  async generateKeyAsync(algorithm: SymmetricKeyedEncryptionAlgorithm): Promise<string> {
    const response = await Fetcher.instance.fetchAsync({
      method: "GET",
      url: `${BASE_URL}/keys/${algorithm}`,
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.Key;
  }

  async encryptAsync(plaintext: string, key: string, algorithm: SymmetricKeyedEncryptionAlgorithm): Promise<string> {
    const response = await Fetcher.instance.fetchAsync({
      method: "POST",
      url: `${BASE_URL}/cryptography/symmetric/${algorithm}/encrypt`,
      body: {
        Plaintext: plaintext,
        Key: key,
      },
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.Ciphertext;
  }

  async decryptAsync(ciphertext: string, key: string, algorithm: SymmetricKeyedEncryptionAlgorithm): Promise<string> {
    const response = await Fetcher.instance.fetchAsync({
      method: "POST",
      url: `${BASE_URL}/cryptography/symmetric/${algorithm}/decrypt`,
      body: {
        Ciphertext: ciphertext,
        Key: key,
      },
    });

    if (response.StatusCode !== 200) { throw new Error(response.Message); }

    return response.Data.Plaintext;
  }

  private static readonly encryptionProvider: ISymmetricKeyedEncryptionProvider = new ServerSideSymmetricKeyedEncryptionProvider();

  static get instance(): ISymmetricKeyedEncryptionProvider {
    return this.encryptionProvider;
  }
}
