import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  History, 
  LogOut, 
  Globe, 
  MessageSquare, 
  Target, 
  Users, 
  Compass, 
  Award,
  ChevronRight
} from 'lucide-react';

const AboutUs = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const teamMembers = [
    {
      name: "Olivia Chen",
      role: "Founder & CEO",
      bio: "15+ years of inventory logistics experience. Passionate about empowering local stores with automated commerce tools.",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&fit=crop&q=80"
    },
    {
      name: "Marcus Miller",
      role: "Head of Engineering",
      bio: "Tech leader specializing in distributed scaling and real-time inventory synchronization systems.",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&fit=crop&q=80"
    },
    {
      name: "Sarah Jenkins",
      role: "Lead UI/UX Designer",
      bio: "Crafts clean, interactive visual journeys. Dedicated to designing interfaces that people love to use every day.",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&fit=crop&q=80"
    }
  ];

  const coreValues = [
    {
      icon: <Target size={24} style={{ color: '#d97706' }} />,
      title: "Clarity & Precision",
      description: "We believe in absolute data accuracy. From single stock items to heavy wholesale orders, accuracy comes first."
    },
    {
      icon: <Compass size={24} style={{ color: '#d97706' }} />,
      title: "Accessibility",
      description: "Next-gen enterprise software shouldn't require custom engineering. We build intuitive software ready for anyone."
    },
    {
      icon: <Award size={24} style={{ color: '#d97706' }} />,
      title: "Reliable Security",
      description: "Your operations and transactions are secured with state-of-the-art tokenized systems and access levels."
    },
    {
      icon: <Users size={24} style={{ color: '#d97706' }} />,
      title: "User-Centric Design",
      description: "We work directly alongside retailers and warehouses to solve real-world friction and styling demands."
    }
  ];

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
              color: 'var(--text-primary)', 
              fontWeight: 700, 
              fontSize: '0.95rem', 
              borderBottom: '3px solid #d97706', 
              padding: '24px 0 21px 0',
              display: 'inline-block' 
            }}>About Us</Link>

            <Link to="/shop/contact" style={{ 
              textDecoration: 'none', 
              color: 'var(--text-secondary)', 
              fontWeight: 600, 
              fontSize: '0.95rem', 
              padding: '24px 0 21px 0',
              borderBottom: '3px solid transparent'
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

      {/* Main Content */}
      <main style={{ flex: 1, padding: '50px 8%', display: 'flex', flexDirection: 'column', gap: '50px' }}>
        
        {/* Story Section */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px', alignItems: 'center' }}>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ color: '#d97706', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Our Vision</span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1E293B', lineHeight: '1.15' }}>
              Redefining Retail & Inventory Coordination
            </h1>
            <p style={{ color: '#57534e', fontSize: '1rem', lineHeight: '1.6' }}>
              ApexStock started with a simple belief: managing stock shouldn't be complicated. We recognized that small-to-medium retailers struggled with outdated systems that didn't talk to their storefronts, leading to oversells and inventory mismatches.
            </p>
            <p style={{ color: '#57534e', fontSize: '1rem', lineHeight: '1.6' }}>
              Our platform bridges the gap. By providing real-time stock sync, advanced analytics, self-service storefront checkouts, and now **secure simulated card payments**, we empower shop owners to run operations smoothly without expensive hardware.
            </p>
          </div>
          <div style={{ position: 'relative', height: '320px', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <img 
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&fit=crop&q=80" 
              alt="ApexStock Retail Warehouse"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(15, 23, 42, 0.7))' }}></div>
            <div style={{ position: 'absolute', bottom: '24px', left: '24px', color: '#ffffff', textAlign: 'left' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Smarter Stock Tracking</span>
              <p style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '2px' }}>Empowering retailers worldwide.</p>
            </div>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0' }} />

        {/* Core Values Section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E293B' }}>Our Core Principles</h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem' }}>The ideals driving every line of code we write</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {coreValues.map((val, idx) => (
              <div key={idx} className="card glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '14px', padding: '24px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                  {val.icon}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1C1917' }}>{val.title}</h3>
                <p style={{ fontSize: '0.85rem', color: '#57534e', lineHeight: '1.5' }}>{val.description}</p>
              </div>
            ))}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0' }} />

        {/* Team Section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E293B' }}>Meet Our Leadership Team</h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem' }}>Building the future of smart commerce, day by day</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {teamMembers.map((member, idx) => (
              <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', textAlign: 'center', gap: '16px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '2px solid #E2E8F0' }}>
                  <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1E293B' }}>{member.name}</h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{member.role}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#57534e', lineHeight: '1.5', margin: 0 }}>
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </section>

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

    </div>
  );
};

export default AboutUs;
