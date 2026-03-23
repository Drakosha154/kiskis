const fs = require('fs');

const fontPath = './public/fonts/Roboto-Regular.ttf';
const fontBase64 = fs.readFileSync(fontPath).toString('base64');

console.log('Font base64 ready:');
console.log(fontBase64);

// Сохраняем в файл
fs.writeFileSync('./src/utils/fontBase64.js', 
  `export const robotoFont = '${fontBase64}';`
);

console.log('Font saved to src/utils/fontBase64.js');