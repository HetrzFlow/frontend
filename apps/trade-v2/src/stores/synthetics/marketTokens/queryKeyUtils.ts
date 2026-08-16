export const serializeAddressSet = (addresses: readonly string[]) =>
  addresses.slice().sort().join('-');
