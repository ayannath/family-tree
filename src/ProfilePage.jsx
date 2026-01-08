import React, { useState, useEffect } from 'react';

const ProfilePage = ({ currentUser, onUpdateUser, onBack, isDarkMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        password: currentUser.password || ''
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, Email and Password are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Update in the main users list in localStorage
    const users = JSON.parse(localStorage.getItem('family_tree_users') || '[]');
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, ...formData };
      }
      return u;
    });

    localStorage.setItem('family_tree_users', JSON.stringify(updatedUsers));
    
    // Update current user state in the app
    const updatedUser = { ...currentUser, ...formData };
    onUpdateUser(updatedUser);
    setMessage('Profile updated successfully!');
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '4px',
    border: isDarkMode ? '1px solid #555' : '1px solid #ccc',
    backgroundColor: isDarkMode ? '#2d2d2d' : 'white',
    color: isDarkMode ? '#eee' : 'black',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginRight: '10px'
  };

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '40px auto', 
      padding: '30px', 
      backgroundColor: isDarkMode ? '#1e1e1e' : 'white', 
      borderRadius: '8px', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      color: isDarkMode ? '#eee' : 'black'
    }}>
      <h2 style={{ marginTop: 0, borderBottom: isDarkMode ? '1px solid #333' : '1px solid #eee', paddingBottom: '10px' }}>Edit Profile</h2>
      
      {message && <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{message}</div>}
      {error && <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Full Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} />
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Email Address</label>
        <input type="text" name="email" value={formData.email} onChange={handleChange} style={inputStyle} />
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Phone Number</label>
        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} />
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Password</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} style={inputStyle} />

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onBack} style={{ ...buttonStyle, backgroundColor: 'transparent', color: isDarkMode ? '#aaa' : '#666', border: isDarkMode ? '1px solid #555' : '1px solid #ccc' }}>Cancel</button>
          <button type="submit" style={buttonStyle}>Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;