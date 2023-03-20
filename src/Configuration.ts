export class Configuration {

  private static readonly configuration = new Map<string, any>();

  static get(key: string): any {
    return this.configuration.get(key);
  }

  static set(key: string, value: any) {
    this.configuration.set(key, value);
  }

  static getServerAddress(): string {
    const serverAddress = this.get("serverAddress");

    if (typeof serverAddress !== "string") { return ""; }

    return serverAddress;
  }

  static setServerAddress(serverAddress: string): void {
    this.set("serverAddress", serverAddress);
  }

  static isInsecureHttpsRequestsAllowed(): boolean {
    try {
      return process.env["NODE_TLS_REJECT_UNAUTHORIZED"] === "0";
    } catch { }

    return false;
  }

  static allowInsecureHttpsRequests(shallAllow: boolean): void {
    try {
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = shallAllow === true ? "0" : "1";
    } catch { }
  }
}
