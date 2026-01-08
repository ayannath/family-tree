import React, { useState, useEffect } from 'react';

const AuthPage = ({ onLogin, isDarkMode, setIsDarkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(0); // 0: email, 1: otp, 2: new password
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : '2554761014938991', // Replace with your actual App ID
        cookie     : true,
        xfbml      : true,
        version    : 'v19.0'
      });
    };

    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "https://connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
     }(document, 'script', 'facebook-jssdk'));
  }, []);

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      // To use a local image: import bgImage from './assets/background.jpg' and use `url(${bgImage})`
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    card: {
      width: '100%',
      maxWidth: '420px',
      padding: '40px',
      backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(12px)',
      borderRadius: '24px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.5)',
      textAlign: 'center',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
    },
    header: {
      marginBottom: '32px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#111827',
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '14px',
      color: isDarkMode ? '#9ca3af' : '#6b7280',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      marginBottom: '16px',
      borderRadius: '8px',
      border: isDarkMode ? '1px solid #444' : '1px solid #e0e0e0',
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
      color: isDarkMode ? '#ffffff' : '#111827',
      fontSize: '15px',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.2s',
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      marginTop: '8px',
    },
    link: {
      color: '#3b82f6',
      cursor: 'pointer',
      fontWeight: '500',
    },
    socialButton: {
      width: '100%',
      padding: '12px',
      backgroundColor: isDarkMode ? 'transparent' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#111827',
      border: isDarkMode ? '1px solid #374151' : '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '12px',
      transition: 'all 0.2s',
    },
    dividerContainer: {
      display: 'flex',
      alignItems: 'center',
      margin: '24px 0',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
    },
    dividerText: {
      padding: '0 16px',
      color: isDarkMode ? '#9ca3af' : '#6b7280',
      fontSize: '14px',
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setResetMessage('');
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded yet. Please check your internet connection.');
      return;
    }

    window.FB.login((response) => {
      if (response.status === 'connected') {
        window.FB.api('/me', { fields: 'name,email,picture' }, (profile) => {
          const users = JSON.parse(localStorage.getItem('family_tree_users') || '[]');
          const fbId = 'fb_' + profile.id;
          
          // Try to find existing user by FB ID or Email
          let user = users.find(u => u.id === fbId || (profile.email && u.email === profile.email));

          if (!user) {
            // Create new user from FB profile
            user = {
              id: fbId,
              name: profile.name,
              email: profile.email || '',
              phone: '',
              password: '', // No password for social login
              profilePicture: profile.picture?.data?.url,
              provider: 'facebook'
            };
            localStorage.setItem('family_tree_users', JSON.stringify([...users, user]));
          }
          
          onLogin(user, true);
        });
      } else {
        setError('Facebook login cancelled or failed.');
      }
    }, { scope: 'public_profile,email' });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');

    if (resetStep === 0) {
      if (!formData.email) {
        setError('Please enter your email address');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      const users = JSON.parse(localStorage.getItem('family_tree_users') || '[]');
      const user = users.find(u => u.email === formData.email);

      if (user) {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedOtp(code);
        setResetStep(1);
        setResetMessage(`Verification code sent to ${formData.email}`);
        setTimeout(() => alert(`[Simulation] Your password reset code is: ${code}`), 100);
      } else {
        setError('Email address not found');
      }
    } else if (resetStep === 1) {
      if (otp === generatedOtp) {
        setResetStep(2);
        setResetMessage('Code verified. Please enter new password.');
        setError('');
      } else {
        setError('Invalid verification code');
      }
    } else if (resetStep === 2) {
      if (!formData.password || formData.password !== formData.confirmPassword) {
        setError('Passwords do not match or are empty');
        return;
      }
      const users = JSON.parse(localStorage.getItem('family_tree_users') || '[]');
      const updatedUsers = users.map(u => u.email === formData.email ? { ...u, password: formData.password } : u);
      localStorage.setItem('family_tree_users', JSON.stringify(updatedUsers));
      
      setIsForgotPassword(false);
      setIsLogin(true);
      setResetStep(0);
      setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
      setResetMessage('Password updated successfully. Please sign in.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Simple local storage simulation for users
    const users = JSON.parse(localStorage.getItem('family_tree_users') || '[]');

    if (isLogin) {
      // Login logic
      const user = users.find(u => 
        (u.email === formData.email || u.phone === formData.email) && 
        u.password === formData.password
      );

      if (user) {
        onLogin(user, rememberMe);
      } else {
        setError('Invalid email/phone or password');
      }
    } else {
      // Registration logic
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        setError('Please fill in all fields');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (users.some(u => u.email === formData.email)) {
        setError('Email already registered');
        return;
      }
      
      if (users.some(u => u.phone === formData.phone)) {
        setError('Phone number already registered');
        return;
      }

      const newUser = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      };

      localStorage.setItem('family_tree_users', JSON.stringify([...users, newUser]));
      onLogin(newUser, true);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {isForgotPassword ? 'Reset Password' : (isLogin ? 'Amar Paribar' : 'Create Account')}
          </h2>
          <p style={styles.subtitle}>
            {isForgotPassword ? 'Enter your details to reset' : (isLogin ? 'Enter your credentials to access your account' : 'Start building your family tree today')}
          </p>
        </div>
        
        {error && (
          <div style={{...styles.subtitle, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left'}}>
            {error}
          </div>
        )}

        {resetMessage && (
          <div style={{...styles.subtitle, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left'}}>
            {resetMessage}
          </div>
        )}

        <form onSubmit={isForgotPassword ? handleResetPassword : handleSubmit}>
          {!isForgotPassword && !isLogin && <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} style={styles.input} />}
          
          {/* Email Input: Hide during reset password step */}
          {(!isForgotPassword || resetStep === 0) && (
            <input type="text" name="email" placeholder={isForgotPassword ? "Enter your email" : (isLogin ? "Email or Phone" : "Email Address")} value={formData.email} onChange={handleChange} style={styles.input} />
          )}
          
          {!isForgotPassword && !isLogin && <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} style={styles.input} />}
          
          {isForgotPassword && resetStep === 1 && (
            <input 
              type="text" 
              placeholder="Enter Verification Code" 
              value={otp} 
              onChange={(e) => { setOtp(e.target.value); setError(''); }}
              style={styles.input} 
            />
          )}

          {/* Password Inputs: Show for Login, Register, or Reset Step 2 */}
          {(!isForgotPassword || resetStep === 2) && (
            <input type="password" name="password" placeholder={resetStep === 2 ? "New Password" : "Password"} value={formData.password} onChange={handleChange} style={styles.input} />
          )}
          {((!isForgotPassword && !isLogin) || (isForgotPassword && resetStep === 2)) && (
            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} style={styles.input} />
          )}

          {!isForgotPassword && isLogin && (
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px'}}>
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer'}} 
              />
              <label htmlFor="rememberMe" style={{fontSize: '14px', color: isDarkMode ? '#d1d5db' : '#4b5563', cursor: 'pointer'}}>Remember Me</label>
            </div>
          )}

          <button type="submit" style={styles.button}>{isForgotPassword ? (resetStep === 2 ? 'Reset Password' : (resetStep === 1 ? 'Verify Code' : 'Send Reset Link')) : (isLogin ? 'Sign In' : 'Register')}</button>
        </form>

        {!isForgotPassword && isLogin && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <span onClick={() => { setIsForgotPassword(true); setError(''); setResetMessage(''); setResetStep(0); setOtp(''); }} style={{...styles.link, fontSize: '14px'}}>
              Forgot Password?
            </span>
          </div>
        )}

        {!isForgotPassword && (
          <>
            <div style={styles.dividerContainer}>
              <div style={styles.dividerLine}></div>
              <span style={styles.dividerText}>Or continue with</span>
              <div style={styles.dividerLine}></div>
            </div>

            <button type="button" style={styles.socialButton} onClick={() => alert('Google login not implemented')}>
              <span style={{ fontWeight: 'bold', color: '#EA4335', fontSize: '18px' }}>G</span> Google
            </button>
            <button type="button" style={styles.socialButton} onClick={handleFacebookLogin}>
              <span style={{ fontWeight: 'bold', color: '#1877F2', fontSize: '18px' }}>f</span> Facebook
            </button>
          </>
        )}

        <div style={{marginTop: '30px', fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
          {isForgotPassword ? (
            <span onClick={() => { setIsForgotPassword(false); setError(''); setResetMessage(''); setResetStep(0); setOtp(''); }} style={styles.link}>
              Back to Sign In
            </span>
          ) : (
            <>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' }); }} style={styles.link}>
                {isLogin ? 'Register' : 'Sign In'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;