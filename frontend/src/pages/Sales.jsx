import { useEffect, useState } from 'react';
import API from '../services/api';
import confetti from 'canvas-confetti';
import { Search, Plus, Minus, Trash2, ShoppingCart, Check, Printer, X, Package } from 'lucide-react';

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Checkout response
  const [invoice, setInvoice] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddToCart = (prod) => {
    if (prod.quantity === 0) {
      alert('This product is currently out of stock!');
      return;
    }

    const exists = cart.find(item => item.product === prod._id);
    if (exists) {
      if (exists.quantity >= prod.quantity) {
        alert(`Cannot add more. Only ${prod.quantity} units are in stock.`);
        return;
      }
      setCart(cart.map(item =>
        item.product === prod._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product: prod._id,
        name: prod.name,
        sku: prod.sku,
        sellingPrice: prod.sellingPrice,
        stockAvailable: prod.quantity,
        quantity: 1
      }]);
    }
  };

  const handleUpdateCartQty = (prodId, change) => {
    const updated = cart.map(item => {
      if (item.product === prodId) {
        const newQty = item.quantity + change;
        if (newQty <= 0) return null;
        if (newQty > item.stockAvailable) {
          alert(`Cannot exceed available stock limit (${item.stockAvailable}).`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean);
    setCart(updated);
  };

  const handleRemoveFromCart = (prodId) => {
    setCart(cart.filter(item => item.product !== prodId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const taxVal = Number(tax || 0);
  const discountVal = Number(discount || 0);
  const total = Math.max(0, subtotal + taxVal - discountVal);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Please add products to your cart before checking out.');
      return;
    }

    const payload = {
      customerName,
      items: cart.map(item => ({
        product: item.product,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice
      })),
      taxAmount: taxVal,
      discountAmount: discountVal,
      paymentMethod
    };

    try {
      const res = await API.post('/orders/sales', payload);
      if (res.data.success) {
        // Confetti burst for pleasant UX
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Set Invoice detail
        setInvoice(res.data.data);
        setReceiptItems(cart);
        setIsReceiptOpen(true);

        // Reset POS fields
        setCart([]);
        setCustomerName('Walk-in Customer');
        setDiscount('0');
        setTax('0');
        setPaymentMethod('Cash');
        
        // Refresh product counts
        fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout process encountered an error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter products by search text
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', height: 'calc(100vh - 120px)' }}>
      
      {/* LEFT PANEL: PRODUCT SELECTOR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'hidden' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search catalog by SKU or product name..."
            style={{ paddingLeft: '38px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Loading catalog...</div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(prod => {
                const outOfStock = prod.quantity === 0;
                return (
                  <button
                    key={prod._id}
                    onClick={() => handleAddToCart(prod)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'row',
                      gap: '12px',
                      alignItems: 'center',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: outOfStock ? 0.5 : 1,
                      minHeight: '85px',
                      width: '100%'
                    }}
                    className="catalog-btn"
                  >
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '50px', height: '50px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                        <Package size={22} />
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>{prod.sku}</span>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {prod.name}
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8rem' }}>${prod.sellingPrice.toFixed(2)}</span>
                        <span className={`badge ${outOfStock ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.6rem', padding: '2px 4px' }}>
                          {outOfStock ? 'Out' : `${prod.quantity}`}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No matching items.</div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: CART & CHECKOUT */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShoppingCart size={22} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Sales Basket</h3>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cart.length > 0 ? (
            cart.map(item => (
              <div key={item.product} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.name}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>${item.sellingPrice.toFixed(2)} each</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
                    <button type="button" onClick={() => handleUpdateCartQty(item.product, -1)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.85rem', minWidth: '20px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                    <button type="button" onClick={() => handleUpdateCartQty(item.product, 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
                      <Plus size={12} />
                    </button>
                  </div>
                  
                  <span style={{ fontWeight: 700, minWidth: '60px', textAlign: 'right', fontSize: '0.9rem' }}>
                    ${(item.sellingPrice * item.quantity).toFixed(2)}
                  </span>
                  
                  <button onClick={() => handleRemoveFromCart(item.product)} style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', gap: '10px' }}>
              <ShoppingCart size={40} style={{ opacity: 0.5 }} />
              <p style={{ fontSize: '0.85rem' }}>Select items from the catalog to add to checkout</p>
            </div>
          )}
        </div>

        {/* Invoice Info Form */}
        <form onSubmit={handleCheckout} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Customer Name</label>
            <input
              type="text"
              className="form-control"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="grid-2" style={{ gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Method</label>
              <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="UPI">UPI Mobile</option>
                <option value="Due">Invoice Balance / Due</option>
              </select>
            </div>
            
            <div className="grid-2" style={{ gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tax ($)</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Discount ($)</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Pricing breakdown */}
          <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Tax charges:</span>
              <span>+${taxVal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Discount applied:</span>
              <span>-${discountVal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontSize: '1.05rem', fontWeight: 800 }}>
              <span>Total Payable:</span>
              <span style={{ color: 'var(--color-primary)' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={cart.length === 0}>
            <Check size={18} />
            <span>Complete Order & Print Invoice</span>
          </button>
        </form>
      </div>

      {/* RECEIPT MODAL OVERLAY */}
      {isReceiptOpen && invoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '10px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h3 className="modal-title" style={{ width: '100%', textAlign: 'center' }}>Receipt Invoiced</h3>
              <button className="modal-close" onClick={() => setIsReceiptOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body print-area" style={{ textAlign: 'left', padding: '10px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>APEXSTOCK LTD</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Transaction Invoice Receipt</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Invoice No:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{invoice.invoiceNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                  <strong>{invoice.customerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Date/Time:</span>
                  <span>{new Date(invoice.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Method:</span>
                  <span>{invoice.paymentMethod}</span>
                </div>
              </div>

              {/* Items listing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {receiptItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600 }}>{item.name}</p>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{item.quantity} x ${item.sellingPrice.toFixed(2)}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>${(item.quantity * item.sellingPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Financial summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', borderTop: '1px dashed var(--border-color)', paddingTop: '12px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tax:</span>
                  <span>+${invoice.taxAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Discount:</span>
                  <span>-${invoice.discountAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: 'var(--color-primary)' }}>${invoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <p>Thank you for your business!</p>
                <p style={{ marginTop: '2px' }}>ApexStock - Intelligent Management System</p>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: 'none', background: 'none' }}>
              <button onClick={handlePrint} className="btn btn-primary" style={{ width: '100%' }}>
                <Printer size={16} />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS printing styling rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .modal-close, .modal-footer {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
};

export default Sales;
