declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  }
  export const env: Env;
}

// Satisfy editor for web globals
declare var fetch: any;
declare var Request: any;
declare var Response: any;
