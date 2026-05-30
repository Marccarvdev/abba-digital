const fs = require('fs');
const path = require('path');

function cleanFolder(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      cleanFolder(fullPath);
    } else {
      // Check for double extensions
      const ext = path.extname(file); // e.g. .avif or .svg
      const nameWithoutExt = path.basename(file, ext);
      const secondExt = path.extname(nameWithoutExt); // check if there's a second extension like .avif or .svg
      if (secondExt === ext) {
        const newName = nameWithoutExt;
        const newFullPath = path.join(dirPath, newName);
        console.log(`Renaming: ${file} -> ${newName}`);
        fs.renameSync(fullPath, newFullPath);
      }
    }
  });
}

const publicDir = path.join(__dirname, '..', 'public');
console.log('Cleaning double extensions in:', publicDir);
cleanFolder(publicDir);
console.log('Done!');
