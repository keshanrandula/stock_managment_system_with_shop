import { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Search, Plus, Edit2, Trash2, ShieldAlert, History, Sliders, X, Package } from 'lucide-react';

const Inventory = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  
  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  
  // Selected product items
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // Form fields (Add/Edit Product)
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCat, setFormCat] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formSelling, setFormSelling] = useState('');
  const [formQty, setFormQty] = useState('');
  const [formThreshold, setFormThreshold] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form fields (Manual adjustment)
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const canManage = user?.role === 'Admin' || user?.role === 'Manager';
  const canDelete = user?.role === 'Admin';

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/products', {
        params: { search, category }
      });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await API.get('/suppliers');
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, [search, category]);

  // Open product modal for creation
  const handleCreateOpen = () => {
    setSelectedProduct(null);
    setFormSku('');
    setFormName('');
    setFormDesc('');
    setFormCat('');
    setFormCost('');
    setFormSelling('');
    setFormQty('0');
    setFormThreshold('10');
    setFormSupplier(suppliers[0]?._id || '');
    setFormImageUrl('');
    setIsProductModalOpen(true);
  };

  // Open product modal for editing
  const handleEditOpen = (prod) => {
    setSelectedProduct(prod);
    setFormSku(prod.sku);
    setFormName(prod.name);
    setFormDesc(prod.description || '');
    setFormCat(prod.category);
    setFormCost(prod.costPrice);
    setFormSelling(prod.sellingPrice);
    setFormQty(prod.quantity);
    setFormThreshold(prod.lowStockThreshold);
    setFormSupplier(prod.supplier?._id || prod.supplier || '');
    setFormImageUrl(prod.imageUrl || '');
    setIsProductModalOpen(true);
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingImage(true);
      const res = await API.post('/products/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        setFormImageUrl(res.data.imageUrl);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle Product CRUD submit
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      sku: formSku,
      name: formName,
      description: formDesc,
      category: formCat,
      costPrice: Number(formCost),
      sellingPrice: Number(formSelling),
      quantity: Number(formQty),
      lowStockThreshold: Number(formThreshold),
      supplier: formSupplier,
      imageUrl: formImageUrl
    };

    try {
      if (selectedProduct) {
        // Edit Mode
        const res = await API.put(`/products/${selectedProduct._id}`, payload);
        if (res.data.success) {
          setIsProductModalOpen(false);
          fetchProducts();
        }
      } else {
        // Create Mode
        const res = await API.post('/products', payload);
        if (res.data.success) {
          setIsProductModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product and all its logs?')) {
      try {
        const res = await API.delete(`/products/${id}`);
        if (res.data.success) {
          fetchProducts();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  // Open stock adjustment modal
  const handleAdjustOpen = (prod) => {
    setSelectedProduct(prod);
    setAdjustQty('');
    setAdjustReason('');
    setIsAdjustModalOpen(true);
  };

  // Submit stock adjustment
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustQty || !adjustReason) {
      alert('Please fill all adjustment inputs');
      return;
    }

    try {
      const res = await API.patch(`/products/${selectedProduct._id}/adjust`, {
        quantityChanged: Number(adjustQty),
        reason: adjustReason
      });
      if (res.data.success) {
        setIsAdjustModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Adjustment failed');
    }
  };

  // Open and load logs modal
  const handleLogsOpen = async (prod) => {
    setSelectedProduct(prod);
    setIsLogsModalOpen(true);
    setLogs([]);
    try {
      const res = await API.get(`/products/${prod._id}/logs`);
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Unique categories list for filters
  const uniqueCategories = [...new Set(products.map(p => p.category))].filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '600px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by SKU or product name..."
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: '180px' }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {canManage && (
          <button onClick={handleCreateOpen} className="btn btn-primary">
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Catalog Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Selling</th>
                <th>Stock</th>
                <th>Supplier</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Loading products catalog...</td>
                </tr>
              ) : products.length > 0 ? (
                products.map(prod => {
                  const isLow = prod.quantity <= prod.lowStockThreshold;
                  return (
                    <tr key={prod._id}>
                      <td style={{ fontWeight: 600 }}>{prod.sku}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {prod.imageUrl ? (
                            <img src={prod.imageUrl} alt={prod.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                              <Package size={20} />
                            </div>
                          )}
                          <div>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.name}</p>
                            {isLow && (
                              <span style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontWeight: 600 }}>
                                <ShieldAlert size={12} /> Low Stock Limit ({prod.lowStockThreshold})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">{prod.category}</span>
                      </td>
                      <td>${prod.costPrice.toFixed(2)}</td>
                      <td>${prod.sellingPrice.toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`} style={{ width: 'fit-content' }}>
                            {prod.quantity} units
                          </span>
                          {prod.daysToDepletion !== undefined && prod.daysToDepletion !== null ? (
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: prod.daysToDepletion <= 3 ? 'var(--color-danger)' : 'var(--text-secondary)'
                            }}>
                              Out in {prod.daysToDepletion} days
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                              Stable stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{prod.supplier?.name || 'N/A'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleLogsOpen(prod)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px' }}
                            title="Audit Stock Logs"
                          >
                            <History size={15} />
                          </button>
                          
                          <button
                            onClick={() => handleAdjustOpen(prod)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px' }}
                            title="Manual Stock Correction"
                          >
                            <Sliders size={15} />
                          </button>

                          {canManage && (
                            <button
                              onClick={() => handleEditOpen(prod)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px' }}
                              title="Edit Details"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(prod._id)}
                              className="btn btn-danger"
                              style={{ padding: '6px 10px' }}
                              title="Delete Product"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No products cataloged matching current query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD/EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{selectedProduct ? 'Update Product Properties' : 'Create New Product Record'}</h3>
              <button className="modal-close" onClick={() => setIsProductModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">SKU (Stock Keeping Unit)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      required
                      placeholder="E.g. APX-PRO-10"
                      disabled={!!selectedProduct} // sku should be unique/immutable
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      placeholder="E.g. Wireless Mouse"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Enter short details about this item..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Image</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Option 1: Upload Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage && <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '4px', display: 'block' }}>Uploading image...</span>}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Option 2: Or Paste Image URL</span>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://example.com/image.jpg"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  {formImageUrl && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <img src={formImageUrl} alt="Preview" style={{ height: '50px', width: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Image Preview</span>
                    </div>
                  )}
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formCat}
                      onChange={(e) => setFormCat(e.target.value)}
                      required
                      placeholder="E.g. Electronics, Clothing"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supplier Partner</label>
                    <select
                      className="form-control"
                      value={formSupplier}
                      onChange={(e) => setFormSupplier(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select supplier</option>
                      {suppliers.map(sup => (
                        <option key={sup._id} value={sup._id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group">
                    <label className="form-label">Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formCost}
                      onChange={(e) => setFormCost(e.target.value)}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Retail ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formSelling}
                      onChange={(e) => setFormSelling(e.target.value)}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Qty</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formQty}
                      onChange={(e) => setFormQty(e.target.value)}
                      required
                      min="0"
                      disabled={!!selectedProduct} // stock changes should happen via adjustments/orders
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Low Limit</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formThreshold}
                      onChange={(e) => setFormThreshold(e.target.value)}
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK ADJUSTMENT */}
      {isAdjustModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Inventory Adjustment</h3>
              <button className="modal-close" onClick={() => setIsAdjustModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Product: {selectedProduct?.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Current Stock: <strong>{selectedProduct?.quantity} units</strong>
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity Changed</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Use +10 to add, -5 to subtract"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Reason</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g. Broken packaging, stock audit check"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Adjust Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDIT HISTORY LOGS */}
      {isLogsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Audit Log History</h3>
              <button className="modal-close" onClick={() => setIsLogsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', marginBottom: '16px', fontWeight: 600 }}>
                Log items for: {selectedProduct?.name} ({selectedProduct?.sku})
              </p>
              
              <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Qty Change</th>
                      <th>Final Qty</th>
                      <th>Audited By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length > 0 ? (
                      logs.map(log => (
                        <tr key={log._id}>
                          <td style={{ fontSize: '0.75rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                          <td>
                            <div>
                              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{log.type}</span>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{log.reason}</p>
                            </div>
                          </td>
                          <td style={{
                            color: log.quantityChanged > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                            fontWeight: 600
                          }}>
                            {log.quantityChanged > 0 ? `+${log.quantityChanged}` : log.quantityChanged}
                          </td>
                          <td>{log.newQuantity}</td>
                          <td style={{ fontSize: '0.8rem' }}>{log.performedBy?.name || 'System'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>No adjustments recorded for this product.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsLogsModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
