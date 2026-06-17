import { useEffect, useState } from 'react';
import API from '../services/api';
import {
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  DollarSign,
  Activity,
  ShoppingCart,
  Percent,
  Clock,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

const COLORS = ['#0284c7', '#10b981', '#0ea5e9', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryPeriod, setSummaryPeriod] = useState('monthly'); // daily, weekly, monthly

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, trendRes, analyticsRes] = await Promise.all([
          API.get('/reports/dashboard'),
          API.get('/reports/sales-revenue'),
          API.get('/reports/analytics-summary')
        ]);
        
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (trendRes.data.success) {
          setTrendData(trendRes.data.data);
        }
        if (analyticsRes.data.success) {
          setAnalytics(analyticsRes.data.data);
        }
      } catch (err) {
        setError('Failed to fetch dashboard metrics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading analytics panel...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--color-danger)', textAlign: 'center', padding: '40px' }}>{error}</div>;
  }

  const { metrics, recentSales, recentActivity } = stats;
  const { salesSummary, bestSellers, supplierAnalytics, depletionPredictions } = analytics;

  // Selected period metrics
  const activeSummary = salesSummary[summaryPeriod] || { revenue: 0, profit: 0, count: 0 };
  const marginPercentage = activeSummary.revenue > 0 
    ? ((activeSummary.profit / activeSummary.revenue) * 100).toFixed(1) 
    : '0.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Summary Period Tabs & Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Financial Performance Analytics</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live sales, net profit margins, and inventory performance tracking</p>
          </div>
          <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setSummaryPeriod(p)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textTransform: 'capitalize',
                  backgroundColor: summaryPeriod === p ? 'var(--bg-secondary)' : 'transparent',
                  color: summaryPeriod === p ? 'var(--color-primary)' : 'var(--text-secondary)',
                  boxShadow: summaryPeriod === p ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid-4">
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(2, 132, 199, 0.15)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Revenue</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>
                ${activeSummary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Net Profit</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: 'var(--color-success)' }}>
                ${activeSummary.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)', borderRadius: 'var(--radius-md)' }}>
              <Percent size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Profit Margin</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: 'var(--color-info)' }}>
                {marginPercentage}%
              </h3>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', borderRadius: 'var(--radius-md)' }}>
              <ShoppingCart size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sales Orders</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>
                {activeSummary.count} Transactions
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations */}
      <div className="grid-2">
        
        {/* Sales Revenue Trend Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Sales Revenue Trend (Past 7 Days)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Daily income recorded from customer checkouts</p>
          </div>
          
          <div style={{ width: '100%', height: 300 }}>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-tertiary)" style={{ fontSize: '11px' }} />
                  <YAxis stroke="var(--text-tertiary)" style={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', height: '100%' }}>
                <p style={{ width: '100%', textAlign: 'center', color: 'var(--text-tertiary)' }}>No sales transactions recorded recently.</p>
              </div>
            )}
          </div>
        </div>

        {/* Best Selling Products Bar Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Best Selling Products</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Top items ranked by sales volume</p>
          </div>

          <div style={{ width: '100%', height: 300 }}>
            {bestSellers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="sku" stroke="var(--text-tertiary)" style={{ fontSize: '11px' }} />
                  <YAxis stroke="var(--text-tertiary)" style={{ fontSize: '11px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    formatter={(value, name) => [value, name === 'quantitySold' ? 'Units Sold' : 'Revenue ($)']}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="quantitySold" name="Units Sold" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', height: '100%' }}>
                <p style={{ width: '100%', textAlign: 'center', color: 'var(--text-tertiary)' }}>No product sales recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Supplier Analytics & Depletion Risk Sections */}
      <div className="grid-2">
        
        {/* Supplier Cost Distribution Pie Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Supplier Cost Share</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Percentage distribution of restock expenses</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
            {supplierAnalytics.length > 0 ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, height: '100%', minWidth: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={supplierAnalytics}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="totalSpend"
                      >
                        {supplierAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                  {supplierAnalytics.map((entry, index) => (
                    <div key={entry._id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{entry.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>(${entry.totalSpend.toLocaleString()})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)' }}>No supplier purchases completed.</p>
            )}
          </div>
        </div>

        {/* Depletion Risk Forecasting Warnings */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Depletion Risk Watchlist</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Forecasted stock depletion timeframe based on 30-day velocity</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '260px' }}>
            {depletionPredictions.length > 0 ? (
              depletionPredictions.map(prod => {
                const isUrgent = prod.daysToDepletion <= 3;
                return (
                  <div key={prod.productId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isUrgent ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                    border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                  }}>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{prod.name}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: {prod.sku} | Daily Velocity: {prod.dailySalesRate} units</span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className={`badge ${isUrgent ? 'badge-danger' : 'badge-warning'}`}>
                        {prod.daysToDepletion === 1 ? 'Out tomorrow' : `Out in ${prod.daysToDepletion} days`}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Qty: {prod.quantity}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={36} style={{ color: 'var(--color-success)', opacity: 0.6 }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>No immediate depletion risks detected.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Supplier Active POs Table & Recent System Activity */}
      <div className="grid-2">
        {/* Supplier Active POs Table */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Restocking Order Backlog</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Spend ($)</th>
                  <th style={{ textAlign: 'right' }}>Active POs</th>
                </tr>
              </thead>
              <tbody>
                {supplierAnalytics.length > 0 ? (
                  supplierAnalytics.map(sup => (
                    <tr key={sup._id}>
                      <td style={{ fontWeight: 600 }}>{sup.name}</td>
                      <td>${sup.totalSpend.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge ${sup.activeOrdersCount > 0 ? 'badge-warning' : 'badge-success'}`}>
                          {sup.activeOrdersCount} Pending
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No supplier entries recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Sales Receipts</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length > 0 ? (
                  recentSales.map(sale => (
                    <tr key={sale._id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{sale.invoiceNumber}</td>
                      <td>{sale.customerName}</td>
                      <td>${sale.totalAmount.toLocaleString()}</td>
                      <td>
                        <span className="badge badge-info">{sale.paymentMethod}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No sales invoices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
