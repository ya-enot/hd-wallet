export interface NetworkProvider {
    readonly wif: number;
    readonly bip32: {
        readonly public: number;
        readonly private: number;
    };
    readonly messagePrefix?: string;
    readonly getAddress: (pubKey: Buffer) => Buffer;
    readonly isValidAddress: (address: Buffer) => boolean;
}