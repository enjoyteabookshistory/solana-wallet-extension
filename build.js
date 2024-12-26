const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 删除包含敏感文件的目录
function cleanSensitiveFiles() {
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  
  const dirsToClean = [
    'public-encrypt/test',
    'public-encrypt/examples',
    'browserify-sign/test',
    'diffie-hellman/test'
  ];

  dirsToClean.forEach(dir => {
    const fullPath = path.join(nodeModulesPath, dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  });
}

// 执行构建过程
async function build() {
  try {
    // 清理之前的构建
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    
    // 清理敏感文件
    cleanSensitiveFiles();
    
    // 运行 webpack 构建
    exec('webpack --config webpack.config.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`构建错误: ${error}`);
        return;
      }
      console.log(`构建输出: ${stdout}`);
      if (stderr) {
        console.error(`构建警告: ${stderr}`);
      }
    });
  } catch (error) {
    console.error('构建过程失败:', error);
  }
}

build(); 