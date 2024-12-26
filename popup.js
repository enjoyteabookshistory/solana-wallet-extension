let connection;
let wallet;

const RPC_ENDPOINTS = [
  'https://api.devnet.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
];

function initializeWallet() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 10;
    let currentEndpointIndex = 0;

    const tryNextEndpoint = async () => {
      if (currentEndpointIndex >= RPC_ENDPOINTS.length) {
        reject(new Error('All RPC endpoints failed'));
        return;
      }

      const rpcEndpoint = RPC_ENDPOINTS[currentEndpointIndex];
      console.log(`Trying RPC endpoint (${currentEndpointIndex + 1}/${RPC_ENDPOINTS.length}):`, rpcEndpoint);

      try {
        connection = new window.solanaWeb3.Connection(
          rpcEndpoint,
          {
            commitment: 'confirmed',
            disableRetryOnRateLimit: false,
            httpHeaders: {
              'Content-Type': 'application/json'
            }
          }
        );

        // 测试连接
        const version = await connection.getVersion();
        console.log('Connection successful, version:', version);
        resolve();
      } catch (error) {
        console.error(`Connection failed for endpoint ${rpcEndpoint}:`, error);
        currentEndpointIndex++;
        setTimeout(tryNextEndpoint, 500);
      }
    };

    const checkLibrary = () => {
      attempts++;
      if (typeof window.solanaWeb3 !== 'undefined') {
        tryNextEndpoint();
      } else if (attempts < maxAttempts) {
        console.log(`Attempt ${attempts}: Waiting for Solana Web3...`);
        setTimeout(checkLibrary, 100);
      } else {
        reject(new Error('Solana Web3 library failed to load'));
      }
    };

    checkLibrary();
  });
}

// Wait for both DOM and scripts to load
window.addEventListener('load', async () => {
  try {
    await initializeWallet();
    
    // 检查是否已有钱包
    chrome.storage.local.get(['mnemonic'], async function(result) {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        return;
      }
      
      if (result.mnemonic) {
        try {
          wallet = await window.walletUtils.getKeypairFromMnemonic(result.mnemonic);
          await showWalletInfo();
        } catch (error) {
          console.error('Error loading wallet:', error);
          showImportWallet();
        }
      } else {
        showImportWallet();
      }
    });

    // 添加事件监听器
    setupEventListeners();
  } catch (error) {
    console.error('Startup error:', error);
    document.body.innerHTML = `<div class="error">Failed to start wallet: ${error.message}</div>`;
  }
});

function setupEventListeners() {
  // Tab 切换
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const tabId = e.target.dataset.tab;
      switchTab(tabId);
    });
  });

  // 导入钱包
  document.getElementById('import-wallet-btn')?.addEventListener('click', importWallet);
  
  // 创建钱包
  document.getElementById('create-wallet-btn')?.addEventListener('click', createNewWallet);
  document.getElementById('confirm-mnemonic')?.addEventListener('click', confirmNewWallet);
  
  // 交易相关
  document.getElementById('send-transaction')?.addEventListener('click', showTransactionForm);
  document.getElementById('send')?.addEventListener('click', sendTransaction);
  document.getElementById('cancel')?.addEventListener('click', hideTransactionForm);
  
  // 登出
  document.getElementById('logout')?.addEventListener('click', logout);
  
  // Airdrop 按钮
  document.getElementById('request-airdrop')?.addEventListener('click', requestAirdrop);
}

async function importWallet() {
  const mnemonic = document.getElementById('mnemonic-input').value.trim();
  
  try {
    if (!window.walletUtils) {
      throw new Error('Wallet utilities not initialized');
    }

    console.log('Importing wallet with mnemonic:', mnemonic.slice(0, 10) + '...');
    
    wallet = await window.walletUtils.getKeypairFromMnemonic(mnemonic);
    console.log('Wallet imported successfully:', wallet.publicKey.toString());
    
    // 保存助记词
    await chrome.storage.local.set({ mnemonic });
    
    await showWalletInfo();
  } catch (error) {
    console.error('Import wallet error:', error);
    alert(`Failed to import wallet: ${error.message}`);
  }
}

