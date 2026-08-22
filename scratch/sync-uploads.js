import fs from 'fs';
import path from 'path';

const srcDir = './server/uploads';
const destDir = './client/public/uploads';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
let copied = 0;
for (const file of files) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (fs.statSync(src).isFile()) {
    fs.copyFileSync(src, dest);
    copied++;
  }
}
console.log('Copied ' + copied + ' images to client/public/uploads');
