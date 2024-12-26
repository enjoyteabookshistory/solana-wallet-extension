import { Buffer } from 'buffer';
import * as solanaWeb3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import Decimal from 'decimal.js';

// 设置 Solana 集群配置
const SOLANA_NETWORK = 'devnet';
const COMMITMENT = 'confirmed';
const DERIVATION_PATH = "m/44'/501'/0'/0'";

// 初始化 Solana 连接配置
const connectionConfig = {
  commitment: COMMITMENT,
  httpHeaders: {
    'Content-Type': 'application/json'
  }
};

// 助记词工具函数
const walletUtils = {
  generateMnemonic: () => bip39.generateMnemonic(256),
  getKeypairFromMnemonic: async (mnemonic) => {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    const seed = await bip39.mnemonicToSeed(mnemonic);
    const derivedSeed = derivePath(DERIVATION_PATH, seed.toString('hex')).key;
    return solanaWeb3.Keypair.fromSeed(derivedSeed);
  }
};

// 添加常用代币列表
const TOKEN_LIST = {
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  // 添加其他你想要显示的代币
};

// 在导出全局变量之前添加
Decimal.set({ precision: 20, rounding: 4 }); // 设置足够的精度

// 导出全局变量
window.Buffer = Buffer;
window.solanaWeb3 = solanaWeb3;
window.splToken = splToken;
window.bip39 = bip39;
window.Decimal = Decimal;
window.SOLANA_CONFIG = {
  network: SOLANA_NETWORK,
  ...connectionConfig,
  derivationPath: DERIVATION_PATH,
  tokenList: TOKEN_LIST
};
window.walletUtils = walletUtils;

// 确保全局变量已设置
console.log('Global variables initialized:', {
  solanaWeb3: !!window.solanaWeb3,
  bip39: !!window.bip39,
  walletUtils: !!window.walletUtils,
  publicRpcEndpoints: !!window.PUBLIC_RPC_ENDPOINTS
}); 