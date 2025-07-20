declare module 'k6/http' {
  export function get(url: string, params?: any): any;
  export function post(url: string, body?: any, params?: any): any;
  export function put(url: string, body?: any, params?: any): any;
  export function del(url: string, params?: any): any;
}

declare module 'k6' {
  export function check(
    response: any,
    checks: Record<string, (r: any) => boolean>
  ): void;
  export function sleep(seconds: number): void;
}

declare module 'k6/metrics' {
  export class Rate {
    constructor(name: string);
    add(value: number): void;
  }
}
