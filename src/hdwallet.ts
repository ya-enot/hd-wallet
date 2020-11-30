import * as BIP32 from 'bip32';
import { BIP32Interface } from 'bip32';
import { NetworkProvider } from './providers/network.provider';

export class HDWallet {

    static fromBase58(key: string, network?: NetworkProvider) {
        return new this(BIP32.fromBase58(key, network), getAddressFromNetwork(network));
    }

    static fromPrivateKey(key: Buffer, chainCode: Buffer, network?: NetworkProvider) {
        return new this(BIP32.fromPrivateKey(key, chainCode, network), getAddressFromNetwork(network));
    }

    static fromPublicKey(key: Buffer, chainCode: Buffer, network?: NetworkProvider) {
        return new this(BIP32.fromPublicKey(key, chainCode, network), getAddressFromNetwork(network));
    }

    static fromSeed(seed: Buffer, network?: NetworkProvider) {
        return new this(BIP32.fromSeed(seed, network), getAddressFromNetwork(network));
    }

    private constructor(private readonly bip32: BIP32Interface, private readonly getAddressFromPubKey: (pubKey: Buffer) => Buffer) {
    }

    getIdentifier(): Buffer {
        return this.bip32!.identifier;
    }

    getPrivateKey(): Buffer | undefined {
        return this.bip32!.privateKey;
    }

    getPublicKey(): Buffer {
        return this.bip32!.publicKey;
    }

    getChainCode(): Buffer {
        return this.bip32!.chainCode;
    }

    toBase58(): string {
        return this.bip32!.toBase58();
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

    toNeutered(): HDWallet {
        return new HDWallet(this.bip32!.neutered(), this.getAddressFromPubKey);
    }

    derive(index: number, hardened = false): HDWallet {
        return new HDWallet(hardened ? this.bip32!.deriveHardened(index) : this.bip32!.derive(index), this.getAddressFromPubKey);
    }

    derivePath(path: string): HDWallet {
        return new HDWallet(this.bip32!.derivePath(path), this.getAddressFromPubKey);
    }

    getAddress(): Buffer {
        return this.getAddressFromPubKey(this.bip32.publicKey);
    }

    sign(hash: Buffer, options: SignOptions = {}): Buffer {
        return this.bip32!.sign(hash, options.lowR);
    }

    verify(hash: Buffer, signature: Buffer): boolean {
        return this.bip32!.verify(hash, signature);
    }

}

function getAddressFromNetwork(network?: NetworkProvider): (pubKey: Buffer) => Buffer {
    return network && (network as NetworkProvider).getAddress && (network as NetworkProvider).getAddress.bind(network) || (() => {
        throw new Error('Not implemented by NetworkProvider');
    });
}

interface SignOptions {
    lowR?: boolean
}