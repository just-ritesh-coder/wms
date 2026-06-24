import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToPDF = (entries, title = "Ledger Passbook") => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  const tableColumn = ["Item Name", "Date", "IN (Qty)", "OUT (Qty)", "Balance", "Notes"];
  const tableRows = [];

  entries.forEach(entry => {
    const itemName = `${entry.product.name} - ${entry.variant.name}`;
    const date = format(new Date(entry.date), 'dd/MM/yyyy');
    const inQty = entry.type === 'IN' ? entry.quantity : '';
    const outQty = entry.type === 'OUT' ? entry.quantity : '';
    let notes = entry.isReversed ? '(Reversed)' : (entry.reversalOf ? '(Correction)' : '');
    if (entry.notes) notes += ` ${entry.notes}`;

    tableRows.push([itemName, date, inQty, outQty, entry.balanceAfter, notes]);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [27, 42, 30], textColor: 255 },
    columnStyles: {
      2: { halign: 'center', textColor: [0, 100, 0] },
      3: { halign: 'center', textColor: [150, 0, 0] },
      4: { halign: 'right', fontStyle: 'bold' }
    }
  });

  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportToExcel = async (entries, title = "Stock_Summary") => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Summary');

  worksheet.properties.outlineProperties = {
    summaryBelow: false,
    summaryRight: false,
  };

  worksheet.columns = [
    { header: 'Product / Variant', key: 'name', width: 40 },
    { header: 'Total Stock', key: 'stock', width: 20 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  // Calculate current stock per variant by finding the chronologically latest entry
  const variantStocks = {};
  
  entries.forEach(entry => {
    const pName = entry.product.name;
    const vName = entry.variant.name;
    const key = `${pName}|${vName}`;
    
    const entryDate = new Date(entry.date).getTime();
    const entryCreatedAt = new Date(entry.createdAt).getTime();

    if (!variantStocks[key]) {
      variantStocks[key] = { pName, vName, stock: entry.balanceAfter, date: entryDate, createdAt: entryCreatedAt };
    } else {
      // If this entry is newer chronologically, update the balance
      if (entryDate > variantStocks[key].date || (entryDate === variantStocks[key].date && entryCreatedAt > variantStocks[key].createdAt)) {
        variantStocks[key] = { pName, vName, stock: entry.balanceAfter, date: entryDate, createdAt: entryCreatedAt };
      }
    }
  });

  // Group by product
  const grouped = {};
  Object.values(variantStocks).forEach(v => {
    if (!grouped[v.pName]) grouped[v.pName] = { total: 0, variants: [] };
    grouped[v.pName].total += v.stock;
    grouped[v.pName].variants.push(v);
  });

  // Write rows
  Object.entries(grouped).forEach(([pName, data]) => {
    // Parent Row (Product)
    const pRow = worksheet.addRow({ name: pName, stock: data.total });
    pRow.font = { bold: true };
    pRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };

    // Child Rows (Variants)
    data.variants.forEach(v => {
      const vRow = worksheet.addRow({ name: `  ${v.vName}`, stock: v.stock });
      vRow.outlineLevel = 1;
      vRow.hidden = true;
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${title.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

export const exportLedgerExcel = async (entries, title = "Ledger_Passbook") => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ledger');

  worksheet.properties.outlineProperties = {
    summaryBelow: false,
    summaryRight: false,
  };

  worksheet.columns = [
    { header: 'Product / Variant / Date', key: 'name', width: 40 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'IN (Qty)', key: 'in', width: 10 },
    { header: 'OUT (Qty)', key: 'out', width: 10 },
    { header: 'Balance', key: 'balance', width: 15 },
    { header: 'Status / Notes', key: 'notes', width: 40 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  const grouped = {};
  entries.forEach(entry => {
    const pName = entry.product.name;
    const vName = entry.variant.name;
    if (!grouped[pName]) grouped[pName] = {};
    if (!grouped[pName][vName]) grouped[pName][vName] = [];
    grouped[pName][vName].push(entry);
  });

  Object.entries(grouped).forEach(([pName, variants]) => {
    const pRow = worksheet.addRow({ name: pName });
    pRow.font = { bold: true };
    pRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };

    Object.entries(variants).forEach(([vName, txns]) => {
      const vRow = worksheet.addRow({ name: `  ${vName}` });
      vRow.font = { bold: true, italic: true };
      vRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      vRow.outlineLevel = 1;
      vRow.hidden = true; // Collapse by default

      txns.forEach(entry => {
        let statusNotes = entry.isReversed ? 'Reversed' : (entry.reversalOf ? 'Correction' : '');
        if (entry.notes) statusNotes += (statusNotes ? ' - ' : '') + entry.notes;

        const tRow = worksheet.addRow({
          name: `    ${format(new Date(entry.date), 'dd/MM/yyyy')}`,
          type: entry.type,
          in: entry.type === 'IN' ? entry.quantity : '',
          out: entry.type === 'OUT' ? entry.quantity : '',
          balance: entry.balanceAfter,
          notes: statusNotes
        });
        tRow.outlineLevel = 2;
        tRow.hidden = true; // Collapse by default
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${title.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

export const exportInventoryExcel = async (groupedInventory, title = "Inventory_Stock") => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventory');

  // Force outline summary below to false (so collapse +/- button is on top parent row)
  worksheet.properties.outlineProperties = {
    summaryBelow: false,
    summaryRight: false,
  };

  // Add Headers
  worksheet.columns = [
    { header: 'Product / Variant', key: 'name', width: 40 },
    { header: 'Total Stock', key: 'stock', width: 20 },
    { header: 'Estimated Value', key: 'value', width: 20 },
  ];

  // Make header row bold
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  Object.values(groupedInventory).forEach(group => {
    const totalStock = group.variants.reduce((sum, v) => sum + v.currentStock, 0);
    const totalValue = group.variants.reduce((sum, v) => sum + v.totalValue, 0);

    // Parent Row (Product)
    const parentRow = worksheet.addRow({
      name: group.product.name,
      stock: totalStock,
      value: totalValue // keeping it number for Excel
    });
    
    parentRow.font = { bold: true };
    parentRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' } // Excel yellow
    };

    // Child Rows (Variants)
    group.variants.forEach(v => {
      const childRow = worksheet.addRow({
        name: `  ${v.variant.name}`,
        stock: v.currentStock,
        value: v.totalValue
      });
      childRow.outlineLevel = 1; // This makes it a child row that can be collapsed
      childRow.hidden = true;
    });
  });

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${title.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};
