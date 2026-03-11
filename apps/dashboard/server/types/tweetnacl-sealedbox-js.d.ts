declare module 'tweetnacl-sealedbox-js' {
  const sealedbox: {
    seal(message: Uint8Array, publicKey: Uint8Array): Uint8Array
    open(ciphertext: Uint8Array, publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array | null
    overheadLength: number
  }
  export default sealedbox
}
