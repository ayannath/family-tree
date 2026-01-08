import React, { useState } from 'react';

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setResetMessage('');
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

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
    border: isDarkMode ? '1px solid #555' : '1px solid #ccc',
    backgroundColor: isDarkMode ? '#2d2d2d' : 'white',
    color: isDarkMode ? '#eee' : 'black',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px'
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: isDarkMode ? '#121212' : '#f0f2f5',
      color: isDarkMode ? '#eee' : 'black',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '30px',
        backgroundColor: isDarkMode ? '#1e1e1e' : 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>{isForgotPassword ? 'Reset Password' : (isLogin ? 'Sign In' : 'Create Account')}</h2>
        
        {error && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {resetMessage && (
          <div style={{ 
            backgroundColor: '#e8f5e9', 
            color: '#2e7d32', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            {resetMessage}
          </div>
        )}

        <form onSubmit={isForgotPassword ? handleResetPassword : handleSubmit}>
          {!isForgotPassword && !isLogin && <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} style={inputStyle} />}
          
          {/* Email Input: Hide during reset password step */}
          {(!isForgotPassword || resetStep === 0) && (
            <input type="text" name="email" placeholder={isForgotPassword ? "Enter your email" : (isLogin ? "Email or Phone" : "Email Address")} value={formData.email} onChange={handleChange} style={inputStyle} />
          )}
          
          {!isForgotPassword && !isLogin && <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} style={inputStyle} />}
          
          {isForgotPassword && resetStep === 1 && (
            <input 
              type="text" 
              placeholder="Enter Verification Code" 
              value={otp} 
              onChange={(e) => { setOtp(e.target.value); setError(''); }} 
              style={inputStyle} 
            />
          )}

          {/* Password Inputs: Show for Login, Register, or Reset Step 2 */}
          {(!isForgotPassword || resetStep === 2) && (
            <input type="password" name="password" placeholder={resetStep === 2 ? "New Password" : "Password"} value={formData.password} onChange={handleChange} style={inputStyle} />
          )}
          {((!isForgotPassword && !isLogin) || (isForgotPassword && resetStep === 2)) && (
            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} style={inputStyle} />
          )}

          {!isForgotPassword && isLogin && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', fontSize: '14px' }}>
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer' }} 
              />
              <label htmlFor="rememberMe" style={{ cursor: 'pointer' }}>Remember Me</label>
            </div>
          )}

          <button type="submit" style={buttonStyle}>{isForgotPassword ? (resetStep === 2 ? 'Reset Password' : (resetStep === 1 ? 'Verify Code' : 'Send Reset Link')) : (isLogin ? 'Sign In' : 'Register')}</button>
        </form>

        {!isForgotPassword && isLogin && (
          <div style={{ textAlign: 'right', marginTop: '10px' }}>
            <span onClick={() => { setIsForgotPassword(true); setError(''); setResetMessage(''); setResetStep(0); setOtp(''); }} style={{ color: '#2196F3', cursor: 'pointer', fontSize: '14px' }}>
              Forgot Password?
            </span>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          {isForgotPassword ? (
            <span onClick={() => { setIsForgotPassword(false); setError(''); setResetMessage(''); setResetStep(0); setOtp(''); }} style={{ color: '#2196F3', cursor: 'pointer', fontWeight: 'bold' }}>
              Back to Sign In
            </span>
          ) : (
            <>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' }); }} style={{ color: '#2196F3', cursor: 'pointer', fontWeight: 'bold' }}>
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