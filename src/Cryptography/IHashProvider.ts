import { HashAlgorithm } from './Enumerations';

export interface IHashProvider {
  computeHashAsync(message: string, algorithm: HashAlgorithm): Promise<string>;
  isMatchedAsync(message: string, preComputedHash: string, algorithm: HashAlgorithm): Promise<boolean>;
}
