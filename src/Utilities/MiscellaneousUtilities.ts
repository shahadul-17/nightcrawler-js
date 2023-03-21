import { Platform } from "../Platform";

export class MiscellaneousUtilities {

  private constructor() { }

  static defineWindowIfNotDefined(): void {
    // all the browsers have window object defined.
    // so, we shall only consider NodeJS runtime...
    if (Platform.isNodeJS() && typeof window === "undefined") {
      global.window = {} as any;
    }
  }
}
