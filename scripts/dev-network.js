import qrcode from 'qrcode-terminal';
import os from 'os';
const { exec } = await import('child_process');

const port = 3000;
const networkInterfaces = os.networkInterfaces();
let localIp = '';

for (const inter of Object.values(networkInterfaces)) {
  for (const details of inter) {
    if (details.family === 'IPv4' && !details.internal) {
      localIp = details.address;
      break;
    }
  }
}

if (localIp) {
  const url = `http://${localIp}:${port}`;
  console.log(`\n📱 Отсканируйте QR-код на телефоне:\n`);
  qrcode.generate(url, { small: true });
  console.log(`\nИли откройте в браузере: ${url}\n`);
}

exec(`next dev --hostname 0.0.0.0 -p ${port}`, { stdio: 'inherit' });