import { NetworkProvider } from './network.provider';
const bs58check = require('bs58check');
const createHash = require('create-hash');
const WAValidator = require('wallet-address-validator');

export class BitcoinNetworkProvider implements NetworkProvider {
    messagePrefix = '\x18Signed Message:\n';
    bech32 = 'bc';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    pubKeyHash = 0x00;
    scriptHash = 0x05;
    wif = 0x80;
    getAddress(pubKey: Buffer) {
        let hash = hash160(pubKey);
        const payload = Buffer.allocUnsafe(21);
        payload.writeUInt8(this.pubKeyHash, 0);
        hash.copy(payload, 1);
        return bs58check.encode(payload);
    }
    isValidAddress(address: Buffer) {
        return WAValidator.validate(address.toString(), 'BTC');
    };
};

function sha256(buffer: Buffer): Buffer {
    return createHash('sha256')
        .update(buffer)
        .digest();
}

function hash160(buffer: Buffer): Buffer {
    return ripemd160(sha256(buffer));
}

function ripemd160(buffer: Buffer): Buffer {
    try {
        return createHash('rmd160')
            .update(buffer)
            .digest();
    } catch (err) {
        return createHash('ripemd160')
            .update(buffer)
            .digest();
    }
}

export const BitcoinNetwork: NetworkProvider = new BitcoinNetworkProvider();