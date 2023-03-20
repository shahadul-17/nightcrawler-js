export class Platform {

  private constructor() { }

  static isNodeJS(): boolean {
    try {
      const fileSystem = require("fs");

      return fileSystem && typeof fileSystem.existsSync === "function";
    } catch (error) {
      return false;
    }
  }
}
