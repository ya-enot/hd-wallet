import * as BIP32 from 'bip32';
import { BIP32Interface } from 'bip32';
import { NetworkProvider } from './providers/network.provider';

export class HDWallet {

    private readonly bip32: BIP32Interface;
    private readonly _getAddress: (pubKey: Buffer) => Buffer;

    static fromBase58(key: string, network?: NetworkProvider) {
        return new this(BIP32.fromBase58(key, network));
    }

    static fromPrivateKey(key: Buffer, chainCode: Buffer, network?: NetworkProvider) {
        return new this(BIP32.fromPrivateKey(key, chainCode, network));
    }

    static fromPublicKey(key: Buffer, chainCode: Buffer, network?: NetworkProvider) {
        return new this(BIP32.fromPublicKey(key, chainCode, network));
    }

    static fromSeed(seed: Buffer, network?: NetworkProvider) {
        return new this(BIP32.fromSeed(seed, network));
    }

    private constructor(bip32: BIP32Interface) {
        this.bip32 = bip32!;
        this._getAddress = bip32!.network && (bip32!.network as NetworkProvider).getAddress && (bip32!.network as NetworkProvider).getAddress.bind(bip32!.network) || (() => {
            throw new Error('Not implemented by NetworkProvider');
        });
    }

    getIdentifier(): Buffer {
        return this.bip32!.identifier;
    }

    getDepth(): number {
        return this.bip32!.depth;
    }

    getIndex(): number {
        return this.bip32!.index;
    }

    isNeutered(): boolean {
        return this.bip32!.isNeutered();
    }

    derive(index: number, hardened = false): HDWallet {
        return new HDWallet(hardened ? this.bip32!.deriveHardened(index) : this.bip32!.derive(index));
    }

    derivePath(path: string): HDWallet {
        return new HDWallet(this.bip32!.derivePath(path));
    }

    neuter(): HDWallet {
        return new HDWallet(this.bip32!.neutered());
    }

    getAddress(): Buffer {
        return this._getAddress(this.bip32.publicKey);
    }

    sign(hash: Buffer, options: SignOptions = {}): Buffer {
        return this.bip32!.sign(hash, options.lowR);
    }

    verify(hash: Buffer, signature: Buffer): boolean {
        return this.bip32!.verify(hash, signature);
    }

}

interface SignOptions {
    lowR?: boolean
}