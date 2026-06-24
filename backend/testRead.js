const xlsx = require('xlsx');
const path = require('path');
const workbook = xlsx.readFile(path.join(__dirname, '../Shreeji Overseas Stock.xlsx'));
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

let products = [];
let currentProduct = null;

for(let i=1; i<data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0 || (!row[0] && !row[1] && !row[2]) || (typeof row[1] === 'string' && row[1].trim() === '')) {
    continue;
  }
  
  const col0 = row[0];
  const col1 = row[1];
  const col2 = row[2];

  const hasStock = typeof col2 === 'number';
  const hasSno = typeof col0 === 'number';

  if (!hasSno && !hasStock) {
    currentProduct = { name: String(col1).trim(), unit: 'pcs', variants: [] };
    products.push(currentProduct);
  } else if (!hasSno && hasStock) {
    currentProduct = { name: String(col1).trim(), unit: 'pcs', variants: [] };
    currentProduct.variants.push({ name: 'Original', stock: col2 });
    products.push(currentProduct);
  } else {
    if (currentProduct && col1) {
      currentProduct.variants.push({
        name: String(col1).trim(),
        stock: hasStock ? col2 : 0
      });
    }
  }
}
console.log(JSON.stringify(products, null, 2));
