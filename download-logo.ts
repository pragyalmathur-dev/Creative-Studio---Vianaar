import fs from 'fs';
import https from 'https';
import path from 'path';

const url = 'https://www.vianaar.com/assets/images/logo-white.png';
const targetDir = './public/assets';
const targetPath = path.join(targetDir, 'vianaar-logo.png');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to get '${url}' (${res.statusCode})`);
    return;
  }

  const filePath = fs.createWriteStream(targetPath);
  res.pipe(filePath);
  
  filePath.on('finish', () => {
    filePath.close();
    console.log('Logo download completed successfully.');
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('Error downloading logo:', err.message);
  process.exit(1);
});
