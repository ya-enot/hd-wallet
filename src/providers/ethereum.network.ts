import { NetworkProvider } from './network.provider';
const createKeccakHash = require('keccak');
const secp256k1 = require('tiny-secp256k1');
const WAValidator = require('wallet-address-validator');

export class EthereumNetworkProvider implements NetworkProvider {
    messagePrefix = '\x18Signed Message:\n';
    bip32 = {
        public: 0x0488b21e,
        private: 0x0488ade4,
    };
    eip1191ChainId?: string;
    wif = 0x60;
    getAddress(pubKey: Buffer) {
        const address = keccak256(secp256k1.pointCompress(pubKey, false)!.slice(1)).slice(-20).toString('hex');
        const prefix = this.eip1191ChainId !== undefined ? this.eip1191ChainId.toString() + '0x' : '';
        const hash = keccak256(prefix + address).toString('hex');
        let result = Buffer.from('0x' + address);
        for (let i = 2; i < result.length; i++) {
            if (parseInt(hash[i - 2], 16) >= 8 && result[i] > 96) {
                result[i] -= 32;
            }
        }
        return result;
    }
    isValidAddress(address: Buffer) {
        return WAValidator.validate(address.toString(), 'ETH');
    };
};

function keccak256(data: string | Buffer): Buffer {
    return createKeccakHash(`keccak256`)
        .update(data)
        .digest();
}

export const EthereumNetwork: NetworkProvider = new EthereumNetworkProvider();