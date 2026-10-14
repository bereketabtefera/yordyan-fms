declare module 'ethiopian-date' {
  export function toEthiopian(gregorian: [number, number, number], useAmeteAlem?: boolean): [number, number, number]
  export function toGregorian(ethiopian: [number, number, number], useAmeteAlem?: boolean): [number, number, number]
}
