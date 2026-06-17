import { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Search, History, FileDown, SlidersHorizontal } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

const StockLogs = () => {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await API.get('/reports/stock-logs');
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportCSV = () => {
    const headers = ['createdAt', 'productName', 'productSku', 'type', 'quantityChanged', 'previousQuantity', 'newQuantity', 'reason', 'performedBy'];
    const displayHeaders = ['Timestamp', 'Product Name', 'SKU', 'Movement Type', 'Qty Changed', 'Previous Qty', 'New Qty', 'Reason', 'Performed By'];
    const data = filteredLogs.map(l => ({
      createdAt: new Date(l.createdAt).toLocaleString(),
      productName: l.product?.name || 'Deleted Product',
      productSku: l.product?.sku || 'N/A',
      type: l.type,
      quantityChanged: l.quantityChanged,
      previousQuantity: l.previousQuantity,
      newQuantity: l.newQuantity,
      reason: l.reason,
      performedBy: l.performedBy?.name || 'System'
    }));
    exportToCSV(headers, data, 'Stock_Activity_Logs.csv', displayHeaders);
  };

  // Filter logs client-side
  const filteredLogs = logs.filter(log => {
    const nameMatch = log.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const skuMatch = log.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const reasonMatch = log.reason?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const searchMatch = searchQuery === '' || nameMatch || skuMatch || reasonMatch;

    const typeMatch = selectedType === '' || log.type === selectedType;

    return searchMatch && typeMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Audit Trail & Stock Logs</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Complete ledger of stock adjustments, supplier purchases, customer orders, and returns</p>
        </div>

        <button onClick={handleExportCSV} className="btn btn-secondary" disabled={filteredLogs.length === 0}>
          <FileDown size={18} />
          <span>Export Logs CSV</span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', padding: '16px 24px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search logs by product name, SKU or reason..."
            style={{ paddingLeft: '38px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SlidersHorizontal size={16} style={{ color: 'var(--text-secondary)' }} />
          <select
            className="form-control"
            style={{ width: '180px' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Movements</option>
            <option value="Adjustment">Adjustment (Manual)</option>
            <option value="Sale">Sale (POS/Shop)</option>
            <option value="Purchase">Purchase (Supplier)</option>
            <option value="Return">Return</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product Detail</th>
                <th>Movement Type</th>
                <th>Qty Change</th>
                <th>Stock Level</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading audit logs...</td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map(log => {
                  const isPositive = log.quantityChanged > 0;
                  const typeColors = {
                    Adjustment: 'badge-info',
                    Sale: 'badge-danger',
                    Purchase: 'badge-success',
                    Return: 'badge-warning'
                  };

                  return (
                    <tr key={log._id}>
                      <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <History size={14} style={{ color: 'var(--text-tertiary)' }} />
                          <span>{new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </td>
                      <td>
                        {log.product ? (
                          <div>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.product.name}</p>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>SKU: {log.product.sku}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-danger)', fontStyle: 'italic' }}>Deleted Product</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${typeColors[log.type] || 'badge-info'}`}>
                          {log.type}
                        </span>
                      </td>
                      <td style={{
                        color: isPositive ? 'var(--color-success)' : 'var(--color-danger)',
                        fontWeight: 700
                      }}>
                        {isPositive ? `+${log.quantityChanged}` : log.quantityChanged}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          <p style={{ fontWeight: 600 }}>{log.newQuantity} units</p>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Prev: {log.previousQuantity}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.performedBy?.name || 'System'}</p>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Reason: {log.reason}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    No audit log records match current search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default StockLogs;
