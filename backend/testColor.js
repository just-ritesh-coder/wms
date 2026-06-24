const xlsx = require('xlsx');
const path = require('path');
const workbook = xlsx.readFile(path.join(__dirname, '../Shreeji Overseas Stock.xlsx'), { cellStyles: true });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

for (let R = 0; R <= 20; ++R) {
  const cellAddress = {c: 1, r: R}; // Column B (index 1)
  const cellRef = xlsx.utils.encode_cell(cellAddress);
  const cell = worksheet[cellRef];
  if (cell) {
    console.log(`Row ${R+1} B:`, cell.v, cell.s ? cell.s : 'No style');
  }
}
