export class Platform {

  private constructor() { }

  static isNodeJS(): boolean {
    try {
      return typeof process === 'object'
        && typeof process.versions === 'object'
        && typeof process.versions.node !== 'undefined';
    } catch (error) {
      return false;
    }
  }
}
