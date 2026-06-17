import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  History, 
  LogOut, 
  Globe, 
  MessageSquare, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send,
  CheckCircle,
  X
} from 'lucide-react';

const ContactUs = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) {
      newErrors.message = 'Message details are required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Simulate sending message
    setIsSuccessOpen(true);
    
    // Clear form except name/email if user is logged in
    setFormData(prev => ({
      ...prev,
      subject: '',
      message: ''
    }));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fafaf9', fontFamily: 'var(--font-family)' }}>
      
      {/* Navbar */}
      <header className="navbar" style={{ position: 'sticky', top: 0, zIndex: 900, boxShadow: 'var(--shadow-sm)', padding: '0 40px', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShoppingBag size={26} style={{ color: '#d97706' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>ApexStock Shop</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', height: '100%' }}>
          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center', height: '100%' }}>
            <Link to="/shop" style={{ 
              textDecoration: 'none', 
              color: 'var(--text-secondary)', 
              fontWeight: 600, 
              fontSize: '0.95rem', 
              padding: '24px 0 21px 0',
              borderBottom: '3px solid transparent'
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
              color: 'var(--text-primary)', 
              fontWeight: 700, 
              fontSize: '0.95rem', 
              borderBottom: '3px solid #d97706', 
              padding: '24px 0 21px 0',
              display: 'inline-block' 
            }}>Contact Us</Link>
            
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
                backgroundColor: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                border: '1.5px solid #E2E8F0'
              }}>
                <span>{user.name.charAt(0).toUpperCase()}</span>
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

      {/* Main Container */}
      <main style={{ flex: 1, padding: '50px 8%', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Title */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ color: '#d97706', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Get In Touch</span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.01em' }}>Connect With Our Support Team</h1>
          <p style={{ color: '#64748B', fontSize: '0.95rem' }}>Have questions about shipments, restock, custom orders or pricing? We are here to help.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', marginTop: '10px' }}>
          
          {/* Left Panel: Contact info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Info Cards Grid */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '30px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Contact Details</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={18} style={{ color: '#d97706' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Phone Helpline</span>
                  <strong style={{ fontSize: '0.9rem', color: '#1C1917' }}>+1 (800) 555-0199</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={18} style={{ color: '#d97706' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Email Address</span>
                  <strong style={{ fontSize: '0.9rem', color: '#1C1917' }}>support@apexstock.com</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={18} style={{ color: '#d97706' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>HQ Location</span>
                  <strong style={{ fontSize: '0.9rem', color: '#1C1917' }}>100 Pine Street, San Francisco, CA 94111</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={18} style={{ color: '#d97706' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Operating Hours</span>
                  <strong style={{ fontSize: '0.9rem', color: '#1C1917' }}>Mon - Fri: 8:00 AM - 6:00 PM EST</strong>
                </div>
              </div>
            </div>

            {/* Stylized Mock Map Card */}
            <div className="card glass-card" style={{ padding: '24px', height: '100%', minHeight: '220px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10, textAlign: 'left' }}>
                <MapPin size={18} style={{ color: '#d97706' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>Fulfillment Center Map</span>
              </div>
              
              {/* Custom Map Design SVG */}
              <div style={{ flex: 1, backgroundColor: '#E2E8F0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #CBD5E1', minHeight: '140px', position: 'relative' }}>
                <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.25 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,20 Q20,10 40,40 T80,10 T100,30" fill="none" stroke="#64748B" strokeWidth="1" />
                  <path d="M0,60 Q30,40 60,80 T100,50" fill="none" stroke="#64748B" strokeWidth="1" />
                  <line x1="20" y1="0" x2="20" y2="100" stroke="#64748B" strokeWidth="0.5" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#64748B" strokeWidth="0.5" />
                  <line x1="80" y1="0" x2="80" y2="100" stroke="#64748B" strokeWidth="0.5" />
                </svg>
                {/* Glowing location indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 2 }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', width: '28px', height: '28px', backgroundColor: '#d97706', borderRadius: '50%', opacity: 0.35, animation: 'spin 2s linear infinite' }}></div>
                    <div style={{ width: '14px', height: '14px', backgroundColor: '#d97706', borderRadius: '50%', border: '2.5px solid #ffffff', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', zIndex: 5 }}></div>
                  </div>
                  <span style={{ fontSize: '#0.7rem', fontWeight: 800, color: '#0f172a', backgroundColor: 'rgba(255,255,255,0.85)', padding: '2px 8px', borderRadius: '100px', border: '1px solid #E2E8F0' }}>ApexStock HQ</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Panel: Interactive Contact Form */}
          <div className="card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1E293B', marginBottom: '20px', textAlign: 'left' }}>Send Us A Message</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-control" 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                {errors.name && <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', textAlign: 'left', marginTop: '2px' }}>{errors.name}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-control" 
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                {errors.email && <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', textAlign: 'left', marginTop: '2px' }}>{errors.email}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Subject</label>
                <input 
                  type="text" 
                  name="subject" 
                  className="form-control" 
                  placeholder="How can we help you?" 
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />
                {errors.subject && <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', textAlign: 'left', marginTop: '2px' }}>{errors.subject}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Message Details</label>
                <textarea 
                  name="message" 
                  className="form-control" 
                  rows="5"
                  placeholder="Describe your issue or custom request here..." 
                  value={formData.message}
                  onChange={handleInputChange}
                  style={{ resize: 'vertical', minHeight: '100px', fontFamily: 'inherit' }}
                  required
                />
                {errors.message && <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', textAlign: 'left', marginTop: '2px' }}>{errors.message}</span>}
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px', width: '100%', marginTop: '8px' }}>
                <Send size={16} />
                <span>Submit Message Request</span>
              </button>
            </form>
          </div>

        </div>
      </main>

      {/* Success Modal Overlay */}
      {isSuccessOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '380px', width: '90%', padding: '30px 24px', animation: 'scaleIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
              <CheckCircle size={56} style={{ color: 'var(--color-success)' }} />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B' }}>Message Sent!</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '8px', lineHeight: '1.5' }}>
                  Thank you for contacting ApexStock support. Your request has been logged successfully. We will respond back within 24 hours.
                </p>
              </div>
              <button 
                onClick={() => setIsSuccessOpen(false)} 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '10px 0' }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

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

    </div>
  );
};

export default ContactUs;