async function createNewWallet() {
  const mnemonic = window.walletUtils.generateMnemonic();
  const mnemonicDisplay = document.querySelector('.mnemonic-display');
  mnemonicDisplay.textContent = mnemonic;
  
  document.getElementById('new-mnemonic').style.display = 'block';
  document.getElementById('create-wallet-btn').style.display = 'none';
  
  // 保存临时助记词
  window.tempMnemonic = mnemonic;
}

async function confirmNewWallet() {
  if (!window.tempMnemonic) {
    alert('Please create a new wallet first');
    return;
  }
  
  try {
    wallet = await window.walletUtils.getKeypairFromMnemonic(window.tempMnemonic);
    
    // 保存助记词
    await chrome.storage.local.set({ mnemonic: window.tempMnemonic });
    
    // 清除临时助记词
    delete window.tempMnemonic;
    
    await showWalletInfo();
  } catch (error) {
    alert(`Failed to create wallet: ${error.message}`);
  }
}

function showImportWallet() {
  document.getElementById('wallet-info').style.display = 'none';
  document.getElementById('import-wallet').style.display = 'block';
  document.getElementById('transaction-form').style.display = 'none';
}

async function logout() {
  await chrome.storage.local.remove(['mnemonic']);
  wallet = null;
  showImportWallet();
}

function switchTab(tabId) {
  // 更新按钮状态
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === tabId);
  });
  
  // 更新内容显示
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id.includes(tabId));
  });
}

async function showWalletInfo() {
  try {
    document.getElementById('import-wallet').style.display = 'none';
    document.getElementById('wallet-info').style.display = 'block';
    
    const publicKey = wallet.publicKey.toString();
    console.log('Wallet public key:', publicKey);
    document.getElementById('wallet-address').textContent = publicKey;

    // 重新初始化连接（如果需要）
    if (!connection || !connection.rpcEndpoint) {
      // 尝试所有端点
      for (const endpoint of RPC_ENDPOINTS) {
        try {
          console.log('Trying to connect to:', endpoint);
          connection = new window.solanaWeb3.Connection(endpoint, 'confirmed');
          const version = await connection.getVersion();
          console.log('Connection successful, version:', version);
          break;
        } catch (error) {
          console.error(`Failed to connect to ${endpoint}:`, error);
          continue;
        }
      }

      if (!connection) {
        throw new Error('Failed to connect to any RPC endpoint');
      }
    }

    // 获取 SOL 余额
    try {
      const balance = await connection.getBalance(wallet.publicKey);
      const solBalance = (balance / window.solanaWeb3.LAMPORTS_PER_SOL).toFixed(9);
      document.getElementById('sol-balance').textContent = `${solBalance} SOL`;
    } catch (balanceError) {
      console.error('Balance error:', balanceError);
      document.getElementById('sol-balance').textContent = '0.000000000 SOL';
    }

    // 获取代币余额
    const balancesDiv = document.getElementById('balances');
    const tokenList = {
      'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
    };

    for (const [tokenName, mintAddress] of Object.entries(tokenList)) {
      try {
        const mint = new window.solanaWeb3.PublicKey(mintAddress);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          wallet.publicKey,
          { mint }
        );

        let balance = '0.000000';
        if (tokenAccounts.value.length > 0) {
          balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmountString;
        }

        let tokenDiv = document.getElementById(`${tokenName.toLowerCase()}-balance-item`);
        if (!tokenDiv) {
          tokenDiv = document.createElement('div');
          tokenDiv.id = `${tokenName.toLowerCase()}-balance-item`;
          tokenDiv.className = 'balance-item';
          tokenDiv.innerHTML = `
            <span class="token-name">${tokenName}</span>
            <span class="token-balance" id="${tokenName.toLowerCase()}-balance"></span>
          `;
          balancesDiv.appendChild(tokenDiv);
        }
        document.getElementById(`${tokenName.toLowerCase()}-balance`).textContent = 
          `${balance} ${tokenName}`;
      } catch (tokenError) {
        console.error(`Error fetching ${tokenName} balance:`, tokenError);
        let tokenDiv = document.getElementById(`${tokenName.toLowerCase()}-balance-item`);
        if (!tokenDiv) {
          tokenDiv = document.createElement('div');
          tokenDiv.id = `${tokenName.toLowerCase()}-balance-item`;
          tokenDiv.className = 'balance-item';
          tokenDiv.innerHTML = `
            <span class="token-name">${tokenName}</span>
            <span class="token-balance" id="${tokenName.toLowerCase()}-balance"></span>
          `;
          balancesDiv.appendChild(tokenDiv);
        }
        document.getElementById(`${tokenName.toLowerCase()}-balance`).textContent = 
          `0.000000 ${tokenName}`;
      }
    }
  } catch (error) {
    console.error('Error in showWalletInfo:', error);
    document.getElementById('sol-balance').textContent = 'Error loading balance';
    throw error;
  }
}

