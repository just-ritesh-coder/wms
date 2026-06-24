import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import { Download, RefreshCw } from 'lucide-react';

export default function FinancialReport() {
  const [reportData, setReportData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear() - 1); // Default to previous year for full report usually
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/reports/financial-year?year=${year}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setReportData(res.data);
    } catch (err) {
      console.error('Error fetching financial report:', err);
      alert('Failed to fetch financial report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchReport();
    }
  }, [user, year]);

  const exportReport = () => {
    if (reportData.length === 0) return alert('No data to export');

    const worksheetData = reportData.map(row => ({
      "Product": row.variant.product.name,
      "Variant": row.variant.name,
      "Opening Balance (Apr 1)": row.openingBalance,
      "Total IN": row.totalIn,
      "Total OUT": row.totalOut,
      "Closing Balance (Mar 31)": row.closingBalance,
      "Closing Value (Estimated)": row.totalValue.toFixed(2)
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `FY_${year}-${year+1}`);

    const wscols = [
      { wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 25 }
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Financial_Report_FY_${year}-${year+1}.xlsx`);
  };

  const years = Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Financial Year Report</h2>
          <p className="text-sm opacity-70 mt-1">April 1st, {year} - March 31st, {year + 1}</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <select 
            value={year} 
            onChange={e => setYear(parseInt(e.target.value))}
            className="p-2 border rounded-sm focus:outline-none"
            style={{ borderColor: 'var(--color-border-main)' }}
          >
            {years.map(y => (
              <option key={y} value={y}>FY {y}-{y+1}</option>
            ))}
          </select>
          
          <button 
            onClick={fetchReport}
            className="flex items-center gap-2 px-3 py-2 border rounded-sm hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--color-border-main)' }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          
          <button 
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-sm hover:opacity-90 transition-colors"
            style={{ backgroundColor: 'var(--color-primary-dark)' }}
          >
            <Download size={16} /> Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-sm shadow-sm overflow-x-auto" style={{ borderColor: 'var(--color-border-main)' }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-sm" style={{ borderColor: 'var(--color-border-main)' }}>
              <th className="p-4 font-semibold text-gray-600">Product - Variant</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Opening Bal. (Apr 1)</th>
              <th className="p-4 font-semibold text-green-600 text-right">Total IN</th>
              <th className="p-4 font-semibold text-red-600 text-right">Total OUT</th>
              <th className="p-4 font-semibold text-gray-800 text-right">Closing Bal. (Mar 31)</th>
              <th className="p-4 font-semibold text-gray-800 text-right">Closing Value</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <td className="p-4">
                  <div className="font-medium">{row.variant.product.name}</div>
                  <div className="text-xs opacity-70">{row.variant.name}</div>
                </td>
                <td className="p-4 text-right font-medium text-gray-600">{row.openingBalance}</td>
                <td className="p-4 text-right font-medium text-green-600">{row.totalIn}</td>
                <td className="p-4 text-right font-medium text-red-600">{row.totalOut}</td>
                <td className="p-4 text-right font-bold" style={{ color: 'var(--color-primary-dark)' }}>{row.closingBalance}</td>
                <td className="p-4 text-right text-sm">₹{row.totalValue.toLocaleString()}</td>
              </tr>
            ))}
            {reportData.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">No activity or stock found for this financial year.</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">Generating report...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
