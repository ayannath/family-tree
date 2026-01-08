import React, { useState, useEffect } from 'react';

const ProfilePage = ({ currentUser, onUpdateUser, onDeleteUser, onBack, isDarkMode }) => {
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

  const handleDeleteAccount = () => {
    if (window.confirm("WARNING: Are you sure you want to permanently delete your account? This action cannot be undone and all your family tree data will be lost.")) {
      onDeleteUser(currentUser.id);
    }
  };

  return (
    <div className={`profile-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <h2 className="profile-header">Edit Profile</h2>
      
      {message && <div className="auth-message">{message}</div>}
      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label className="profile-label">Full Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} className="profile-input" />
        <label className="profile-label">Email Address</label>
        <input type="text" name="email" value={formData.email} onChange={handleChange} className="profile-input" />
        <label className="profile-label">Phone Number</label>
        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="profile-input" />
        <label className="profile-label">Password</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} className="profile-input" />

        <div className="profile-btn-group">
          <button type="button" onClick={handleDeleteAccount} className="profile-btn profile-btn-delete">Delete Account</button>
          <div>
            <button type="button" onClick={onBack} className="profile-btn profile-btn-cancel">Cancel</button>
            <button type="submit" className="profile-btn">Save Changes</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;