import { HDWallet } from "./hdwallet";
import { BitcoinNetwork, EthereumNetwork, BitcoinNetworkProvider } from "./providers";

const xprv = 'xprv9s21ZrQH143K3DcTfKnJ5JraXKxtHjiNy7q4kKJ9cTk1otNyfp4Br1wmy8n888XXf9CjyT5xnsGWB8DQRiP2H8FsU36m7H4aVWj1pDXknmA';
const xpub = 'xpub661MyMwAqRbcFhgvmMKJSSoK5MoNhCSELLkfYhhmAoGzggi8DMNSPpGFpNaEvTMKfAhSpfJbViGapNxwrQ1eJZvFFJSYzCu53MR7Vn1STgR';

describe('HDWallet constructor', () => {

    const prvKey = Buffer.from('fdfa44b541b6d9ada1a0fc4e42548485316b5b950bd49e7fc9cd16d23f648eba', 'hex');
    const pubKey = Buffer.from('025b4a2c4f10611aba4a61ee8267d92560bc59675c40becb745f4740426c54951f', 'hex');
    const chainCode = Buffer.from('7478109c9ee538e4c32c94cb8d9c862c327f5eb3695e5cbe835a2f66c5223ae9', 'hex');
    const seed = Buffer.from('2482O9T2n3vI74989hr9mOOrP3fFNeDnbO3GyO92JAokDYS8NVg44LUU59OOR/ixRlDTOImz5+J/DL/WOdh4qQ==', 'base64');

    const identifier = '471c217fde0437b8444c9b80e91cc2ee61e8aee2';

    test('fromBase58xprv', async () => {
        let wallet = HDWallet.fromBase58(xprv);
        await actualTest(wallet);
        await expect(wallet.getPrivateKey()).toStrictEqual(prvKey);
        await expect(wallet.getPublicKey()).toStrictEqual(pubKey);
    });

    test('fromBase58xpub', async () => {
        let wallet = HDWallet.fromBase58(xpub);
        await actualTest(wallet);
        await expect(wallet.getPrivateKey()).toBeUndefined();
        await expect(wallet.getPublicKey()).toStrictEqual(pubKey);
    });

    test('fromSeed', async () => {
        let wallet = HDWallet.fromSeed(seed)
        await actualTest(wallet);
        await expect(wallet.getPrivateKey()).toStrictEqual(prvKey);
        await expect(wallet.getPublicKey()).toStrictEqual(pubKey);
    });

    test('fromPublicKey', async () => {
        let wallet = HDWallet.fromPublicKey(pubKey, chainCode);
        await actualTest(wallet);
        await expect(wallet.getPrivateKey()).toBeUndefined();
        await expect(wallet.getPublicKey()).toStrictEqual(pubKey);
    });

    test('fromPrivateKey', async () => {
        let wallet = HDWallet.fromPrivateKey(prvKey, chainCode);
        await actualTest(wallet);
        await expect(wallet.getPrivateKey()).toStrictEqual(prvKey);
        await expect(wallet.getPublicKey()).toStrictEqual(pubKey);
    });

    async function actualTest(wallet: HDWallet) {
        await expect(wallet).toBeInstanceOf(HDWallet);
        await expect(wallet.getIdentifier().toString('hex')).toStrictEqual(identifier);
    }

});

describe('HDWallet address', () => {

    const bitcoinAddress = '17UzgBoMjpq2JL1nq3jJVDRGekdJmFumm7';
    const customAddress = '2mKLCmmWY5eXa2RRo3cLFf4Z6Wt4uQk5eCk';
    const ethereumAddress = '0x3b7632ABbdCE91e020016bca9757c92fca9CCD42';

    class CustomNetworkProvider extends BitcoinNetworkProvider {
        pubKeyHash = 0xfe;
    }

    test('bitcoin', async () => {
        const wallet = HDWallet.fromBase58(xpub, BitcoinNetwork);
        await expect(wallet.getAddress().toString()).toStrictEqual(bitcoinAddress);
    });

    test('ethereum', async () => {
        const wallet = HDWallet.fromBase58(xpub, EthereumNetwork);
        await expect(wallet.getAddress().toString()).toStrictEqual(ethereumAddress);
    });

    test('custom', async () => {
        const wallet = HDWallet.fromBase58(xpub, new CustomNetworkProvider());
        await expect(wallet.getAddress().toString()).toStrictEqual(customAddress);
    });

});

