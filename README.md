# Solana Wallet Chrome Extension

A Chrome extension wallet for Solana blockchain.

## Features

- Create new wallet
- Import existing wallet using mnemonic
- View SOL balance
- View SPL token balances (USDC, USDT)
- Send SOL and tokens
- Support for devnet and mainnet

## Installation

1. Clone the repository:
bash
git clone https://github.com/enjoyteabookshistory/solana-wallet-extension.git
cd solana-wallet-extension

2. Install dependencies:
bash
npm install

3. Build the extension:
bash
npm run build


4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from the project

## Development

- Build the project:
bash
npm run build

- Watch for changes:


## Security

This is a demonstration wallet and should not be used with large amounts of funds. Always keep your mnemonic phrase secure and never share it.

## License

MIT

Chrome 扩展基本结构:
├── manifest.json        # Chrome扩展的配置文件，定义权限和入口点
├── popup.html          # 扩展的弹出窗口界面
├── popup.js           # 弹出窗口的交互逻辑
├── background.js      # 后台服务脚本
├── dist/              # 构建后的文件目录
└── src/
    └── index.js       # 主要的业务逻辑代码