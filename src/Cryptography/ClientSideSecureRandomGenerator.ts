import { ISecureRandomGenerator } from "./ISecureRandomGenerator";

const MinimumByteValue = 0;
const MaximumByteValue = 255;

export class ClientSideSecureRandomGenerator implements ISecureRandomGenerator {

  private constructor() { }

  private generateNumberAsync(): Promise<number> {
    return new Promise<number>(resolve => {
      const randomNumber = Math.round(Math.random() * 100000000000000);

      resolve(randomNumber);
    });
  }

  private capNumberInRangeAsync(number: number, minimum: number, maximum: number): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
      try {
        if (minimum < 0) { throw new Error("Minimum must be greater than or equal to zero (0)."); }
        if (maximum < 1) { throw new Error("Maximum must be greater than or equal to one (1)."); }
        if (minimum >= maximum) { throw new Error(`Maximum (${maximum}) must be greater than minimum (${minimum}).`); }

        const randomNumber = Math.floor(number * (maximum - minimum)) + minimum;

        resolve(randomNumber);
      } catch (error) { reject(error); }
    });
  }

  private generateFixedLengthNumberAsync(number: number, digits: number): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
      try {
        if (digits < 1 || digits > 10) { throw new Error("Digits must be greater than zero (0) and less than or equal to ten (10)."); }

        let minimum = 1;
        let maximum = 9;

        for (let i = 1; i < digits; i++) {
          minimum *= 10;
          maximum = (maximum * 10) + 9;
        }

        const randomNumber = await this.capNumberInRangeAsync(number, minimum, maximum);

        resolve(randomNumber);
      } catch (error) { reject(error); }
    });
  }

  async generateByteAsync(): Promise<number> {
    let randomValue = await this.generateNumberAsync();
    randomValue = await this.capNumberInRangeAsync(randomValue, MinimumByteValue, MaximumByteValue);

    return randomValue;
  }

  async generateIntegerAsync(digits?: number, minimum?: number, maximum?: number): Promise<number> {
    let randomNumber = await this.generateNumberAsync();

    if (typeof digits === "number" && !isNaN(digits)) {
      randomNumber = await this.generateFixedLengthNumberAsync(randomNumber, digits);
    } else if (typeof minimum === "number" && !isNaN(minimum)
      && typeof maximum === "number" && !isNaN(maximum)) {
      randomNumber = await this.capNumberInRangeAsync(randomNumber, minimum, maximum);
    }

    return randomNumber;
  }

  async generateLongAsync(digits?: number, minimum?: number, maximum?: number): Promise<number> {
    throw new Error("This method is not implemented.");
  }

  async generateCharacterAsync(): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        let randomValue;
        const selection = await this.generateIntegerAsync(undefined, 0, 3);         // generates number between 0, 1 and 2...

        switch (selection) {
          case 0:
            randomValue = await this.generateIntegerAsync(undefined, 48, 58);      // 48 = '0' and 57 = '9', 58 is out of scope...

            break;
          case 1:
            randomValue = await this.generateIntegerAsync(undefined, 65, 91);      // 65 = 'A' and 90 = 'Z', 91 is out of scope...

            break;
          case 2:
            randomValue = await this.generateIntegerAsync(undefined, 97, 123);     // 97 = 'a' and 122 = 'Z', 123 is out of scope...

            break;
          default:
            randomValue = 104;                                     // assigning an arbitrary number...

            break;
        }

        const randomCharacter = String.fromCharCode(randomValue);

        resolve(randomCharacter);
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateStringAsync(length: number): Promise<string> {
    let randomString = "";

    for (let i = 0; i < length; i++) {
      const randomCharacter = await this.generateCharacterAsync();

      // appends a single character to random string...
      randomString += randomCharacter;
    }

    return randomString;
  }

  private static readonly secureRandomGenerator: ISecureRandomGenerator = new ClientSideSecureRandomGenerator();

  public static get instance(): ISecureRandomGenerator {
    return this.secureRandomGenerator;
  }
}