describe('HDWallet derivation', async () => {
    describe('from Base58xprv Ethereum', async () => {
        derivationTest(HDWallet.fromBase58(xprv, EthereumNetwork), dirivedWalletTest(true));
    })
    describe('from Base58xpub Ethereum', async () => {
        derivationTest(HDWallet.fromBase58(xpub, EthereumNetwork), dirivedWalletTest(false));
    })
});

function dirivedWalletTest(withPrivate: boolean): (wallet: HDWallet) => Promise<void> {
    async function compareWallets(wallet1: HDWallet, wallet2: HDWallet) {
        await expect(wallet1.getChainCode()).toStrictEqual(wallet2.getChainCode());
        await expect(wallet1.getAddress()).toStrictEqual(wallet2.getAddress());
        await expect(wallet1.getIdentifier()).toStrictEqual(wallet2.getIdentifier());
        await expect(wallet1.getPrivateKey()).toStrictEqual(wallet2.getPrivateKey());
        await expect(wallet1.isNeutered()).toStrictEqual(wallet2.isNeutered());
        await expect(wallet1.getPublicKey()).toStrictEqual(wallet2.getPublicKey());
    };
    return async (wallet) => {
        let pubKey = wallet.getPublicKey();
        await expect(pubKey).toBeDefined();
        let chainCode = wallet.getChainCode();
        await expect(chainCode).toBeDefined();
        let prvKey = wallet.getPrivateKey();
        let walletbase58 = wallet.toBase58();
        if (withPrivate) {
            await expect(walletbase58.startsWith('xprv')).toBeTruthy();
            await expect(prvKey).toBeDefined();
            let prvWallet = HDWallet.fromPrivateKey(prvKey!, chainCode, EthereumNetwork);
            await expect(prvWallet.getPrivateKey()).toBeDefined();
            await compareWallets(wallet, prvWallet);
        } else {
            await expect(walletbase58.startsWith('xpub')).toBeTruthy();
            await expect(prvKey).toBeUndefined();
        }
        let pubWallet = HDWallet.fromPublicKey(pubKey, chainCode, EthereumNetwork);
        await compareWallets(wallet.toNeutered(), pubWallet);
    }
}

function derivationTest(wallet: HDWallet, subtest: (wallet: HDWallet) => Promise<void> = async () => { }) {

    test('plainDerive', async () => {
        const d0 = wallet.derive(0);
        const d1 = wallet.derive(1);
        const d2 = wallet.derive(2);
        const d3 = wallet.derive(3);
        await expect(d0.getIndex()).toStrictEqual(0);
        await expect(d0.getDepth()).toStrictEqual(1);
        await expect(d1.getIndex()).toStrictEqual(1);
        await expect(d1.getDepth()).toStrictEqual(1);
        await expect(d2.getIndex()).toStrictEqual(2);
        await expect(d2.getDepth()).toStrictEqual(1);
        await expect(d3.getIndex()).toStrictEqual(3);
        await expect(d3.getDepth()).toStrictEqual(1);
        await subtest(d0);
        await subtest(d1);
        await subtest(d2);
        await subtest(d3);
    });

    test('treeDerive', async () => {
        const d0 = wallet.derive(0);
        const d1 = d0.derive(0);
        const d2 = d1.derive(0);
        const d3 = d2.derive(0);
        await expect(d0.getIndex()).toStrictEqual(0);
        await expect(d0.getDepth()).toStrictEqual(1);
        await expect(d1.getIndex()).toStrictEqual(0);
        await expect(d1.getDepth()).toStrictEqual(2);
        await expect(d2.getIndex()).toStrictEqual(0);
        await expect(d2.getDepth()).toStrictEqual(3);
        await expect(d3.getIndex()).toStrictEqual(0);
        await expect(d3.getDepth()).toStrictEqual(4);
        await subtest(d0);
        await subtest(d1);
        await subtest(d2);
        await subtest(d3);
    });

    test('pathDerive', async () => {
        const d0 = wallet.derivePath("m/0");
        const d1 = wallet.derivePath("m/44/60/0/0");
        const d2 = wallet.derivePath("m/44/60/0/0/1");
        await expect(d0.getIdentifier()).toStrictEqual(wallet.derive(0).getIdentifier());
        await expect(d0.getIndex()).toStrictEqual(0);
        await expect(d0.getDepth()).toStrictEqual(1);
        await expect(d1.getIdentifier()).toStrictEqual(wallet.derive(44).derive(60).derive(0).derive(0).getIdentifier());
        await expect(d1.getIndex()).toStrictEqual(0);
        await expect(d1.getDepth()).toStrictEqual(4);
        await expect(d2.getIdentifier()).toStrictEqual(wallet.derive(44).derive(60).derive(0).derive(0).derive(1).getIdentifier());
        await expect(d2.getIndex()).toStrictEqual(1);
        await expect(d2.getDepth()).toStrictEqual(5);
        await subtest(d0);
        await subtest(d1);
        await subtest(d2);
    });

}

