import { KeyedHashAlgorithm } from './Enumerations';

export interface IKeyedHashProvider {
  computeHashAsync(message: string, key: string, algorithm: KeyedHashAlgorithm): Promise<string>;
  isMatchedAsync(message: string, key: string, preComputedHash: string, algorithm: KeyedHashAlgorithm): Promise<boolean>;
}
