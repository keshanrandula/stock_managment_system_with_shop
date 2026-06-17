import { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  LogOut, 
  Printer, 
  X, 
  Check, 
  Package, 
  ShoppingBag, 
  History,
  ChevronDown,
  ArrowUpDown,
  Globe,
  MessageSquare,
  Heart,
  Star
} from 'lucide-react';

const Shop = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  
  // Wishlist state
  const [wishlist, setWishlist] = useState([]);
  const [showOnlyWishlist, setShowOnlyWishlist] = useState(false);

  // Ratings map state (calculated dynamically from database reviews)
  const [ratingsMap, setRatingsMap] = useState({});

  // Cart state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Checkout response
  const [invoice, setInvoice] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);

  // Sorting, Quick View & Promo Code States
  const [sortBy, setSortBy] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [promoInput, setPromoInput] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoSuccessMsg, setPromoSuccessMsg] = useState('');

  // Card Payment Simulation States
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [focusedField, setFocusedField] = useState('');
  const [cardErrors, setCardErrors] = useState({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  // Card brand detection helper
  const getCardBrand = (number) => {
    const cleanNumber = number.replace(/\s+/g, '');
    if (cleanNumber.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
    return 'generic';
  };

  // Card inputs changes formatting
  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'number') {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      const matches = digits.match(/\d{1,4}/g);
      formattedValue = matches ? matches.join(' ') : '';
    } else if (name === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      if (digits.length >= 3) {
        formattedValue = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        formattedValue = digits;
      }
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardDetails(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    if (cardErrors[name]) {
      setCardErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validation checking for card form
  const validateCardDetails = () => {
    const errors = {};
    const cleanNumber = cardDetails.number.replace(/\s+/g, '');
    
    if (cleanNumber.length < 13 || cleanNumber.length > 16) {
      errors.number = 'Please enter a valid card number (13-16 digits)';
    }
    
    if (!cardDetails.name.trim()) {
      errors.name = 'Cardholder name is required';
    }
    
    if (cardDetails.expiry.length !== 5) {
      errors.expiry = 'Expiration date must be MM/YY';
    } else {
      const [month, year] = cardDetails.expiry.split('/').map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      
      if (month < 1 || month > 12) {
        errors.expiry = 'Invalid month (01-12)';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        errors.expiry = 'Card is expired';
      }
    }
    
    if (cardDetails.cvv.length < 3 || cardDetails.cvv.length > 4) {
      errors.cvv = 'CVV must be 3 or 4 digits';
    }
    
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Simulate Card Processing Steps
  const handleCardPaymentSubmit = (e) => {
    e.preventDefault();
    if (!validateCardDetails()) return;

    setIsProcessingPayment(true);
    setProcessingStep(1);

    setTimeout(() => {
      setProcessingStep(2);
      
      setTimeout(() => {
        setProcessingStep(3);
        
        setTimeout(() => {
          setProcessingStep(4);
          
          setTimeout(async () => {
            setIsCardModalOpen(false);
            setIsProcessingPayment(false);
            setProcessingStep(0);
            await executeCheckout();
          }, 800);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // Quick View Tabbed details & Recommendations states
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'reviews'
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

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

  const fetchWishlist = async () => {
    try {
      const res = await API.get('/auth/wishlist');
      if (res.data.success) {
        setWishlist(res.data.data.map(p => p._id));
      }
    } catch (err) {
      console.error('Error fetching wishlist', err);
    }
  };

  const fetchProductReviewsMap = async (prods) => {
    prods.forEach(async (p) => {
      try {
        const res = await API.get(`/products/${p._id}/reviews`);
        if (res.data.success && res.data.count > 0) {
          const total = res.data.data.reduce((sum, r) => sum + r.rating, 0);
          setRatingsMap(prev => ({
            ...prev,
            [p._id]: {
              average: total / res.data.count,
              count: res.data.count
            }
          }));
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
  }, [search, category]);

  useEffect(() => {
    if (products.length > 0) {
      fetchProductReviewsMap(products);
    }
  }, [products]);

  // Handle modal reviews and related products whenever quick view product changes
  useEffect(() => {
    if (quickViewProduct) {
      // Reset tab & states
      setActiveTab('description');
      setNewComment('');
      setNewRating(5);
      
      // Fetch Reviews
      const fetchReviews = async () => {
        try {
          const res = await API.get(`/products/${quickViewProduct._id}/reviews`);
          if (res.data.success) {
            setReviews(res.data.data);
          }
        } catch (err) {
          console.error(err);
        }
      };

      // Fetch Related
      const fetchRelated = async () => {
        try {
          const res = await API.get(`/products/${quickViewProduct._id}/related`);
          if (res.data.success) {
            setRelatedProducts(res.data.data);
          }
        } catch (err) {
          console.error(err);
        }
      };

      fetchReviews();
      fetchRelated();
    }
  }, [quickViewProduct]);

  const handleToggleWishlist = async (e, productId) => {
    e.stopPropagation();
    try {
      const res = await API.post('/auth/wishlist/toggle', { productId });
      if (res.data.success) {
        if (res.data.added) {
          setWishlist([...wishlist, productId]);
        } else {
          setWishlist(wishlist.filter(id => id !== productId));
        }
      }
    } catch (err) {
      console.error('Error toggling wishlist', err);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingReview(true);
      const res = await API.post(`/products/${quickViewProduct._id}/reviews`, {
        rating: newRating,
        comment: newComment
      });
      if (res.data.success) {
        setReviews([res.data.data, ...reviews]);
        setNewComment('');
        setNewRating(5);
        // Refresh product reviews count on grid
        fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

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
    setIsCartOpen(true);
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

  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discountAmount;

  // Dynamic Coupon Validation API
  const handleApplyPromo = async (e) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccessMsg('');
    
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await API.get(`/coupons/validate/${code}`);
      if (res.data.success) {
        setDiscountPercentage(res.data.discountPercentage);
        setAppliedCode(code);
        setPromoSuccessMsg(`Promo ${code} applied! ${res.data.discountPercentage}% discount subtracted.`);
      }
    } catch (err) {
      setDiscountPercentage(0);
      setAppliedCode('');
      setPromoError(err.response?.data?.message || 'Invalid promo code');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Please add products to your cart before checking out.');
      return;
    }

    if (paymentMethod === 'Card') {
      setCardDetails({ number: '', name: '', expiry: '', cvv: '' });
      setCardErrors({});
      setFocusedField('');
      setProcessingStep(0);
      setIsProcessingPayment(false);
      setIsCardModalOpen(true);
      return;
    }

    await executeCheckout();
  };

  const executeCheckout = async () => {
    const payload = {
      customerName: user.name,
      items: cart.map(item => ({
        product: item.product,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice
      })),
      taxAmount: 0,
      discountAmount: discountAmount,
      paymentMethod
    };

    try {
      const res = await API.post('/orders/sales', payload);
      if (res.data.success) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });

        setInvoice(res.data.data);
        setReceiptItems(cart);
        setIsReceiptOpen(true);
        setIsCartOpen(false);

        // Reset
        setCart([]);
        setPaymentMethod('Cash');
        setPromoInput('');
        setAppliedCode('');
        setDiscountPercentage(0);
        setPromoSuccessMsg('');
        setPromoError('');
        
        fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout process encountered an error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const uniqueCategories = [...new Set(products.map(p => p.category))].filter(Boolean);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-asc') return a.sellingPrice - b.sellingPrice;
    if (sortBy === 'price-desc') return b.sellingPrice - a.sellingPrice;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    return 0;
  });

  const displayedProducts = sortedProducts.filter(p => !showOnlyWishlist || wishlist.includes(p._id));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fafaf9', fontFamily: 'var(--font-family)' }}>
      
      {/* Top Store Header */}
      <header className="navbar" style={{ position: 'sticky', top: 0, zIndex: 900, boxShadow: 'var(--shadow-sm)', padding: '0 40px', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShoppingBag size={26} style={{ color: '#d97706' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>ApexStock Shop</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', height: '100%' }}>
          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center', height: '100%' }}>
            <Link to="/shop" style={{ 
              textDecoration: 'none', 
              color: 'var(--text-primary)', 
              fontWeight: 700, 
              fontSize: '0.95rem', 
              borderBottom: '3px solid #d97706', 
              padding: '24px 0 21px 0',
              display: 'inline-block' 
            }}>Catalog</Link>
            
            <Link to="/shop/orders" style={{ 
              textDecoration: 'none', 
              color: 'var(--text-secondary)', 
              fontWeight: 600, 
              fontSize: '0.95rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '24px 0 21px 0',
              borderBottom: '3px solid transparent'
            }}>
              <History size={16} />
              <span>My Orders</span>
            </Link>

            <Link to="/shop/about" style={{ 
              textDecoration: 'none', 
              color: 'var(--text-secondary)', 
              fontWeight: 600, 
              fontSize: '0.95rem',
              padding: '24px 0 21px 0',
              borderBottom: '3px solid transparent'
            }}>About Us</Link>

            <Link to="/shop/contact" style={{ 
              textDecoration: 'none', 
              color: 'var(--text-secondary)', 
              fontWeight: 600, 
              fontSize: '0.95rem',
              padding: '24px 0 21px 0',
              borderBottom: '3px solid transparent'
            }}>Contact Us</Link>
            
            {/* Staff / Admins can switch back to dashboard */}
            {user && user.role.toLowerCase() !== 'customer' && (
              <Link to="/" style={{ 
                textDecoration: 'none', 
                color: 'var(--text-secondary)', 
                fontWeight: 600, 
                fontSize: '0.95rem',
                padding: '24px 0 21px 0',
                borderBottom: '3px solid transparent'
              }}>Go to Admin Dashboard</Link>
            )}
          </nav>

          <div style={{ height: '24px', width: '1px', backgroundColor: '#E2E8F0' }} />

          <button 
            onClick={() => setIsCartOpen(true)}
            style={{ 
              position: 'relative', 
              padding: '10px 18px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              backgroundColor: '#EEF2F6', 
              border: 'none',
              borderRadius: '100px', 
              color: '#475569', 
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E2E8F0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EEF2F6'}
          >
            <ShoppingCart size={18} />
            <span>Cart</span>
            <span style={{
              backgroundColor: '#1E293B',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {cartCount}
            </span>
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</span>
              </div>
              
              <div style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                border: '1.5px solid #E2E8F0'
              }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : user.role.toLowerCase() === 'admin' ? (
                  <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80" alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
          )}

          <button 
            onClick={handleLogout} 
            style={{ 
              border: 'none', 
              background: 'none', 
              color: '#64748B', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Log out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main catalog view */}
      <main className="page-container" style={{ padding: '40px 60px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Premium Welcome Hero Card */}
        <div style={{
          background: 'linear-gradient(135deg, #e28a0d, #d97706)',
          borderRadius: '24px',
          padding: '48px 56px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.2), var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '8px',
          color: '#ffffff'
        }}>
          <div style={{ zIndex: 2, maxWidth: '65%', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
            <span style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              color: '#ffffff',
              padding: '6px 14px', 
              borderRadius: '100px', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em' 
            }}>
              Storefront Portal
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Discover Quality Products & Quick Checkout
            </h1>
            <p style={{ opacity: 0.9, fontSize: '1rem', color: '#ffffff', lineHeight: 1.5, fontWeight: 500, margin: '4px 0 12px 0' }}>
              Real-time stock tracking, custom cart updates, and instant self-checkout generation. Experience the speed of next-gen commerce.
            </p>
            <div style={{ display: 'flex', gap: '14px' }}>
              <button style={{
                backgroundColor: '#ffffff',
                color: '#d97706',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              >
                Browse Collection
              </button>
              <button style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                padding: '12px 24px',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background-color 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              >
                How it works
              </button>
            </div>
          </div>
          
          <div style={{ zIndex: 2, marginRight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Shopping cart SVG with arrow */}
            <svg width="200" height="200" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.18, color: '#ffffff' }}>
              <path d="M15 25h12l10 32h32l10 -22h-54" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="43" cy="74" r="7.5" fill="currentColor" />
              <circle cx="75" cy="74" r="7.5" fill="currentColor" />
              <path d="M5 41h38M33 31l10 10-10 10" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          
          {/* Radiant circles */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.15)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '-80px', left: '15%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', filter: 'blur(50px)' }} />
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
          {/* Search input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="custom-input"
              placeholder="Search catalog by SKU or product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Select */}
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="custom-select"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
          </div>

          {/* Sort Select */}
          <div style={{ position: 'relative', minWidth: '200px' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="custom-select"
            >
              <option value="">Sort By: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
            <ArrowUpDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
          </div>

          {/* Wishlist Toggle Filter */}
          <button
            onClick={() => setShowOnlyWishlist(!showOnlyWishlist)}
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1.5px solid #E2E8F0',
              backgroundColor: showOnlyWishlist ? '#FEE2E2' : '#ffffff',
              color: showOnlyWishlist ? '#DC2626' : '#64748B',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Heart size={18} fill={showOnlyWishlist ? '#DC2626' : 'none'} />
            <span>Wishlist ({wishlist.length})</span>
          </button>
        </div>

        {/* Catalog grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>Loading product catalog...</div>
        ) : displayedProducts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {displayedProducts.map(prod => {
              const outOfStock = prod.quantity === 0;
              const cartItem = cart.find(item => item.product === prod._id);
              const quantityInCart = cartItem ? cartItem.quantity : 0;
              const quantityAvailableToCart = prod.quantity - quantityInCart;
              
              // Low stock limit logic for alert banner
              const isLowStock = prod.quantity > 0 && prod.quantity <= (prod.lowStockThreshold || 5);
              const isWishlisted = wishlist.includes(prod._id);

              // Get ratings
              const ratingData = ratingsMap[prod._id] || { average: 0, count: 0 };

              const renderFallbackIcon = () => {
                if (prod.name.toLowerCase().includes('charger')) {
                  return (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, color: '#78350F' }}>
                      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3Z" />
                      <path d="M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3Z" />
                      <path d="M12 3v18" />
                    </svg>
                  );
                }
                return <Package size={44} style={{ opacity: 0.5, color: '#94A3B8' }} />;
              };

              const catStyle = { backgroundColor: '#FEF3C7', color: '#78350F' };

              return (
                <div key={prod._id} className="shop-card">
                  {/* Image container */}
                  <div 
                    onClick={() => { setQuickViewProduct(prod); setQuickViewQty(1); }} 
                    style={{ 
                      height: '200px', 
                      backgroundColor: '#F8FAFC', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      borderBottom: '1px solid #E2E8F0'
                    }}
                  >
                    {prod.imageUrl ? (
                      <img 
                        className="product-img" 
                        src={prod.imageUrl} 
                        alt={prod.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#F1F5F9' }}>
                        {renderFallbackIcon()}
                      </div>
                    )}
                    
                    {/* Category Pill Tag */}
                    <span style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      left: '12px', 
                      backgroundColor: catStyle.backgroundColor,
                      color: catStyle.color,
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontSize: '0.65rem', 
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {prod.category}
                    </span>

                    {/* Wishlist Heart Toggle Button */}
                    <button
                      onClick={(e) => handleToggleWishlist(e, prod._id)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'pointer',
                        color: isWishlisted ? '#DC2626' : '#94A3B8',
                        zIndex: 10,
                        transition: 'transform 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                    >
                      <Heart size={16} fill={isWishlisted ? '#DC2626' : 'none'} />
                    </button>

                    {/* Out of Stock Pill Tag */}
                    {outOfStock && (
                      <span style={{ 
                        position: 'absolute', 
                        bottom: '12px', 
                        left: '12px', 
                        backgroundColor: '#FEE2E2',
                        color: '#991B1B',
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '0.65rem', 
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Out of Stock
                      </span>
                    )}

                    {/* Quick View Hover Overlay */}
                    <div className="quick-view-overlay" style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(15, 23, 42, 0.4)',
                      opacity: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      transition: 'opacity 0.2s ease',
                      pointerEvents: 'none'
                    }}>
                      Quick View
                    </div>
                  </div>

                  {/* Product Information */}
                  <div 
                    onClick={() => { setQuickViewProduct(prod); setQuickViewQty(1); }}
                    style={{ 
                      padding: '20px 20px 10px 20px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      flex: 1, 
                      cursor: 'pointer',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                        {prod.sku}
                      </span>
                      {/* Rating stars summary */}
                      {ratingData.count > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700 }}>
                          <Star size={12} fill="#F59E0B" />
                          <span>{ratingData.average.toFixed(1)} ({ratingData.count})</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: 700, 
                      color: '#1E293B',
                      lineHeight: '1.25',
                      margin: 0
                    }}>
                      {prod.name}
                    </h3>
                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: '#64748B', 
                      lineHeight: '1.45',
                      margin: '2px 0 0 0',
                      display: '-webkit-box', 
                      WebkitLineClamp: 3, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden'
                    }}>
                      {prod.description || 'No description available.'}
                    </p>

                    {/* Urgent Stock Alert Tag */}
                    {isLowStock && (
                      <div style={{ 
                        marginTop: '8px', 
                        color: '#D97706', 
                        backgroundColor: '#FEF3C7', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignSelf: 'flex-start'
                      }}>
                        ⚠️ Only {prod.quantity} left in stock!
                      </div>
                    )}

                    {prod.name.toLowerCase().includes('charger') && (
                      <div style={{ width: '100%', height: '1.5px', backgroundColor: '#E2E8F0', marginTop: '12px' }} />
                    )}
                  </div>

                  {/* Price & Action Row */}
                  <div style={{ 
                    padding: '0 20px 20px 20px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: 'auto'
                  }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B' }}>
                      ${prod.sellingPrice.toFixed(2)}
                    </span>
                    
                    <button 
                      onClick={() => handleAddToCart(prod)}
                      disabled={outOfStock || quantityAvailableToCart <= 0}
                      style={{ 
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        backgroundColor: outOfStock || quantityAvailableToCart <= 0 ? '#F1F5F9' : '#d97706',
                        color: outOfStock || quantityAvailableToCart <= 0 ? '#94A3B8' : '#ffffff',
                        cursor: outOfStock || quantityAvailableToCart <= 0 ? 'not-allowed' : 'pointer',
                        boxShadow: outOfStock || quantityAvailableToCart <= 0 ? 'none' : '0 4px 10px rgba(217, 119, 6, 0.2)',
                        transition: 'background-color 0.2s, transform 0.2s'
                      }}
                      onMouseOver={(e) => {
                        if (!outOfStock && quantityAvailableToCart > 0) {
                          e.currentTarget.style.backgroundColor = '#b45309';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!outOfStock && quantityAvailableToCart > 0) {
                          e.currentTarget.style.backgroundColor = '#d97706';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                      title={outOfStock ? 'Out of Stock' : quantityAvailableToCart <= 0 ? 'Max in Cart' : 'Add to Cart'}
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <Heart size={48} style={{ opacity: 0.4, marginBottom: '12px', color: '#DC2626' }} />
            <p style={{ fontWeight: 600 }}>{showOnlyWishlist ? 'Your wishlist is empty.' : 'No products found matching current query.'}</p>
          </div>
        )}

        {/* View More Products Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', marginBottom: '16px' }}>
          <button style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            color: '#334155',
            border: '1.5px solid #E2E8F0',
            borderRadius: '100px',
            padding: '12px 28px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s, border-color 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#F8FAFC';
            e.currentTarget.style.borderColor = '#CBD5E1';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#E2E8F0';
          }}
          >
            <span>View More Products</span>
            <ChevronDown size={16} />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: '#F8FAFC', 
        borderTop: '1px solid #E2E8F0', 
        padding: '32px 60px',
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={20} style={{ color: '#d97706' }} />
          <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '1.1rem' }}>ApexStock</span>
          <span style={{ color: '#64748B', fontSize: '0.85rem', marginLeft: '12px' }}>
            © 2024 ApexStock Shop. All rights reserved.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <Link to="/shop/about" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>About Us</Link>
          <Link to="/shop/contact" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Contact Us</Link>
          <a href="#" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Privacy Policy</a>
          <a href="#" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Terms of Service</a>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button style={{ border: 'none', background: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={18} />
          </button>
          <button style={{ border: 'none', background: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={18} />
          </button>
        </div>
      </footer>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="modal-overlay" style={{ justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setIsCartOpen(false)}>
          <div className="modal-content" style={{ 
            height: '100vh', 
            borderRadius: 0, 
            maxWidth: '450px', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            animation: 'scaleIn 0.2s ease-out'
          }} onClick={e => e.stopPropagation()}>
            
            <div className="modal-header" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingCart size={22} style={{ color: '#d97706' }} />
                <h3 className="modal-title">Shopping Cart</h3>
              </div>
              <button className="modal-close" onClick={() => setIsCartOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <div className="modal-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', padding: '24px' }}>
              {cart.length > 0 ? (
                cart.map(item => (
                  <div key={item.product} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</p>
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', gap: '12px' }}>
                  <ShoppingCart size={48} style={{ opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>Your cart is empty.</p>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', padding: '24px', backgroundColor: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Promo Code Section */}
                <form onSubmit={handleApplyPromo} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 0 }}>
                    <span className="form-label" style={{ fontWeight: 600 }}>Have a Promo Code?</span>
                    <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>Try APEX50, WELCOME10 or BLACKFRIDAY</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Enter code (e.g. APEX50)" 
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <button type="submit" className="btn btn-secondary" style={{ padding: '0 16px' }}>Apply</button>
                  </div>
                  {promoError && <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{promoError}</span>}
                  {promoSuccessMsg && <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>{promoSuccessMsg}</span>}
                </form>

                <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select Payment Method</label>
                    <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="Cash">Cash on Delivery</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="UPI">UPI Mobile Wallet</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.85rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {discountPercentage > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontWeight: 600 }}>
                        <span>Discount ({discountPercentage}%):</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                      <span>Grand Total:</span>
                      <span style={{ color: '#d97706' }}>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                    <Check size={18} />
                    <span>Submit Secure Order</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Credit Card Payment Modal */}
      {isCardModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '440px', width: '92%', animation: 'scaleIn 0.2s ease-out' }}>
            <div className="modal-header">
              <h3 className="modal-title">Secure Card Checkout</h3>
              <button 
                className="modal-close" 
                onClick={() => setIsCardModalOpen(false)}
                disabled={isProcessingPayment}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px 20px' }}>
              {isProcessingPayment ? (
                /* Simulated Payment processing screens */
                <div className="payment-processing-container">
                  <div className="payment-spinner"></div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1E293B', marginBottom: '8px' }}>
                    {processingStep === 4 ? 'Payment Authorized' : 'Processing Card Payment'}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '20px' }}>
                    Please do not close this modal or refresh the window.
                  </p>
                  
                  <div className="payment-steps-list">
                    <div className={`payment-step ${processingStep === 1 ? 'active' : ''} ${processingStep > 1 ? 'completed' : ''}`}>
                      <div className="payment-step-icon">
                        {processingStep > 1 ? '✓' : '1'}
                      </div>
                      <span>Connecting to secure card processor...</span>
                    </div>

                    <div className={`payment-step ${processingStep === 2 ? 'active' : ''} ${processingStep > 2 ? 'completed' : ''}`}>
                      <div className="payment-step-icon">
                        {processingStep > 2 ? '✓' : '2'}
                      </div>
                      <span>Verifying card details & balance...</span>
                    </div>

                    <div className={`payment-step ${processingStep === 3 ? 'active' : ''} ${processingStep > 3 ? 'completed' : ''}`}>
                      <div className="payment-step-icon">
                        {processingStep > 3 ? '✓' : '3'}
                      </div>
                      <span>Securing payment tokens...</span>
                    </div>

                    <div className={`payment-step ${processingStep === 4 ? 'active' : ''} ${processingStep > 4 ? 'completed' : ''}`}>
                      <div className="payment-step-icon">
                        {processingStep > 4 ? '✓' : '4'}
                      </div>
                      <span style={{ fontWeight: 600 }}>Payment successful & approved!</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Card Information form */
                <form onSubmit={handleCardPaymentSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Dynamic interactive 3D Card Display */}
                  <div className="credit-card-container">
                    <div className={`credit-card ${focusedField === 'cvv' ? 'flipped' : ''}`}>
                      
                      {/* CARD FRONT FACE */}
                      <div className="card-face card-face-front">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="card-chip"></div>
                          <div className={`card-brand ${getCardBrand(cardDetails.number)}`}>
                            {getCardBrand(cardDetails.number) === 'visa' && 'VISA'}
                            {getCardBrand(cardDetails.number) === 'mastercard' && (
                              <>
                                <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#eb001b', display: 'inline-block' }}></span>
                                <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#f79e1b', display: 'inline-block', marginLeft: '-8px' }}></span>
                              </>
                            )}
                            {getCardBrand(cardDetails.number) === 'amex' && 'AMEX'}
                            {getCardBrand(cardDetails.number) === 'discover' && 'DISCOVER'}
                            {getCardBrand(cardDetails.number) === 'generic' && 'CARD'}
                          </div>
                        </div>

                        <div className="card-number">
                          {cardDetails.number || '•••• •••• •••• ••••'}
                        </div>

                        <div className="card-info-row">
                          <div>
                            <div className="card-label">Card Holder</div>
                            <div className="card-value" style={{ textTransform: 'uppercase' }}>
                              {cardDetails.name || 'FULL NAME'}
                            </div>
                          </div>
                          <div>
                            <div className="card-label">Expires</div>
                            <div className="card-value">
                              {cardDetails.expiry || 'MM/YY'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CARD BACK FACE */}
                      <div className="card-face card-face-back">
                        <div className="card-magnetic-stripe"></div>
                        <div style={{ textAlign: 'left', marginTop: '16px', padding: '0 20px' }}>
                          <div className="card-label" style={{ marginLeft: '6px' }}>Authorized Signature</div>
                        </div>
                        <div className="card-signature-strip">
                          <span className="card-signature-strip-text">
                            {cardDetails.cvv || '•••'}
                          </span>
                        </div>
                        <div className="card-back-brand">
                          ApexStock Secure
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Form input fields */}
                  <div className="form-group">
                    <label className="form-label">Cardholder Name</label>
                    <input 
                      type="text"
                      name="name"
                      placeholder="e.g. John Doe"
                      className="form-control"
                      value={cardDetails.name}
                      onChange={handleCardInputChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField('')}
                      required
                    />
                    {cardErrors.name && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '2px', textAlign: 'left' }}>
                        {cardErrors.name}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input 
                      type="text"
                      name="number"
                      placeholder="4771 2345 6789 0123"
                      className="form-control"
                      value={cardDetails.number}
                      onChange={handleCardInputChange}
                      onFocus={() => setFocusedField('number')}
                      onBlur={() => setFocusedField('')}
                      required
                    />
                    {cardErrors.number && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '2px', textAlign: 'left' }}>
                        {cardErrors.number}
                      </span>
                    )}
                  </div>

                  <div className="grid-2" style={{ gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Expiry Date</label>
                      <input 
                        type="text"
                        name="expiry"
                        placeholder="MM/YY"
                        className="form-control"
                        value={cardDetails.expiry}
                        onChange={handleCardInputChange}
                        onFocus={() => setFocusedField('expiry')}
                        onBlur={() => setFocusedField('')}
                        required
                      />
                      {cardErrors.expiry && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '2px', textAlign: 'left' }}>
                          {cardErrors.expiry}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">CVV / CVC</label>
                      <input 
                        type="password"
                        name="cvv"
                        placeholder="•••"
                        className="form-control"
                        value={cardDetails.cvv}
                        onChange={handleCardInputChange}
                        onFocus={() => setFocusedField('cvv')}
                        onBlur={() => setFocusedField('')}
                        required
                      />
                      {cardErrors.cvv && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '2px', textAlign: 'left' }}>
                          {cardErrors.cvv}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px', marginBottom: '16px' }}>
                    <span>Total Payable:</span>
                    <span style={{ color: '#d97706' }}>${total.toFixed(2)}</span>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    <Check size={18} />
                    <span>Authorize Mock Payment</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Quick View Modal */}
      {quickViewProduct && (
        <div className="modal-overlay" onClick={() => setQuickViewProduct(null)}>
          <div className="modal-content glass-card" style={{ maxWidth: '650px', width: '92%', animation: 'scaleIn 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Product Quick View</h3>
              <button className="modal-close" onClick={() => setQuickViewProduct(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ height: '220px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                  {quickViewProduct.imageUrl ? (
                    <img src={quickViewProduct.imageUrl} alt={quickViewProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Package size={60} style={{ opacity: 0.4, color: 'var(--text-tertiary)' }} />
                  )}
                  {/* Category badging overlay */}
                  <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#FEF3C7', color: '#78350F', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>
                    {quickViewProduct.category}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      SKU: {quickViewProduct.sku}
                    </span>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.2' }}>
                      {quickViewProduct.name}
                    </h2>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${quickViewProduct.quantity === 0 ? 'badge-danger' : 'badge-success'}`}>
                      {quickViewProduct.quantity === 0 ? 'Out of stock' : `${quickViewProduct.quantity} Available`}
                    </span>
                    {/* Stars average in Quick View */}
                    {reviews.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#F59E0B', fontSize: '0.85rem', fontWeight: 700 }}>
                        <Star size={14} fill="#F59E0B" />
                        <span>{(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} ({reviews.length} reviews)</span>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d97706' }}>
                      ${quickViewProduct.sellingPrice.toFixed(2)}
                    </span>
                  </div>

                  {quickViewProduct.supplier?.name && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Supplier: <strong>{quickViewProduct.supplier.name}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Tabs selector */}
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginTop: '10px' }}>
                <button 
                  onClick={() => setActiveTab('description')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: activeTab === 'description' ? '#d97706' : '#64748B',
                    borderBottom: activeTab === 'description' ? '2px solid #d97706' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  Description
                </button>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: activeTab === 'reviews' ? '#d97706' : '#64748B',
                    borderBottom: activeTab === 'reviews' ? '2px solid #d97706' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  Reviews ({reviews.length})
                </button>
              </div>

              {/* Tab content */}
              <div style={{ textAlign: 'left', minHeight: '120px' }}>
                {activeTab === 'description' ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {quickViewProduct.description || 'No detailed description available for this product.'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Review submit form */}
                    <form onSubmit={handleAddReview} style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>Write a Review</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Rating:</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              size={16} 
                              onClick={() => setNewRating(star)} 
                              fill={star <= newRating ? '#F59E0B' : 'none'} 
                              stroke={star <= newRating ? '#F59E0B' : '#94A3B8'} 
                              style={{ cursor: 'pointer' }}
                            />
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="What did you think of the product?"
                          className="form-control"
                          style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button type="submit" disabled={submittingReview} className="btn btn-primary" style={{ padding: '0 16px', fontSize: '0.8rem' }}>
                          Submit
                        </button>
                      </div>
                    </form>

                    {/* Previous reviews list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                      {reviews.length > 0 ? (
                        reviews.map(rev => (
                          <div key={rev._id} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '0.8rem', color: '#1E293B' }}>{rev.userName}</strong>
                              <div style={{ display: 'flex', gap: '2px', color: '#F59E0B' }}>
                                {[...Array(rev.rating)].map((_, i) => <Star key={i} size={10} fill="#F59E0B" stroke="#F59E0B" />)}
                              </div>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', fontStyle: 'italic' }}>"{rev.comment}"</p>
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8', textAlign: 'center', display: 'block', padding: '10px 0' }}>No reviews yet. Be the first to review this product!</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action and recommendations row */}
              {quickViewProduct.quantity > 0 && activeTab === 'description' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Quantity:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', minWidth: '30px' }}
                        onClick={() => setQuickViewQty(prev => Math.max(1, prev - 1))}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: '1rem', fontWeight: 700, minWidth: '30px', textAlign: 'center' }}>
                        {quickViewQty}
                      </span>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', minWidth: '30px' }}
                        onClick={() => setQuickViewQty(prev => Math.min(quickViewProduct.quantity, prev + 1))}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '12px' }}
                    onClick={() => {
                      const cartItem = cart.find(item => item.product === quickViewProduct._id);
                      const currentQty = cartItem ? cartItem.quantity : 0;
                      const newQty = currentQty + quickViewQty;
                      
                      if (newQty > quickViewProduct.quantity) {
                        alert(`Cannot add more. Only ${quickViewProduct.quantity} units are in stock.`);
                        return;
                      }

                      if (cartItem) {
                        setCart(cart.map(item =>
                          item.product === quickViewProduct._id
                            ? { ...item, quantity: newQty }
                            : item
                        ));
                      } else {
                        setCart([...cart, {
                          product: quickViewProduct._id,
                          name: quickViewProduct.name,
                          sku: quickViewProduct.sku,
                          sellingPrice: quickViewProduct.sellingPrice,
                          stockAvailable: quickViewProduct.quantity,
                          quantity: quickViewQty
                        }]);
                      }
                      setQuickViewProduct(null);
                      setIsCartOpen(true);
                    }}
                  >
                    <ShoppingCart size={18} />
                    <span>Add to Cart - ${(quickViewProduct.sellingPrice * quickViewQty).toFixed(2)}</span>
                  </button>
                </div>
              )}

              {/* Related Products Recommendations */}
              {relatedProducts.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '10px' }}>You May Also Like</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                    {relatedProducts.map(rel => (
                      <div 
                        key={rel._id} 
                        onClick={() => setQuickViewProduct(rel)}
                        style={{ 
                          border: '1px solid #E2E8F0', 
                          borderRadius: '8px', 
                          padding: '8px', 
                          cursor: 'pointer',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                      >
                        <div style={{ height: '70px', backgroundColor: '#F8FAFC', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {rel.imageUrl ? (
                            <img src={rel.imageUrl} alt={rel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Package size={20} style={{ opacity: 0.4 }} />
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rel.name}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706' }}>${rel.sellingPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Invoice modal */}
      {isReceiptOpen && invoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '10px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h3 className="modal-title" style={{ width: '100%', textAlign: 'center' }}>Order Invoice</h3>
              <button className="modal-close" onClick={() => setIsReceiptOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body print-area" style={{ textAlign: 'left', padding: '10px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706' }}>APEXSTOCK LTD</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Customer Self-Checkout Invoice</p>
                <div style={{ marginTop: '8px' }}>
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Order Status: Pending</span>
                </div>
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

              {/* Items */}
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

              {/* Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', borderTop: '1px dashed var(--border-color)', paddingTop: '12px', marginTop: '16px' }}>
                {invoice.discountAmount > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>Subtotal:</span>
                      <span>${(invoice.totalAmount + invoice.discountAmount).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontWeight: 600 }}>
                      <span>Discount:</span>
                      <span>-${invoice.discountAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: '#d97706' }}>${invoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <p>Thank you for shopping with us!</p>
                <p style={{ marginTop: '2px' }}>ApexStock - Intelligent Management Suite</p>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: 'none', background: 'none' }}>
              <button onClick={handlePrint} className="btn btn-primary" style={{ width: '100%' }}>
                <Printer size={16} />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stylesheet */}
      <style>{`
        .shop-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1.5px solid #E2E8F0;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .shop-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px -10px rgba(217, 119, 6, 0.15), var(--shadow-lg);
          border-color: #d97706;
        }
        .shop-card .product-img {
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .shop-card:hover .product-img {
          transform: scale(1.06);
        }
        .shop-card:hover .quick-view-overlay {
          opacity: 1 !important;
        }
        .custom-select {
          width: 100%;
          padding: 12px 40px 12px 16px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          background-color: #ffffff;
          color: #1E293B;
          font-size: 0.95rem;
          font-weight: 500;
          outline: none;
          cursor: pointer;
          appearance: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .custom-select:focus {
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
        }
        .custom-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          background-color: #ffffff;
          color: #1E293B;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .custom-input:focus {
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
        }
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

export default Shop;