describe('HDWallet hardened derivation', () => {
    describe('from Base58xprv', async () => {

        const wallet = HDWallet.fromBase58(xprv);

        test('plainDerive', async () => {
            const d0 = wallet.derive(0, true);
            const d1 = wallet.derive(1);
            const d2 = wallet.derive(2, true);
            const d3 = wallet.derive(3);
            await expect(d0.getIndex()).toStrictEqual(2147483648 + 0);
            await expect(d0.getDepth()).toStrictEqual(1);
            await expect(d1.getIndex()).toStrictEqual(1);
            await expect(d1.getDepth()).toStrictEqual(1);
            await expect(d2.getIndex()).toStrictEqual(2147483648 + 2);
            await expect(d2.getDepth()).toStrictEqual(1);
            await expect(d3.getIndex()).toStrictEqual(3);
            await expect(d3.getDepth()).toStrictEqual(1);
        });

        test('treeDerive', async () => {
            const d0 = wallet.derive(0, true);
            const d1 = d0.derive(0);
            const d2 = d1.derive(0, true);
            const d3 = d2.derive(0);
            await expect(d0.getIndex()).toStrictEqual(2147483648 + 0);
            await expect(d0.getDepth()).toStrictEqual(1);
            await expect(d1.getIndex()).toStrictEqual(0);
            await expect(d1.getDepth()).toStrictEqual(2);
            await expect(d2.getIndex()).toStrictEqual(2147483648 + 0);
            await expect(d2.getDepth()).toStrictEqual(3);
            await expect(d3.getIndex()).toStrictEqual(0);
            await expect(d3.getDepth()).toStrictEqual(4);
        });

        test('pathDerive', async () => {
            const d0 = wallet.derivePath("m/0'");
            const d1 = wallet.derivePath("m/44'/60'/0'/0");
            const d2 = wallet.derivePath("m/44/60/0/0/1'");
            await expect(d0.getIdentifier()).toStrictEqual(wallet.derive(0, true).getIdentifier());
            await expect(d0.getIndex()).toStrictEqual(2147483648 + 0);
            await expect(d0.getDepth()).toStrictEqual(1);
            await expect(d1.getIdentifier()).toStrictEqual(wallet.derive(44, true).derive(60, true).derive(0, true).derive(0).getIdentifier());
            await expect(d1.getIndex()).toStrictEqual(0);
            await expect(d1.getDepth()).toStrictEqual(4);
            await expect(d2.getIdentifier()).toStrictEqual(wallet.derive(44).derive(60).derive(0).derive(0).derive(1, true).getIdentifier());
            await expect(d2.getIndex()).toStrictEqual(2147483648 + 1);
            await expect(d2.getDepth()).toStrictEqual(5);
        });

    });
});