function showTransactionForm() {
  document.getElementById('transaction-form').style.display = 'block';
}

function hideTransactionForm() {
  document.getElementById('transaction-form').style.display = 'none';
}

async function sendTransaction() {
  const recipient = document.getElementById('recipient').value;
  const amount = document.getElementById('amount').value;
  const tokenName = document.getElementById('token-select').value; // 需要添加代币选择下拉框

  try {
    if (tokenName === 'SOL') {
      // 发送 SOL
      const transaction = new window.solanaWeb3.Transaction().add(
        window.solanaWeb3.SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new window.solanaWeb3.PublicKey(recipient),
          lamports: new Decimal(amount).mul(window.solanaWeb3.LAMPORTS_PER_SOL).toFixed(0)
        })
      );

      const signature = await window.solanaWeb3.sendAndConfirmTransaction(
        connection,
        transaction,
        [wallet]
      );
    } else {
      // 发送代币
      const tokenMint = new window.solanaWeb3.PublicKey(window.SOLANA_CONFIG.tokenList[tokenName]);
      const sourceAccount = await window.splToken.getAssociatedTokenAddress(
        tokenMint,
        wallet.publicKey
      );
      const destinationAccount = await window.splToken.getAssociatedTokenAddress(
        tokenMint,
        new window.solanaWeb3.PublicKey(recipient)
      );

      const decimals = (await connection.getMint(tokenMint)).decimals;
      const tokenAmount = new Decimal(amount).mul(Math.pow(10, decimals)).toFixed(0);

      const transaction = new window.solanaWeb3.Transaction().add(
        window.splToken.createTransferInstruction(
          sourceAccount,
          destinationAccount,
          wallet.publicKey,
          BigInt(tokenAmount)
        )
      );

      const signature = await window.solanaWeb3.sendAndConfirmTransaction(
        connection,
        transaction,
        [wallet]
      );
    }

    alert(`Transaction successful! Signature: ${signature}`);
    hideTransactionForm();
    await showWalletInfo();
  } catch (error) {
    console.error('Transaction error:', error);
    alert(`Transaction failed: ${error.message}`);
  }
}

async function requestAirdrop() {
  try {
    const signature = await connection.requestAirdrop(
      wallet.publicKey,
      2 * window.solanaWeb3.LAMPORTS_PER_SOL // 请求 2 SOL
    );
    
    console.log('Airdrop requested. Signature:', signature);
    
    // 等待交易确认
    await connection.confirmTransaction(signature);
    console.log('Airdrop confirmed');
    
    // 刷新余额
    await showWalletInfo();
    
    alert('Successfully received 2 SOL!');
  } catch (error) {
    console.error('Airdrop error:', error);
    alert('Failed to request SOL: ' + error.message);
  }
} 