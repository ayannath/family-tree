import React, { useState, useEffect } from 'react';
import useAdminPanel from './useAdminPanel';
import formConfig from './formConfig.json';

const AdminPanel = ({
  isDarkMode,
  selectedParent, setSelectedParent,
  familyData,
  handleAddMember,
  handleExportJSON,
  handleExportCSV,
  handleImportJSON,
  handleResetData,
  upcomingDates,
  editingId,
  handleUpdateMember,
  setEditingId,
  startEditing,
  handleDeleteMember,
  selectedNodeId,
  handleAddParent
}) => {
  const [deathDate, setDeathDate] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [showDeathDate, setShowDeathDate] = useState(false);
  const [showAnniversaryDate, setShowAnniversaryDate] = useState(false);

  useEffect(() => {
    if (editingId) {
      const node = familyData.find(n => n.id === editingId);
      if (node) {
        setDeathDate(node.deathDate || '');
        setAnniversaryDate(node.anniversaryDate || '');
        setShowDeathDate(!!node.deathDate);
        setShowAnniversaryDate(!!node.anniversaryDate);
      }
    } else {
      setDeathDate('');
      setAnniversaryDate('');
      setShowDeathDate(false);
      setShowAnniversaryDate(false);
    }
  }, [editingId, familyData]);

  const handleAddMemberWrapper = (data) => {
    const enhancedData = { ...data, deathDate, anniversaryDate };

    if (enhancedData.birthDate && enhancedData.deathDate) {
      if (new Date(enhancedData.deathDate) < new Date(enhancedData.birthDate)) {
        alert("Date of Demise cannot be before Date of Birth.");
        return;
      }
    }

    // If adding a step-child, link them to the partner instead of the selected node
    if (data.relation === 'step-child') {
      const parentNode = familyData.find(n => n.id === selectedParent);
      if (parentNode && parentNode.partnerId) {
        enhancedData.parentId = parentNode.partnerId;
      }
    } else if (data.relation === 'ex-spouse') {
      // Link as partner, but ensure not linked as child
      enhancedData.partnerId = selectedParent;
      enhancedData.parentId = null;
      enhancedData.notes = (enhancedData.notes ? enhancedData.notes + '\n' : '') + 'Status: Ex-Spouse';
    }
    handleAddMember(enhancedData);
    // Reset local state after add
    setDeathDate('');
    setAnniversaryDate('');
    setShowDeathDate(false);
    setShowAnniversaryDate(false);
  };

  const handleUpdateMemberWrapper = (id, data) => {
    const enhancedData = { ...data, deathDate, anniversaryDate };
    if (enhancedData.birthDate && enhancedData.deathDate) {
      if (new Date(enhancedData.deathDate) < new Date(enhancedData.birthDate)) {
        alert("Date of Demise cannot be before Date of Birth.");
        return;
      }
    }
    handleUpdateMember(id, enhancedData);
  };

  const {
    name, setName,
    notes, setNotes,
    birthDate, setBirthDate,
    gender, setGender,
    relation, setRelation,
    parentName, setParentName,
    parentGender, setParentGender,
    handlePictureUpload,
    onSubmit,
    onCancelEdit,
    onAddParent,
    facebookUrl, setFacebookUrl,
    profilePicture, setProfilePicture
  } = useAdminPanel({
    familyData,
    editingId,
    handleAddMember: handleAddMemberWrapper,
    handleUpdateMember: handleUpdateMemberWrapper,
    selectedParent,
    selectedNodeId,
    handleAddParent,
    setEditingId
  });

  const [fbId, setFbId] = useState('');
  const [fbToken, setFbToken] = useState(() => localStorage.getItem('fbToken') || '');
  const selectedNode = familyData.find(n => n.id === selectedNodeId);
  const referenceNode = familyData.find(n => n.id === selectedParent);

  const renderInput = (field) => {
    // Skip relation field if editing
    if (editingId && field.id === 'relation') return null;

    if (field.id === 'deathDate' && !showDeathDate) {
      return (
        <div key={field.id} style={{ marginBottom: '10px' }}>
          <button 
            onClick={() => setShowDeathDate(true)} 
            style={{ 
              width: '100%',
              padding: '6px',
              cursor: 'pointer',
              background: 'transparent',
              border: isDarkMode ? '1px dashed #555' : '1px dashed #999',
              color: isDarkMode ? '#aaa' : '#666',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            + Add Death Date
          </button>
        </div>
      );
    }

    if (field.id === 'anniversaryDate') {
      let partnerNode = null;
      if (editingId) {
        const currentNode = familyData.find(n => n.id === editingId);
        if (currentNode && currentNode.partnerId) {
          partnerNode = familyData.find(n => n.id === currentNode.partnerId);
        }
      } else if (relation === 'spouse') {
        partnerNode = referenceNode;
      }

      if (partnerNode && partnerNode.deathDate && deathDate) {
        return null;
      }

      if (!showAnniversaryDate) {
        return (
          <div key={field.id} style={{ marginBottom: '10px' }}>
            <button 
              onClick={() => setShowAnniversaryDate(true)} 
              style={{ 
                width: '100%',
                padding: '6px',
                cursor: 'pointer',
                background: 'transparent',
                border: isDarkMode ? '1px dashed #555' : '1px dashed #999',
                color: isDarkMode ? '#aaa' : '#666',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              + Add Anniversary
            </button>
          </div>
        );
      }
    }

    const stateMap = {
      name: { value: name, set: setName },
      notes: { value: notes, set: setNotes },
      birthDate: { value: birthDate, set: setBirthDate },
      gender: { value: gender, set: setGender },
      relation: { value: relation, set: setRelation },
      profilePicture: { set: handlePictureUpload },
      deathDate: { value: deathDate, set: setDeathDate },
      anniversaryDate: { value: anniversaryDate, set: setAnniversaryDate },
      facebookUrl: { value: facebookUrl, set: setFacebookUrl }
    };

    const { value, set } = stateMap[field.id] || {};
    if (!set) return null;

    const style = { 
      padding: '8px', 
      backgroundColor: isDarkMode ? '#2d2d2d' : 'white', 
      color: isDarkMode ? '#eee' : 'black', 
      border: isDarkMode ? '1px solid #555' : '1px solid #ccc',
      width: '100%',
      boxSizing: 'border-box'
    };

    if (field.type === 'textarea') return <textarea key={field.id} placeholder={field.placeholder} value={value} onChange={e => set(e.target.value)} style={{ ...style, minHeight: '60px', fontFamily: 'inherit', fontSize: 'inherit' }} />;
    if (field.type === 'select') {
      let options = [...field.options]; // Create a copy to avoid mutating the original config
      if (field.id === 'relation' && referenceNode && !referenceNode.parentId) {
        options = options.filter(opt => opt.value !== 'sibling');
      }
      // Add "Step Child" option if the selected node has a partner
      if (field.id === 'relation' && referenceNode && referenceNode.partnerId && !editingId) {
        options.push({ value: 'step-child', label: 'Step Child (Partner\'s Child)' });
      }
      if (field.id === 'relation' && !editingId) {
        options.push({ value: 'ex-spouse', label: 'Ex-Spouse' });
      }
      return <select key={field.id} value={value} onChange={e => set(e.target.value)} style={style}>{options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>;
    }
    if (field.type === 'file') {
      return (
        <div key={field.id} style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: isDarkMode ? '#ccc' : '#666', display: 'block', marginBottom: '5px' }}>{field.label}:</label>
          <input type="file" accept="image/*" onChange={set} style={{ fontSize: '12px', width: '100%' }} />
          {profilePicture && (
            <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={profilePicture} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: isDarkMode ? '1px solid #555' : '1px solid #ccc' }} />
              <button onClick={() => setProfilePicture(null)} style={{ padding: '2px 5px', fontSize: '10px', cursor: 'pointer', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px' }}>Remove</button>
            </div>
          )}
        </div>
      );
    }
    
    if (field.type === 'date') {
      const isOptional = field.id === 'deathDate' || field.id === 'anniversaryDate';
      return (
        <div key={field.id}>
          <label style={{ fontSize: '12px', color: isDarkMode ? '#ccc' : '#666', display: 'block', marginBottom: '5px' }}>{field.label}:</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input type={field.type} placeholder={field.placeholder} value={value} onChange={e => set(e.target.value)} style={{ ...style, flex: 1 }} />
            {isOptional && (
              <button 
                onClick={() => {
                  if (field.id === 'deathDate') { setShowDeathDate(false); setDeathDate(''); }
                  if (field.id === 'anniversaryDate') { setShowAnniversaryDate(false); setAnniversaryDate(''); }
                }}
                style={{ padding: '0 8px', cursor: 'pointer', background: 'transparent', border: isDarkMode ? '1px solid #555' : '1px solid #ccc', color: isDarkMode ? '#eee' : 'black', borderRadius: '4px' }}
                title="Remove"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      );
    }
    
    if (field.id === 'facebookUrl') {
      return (
        <div key={field.id} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <input 
            type={field.type} 
            placeholder={field.placeholder} 
            value={value} 
            onChange={e => set(e.target.value)} 
            style={{...style, flex: 1}} 
          />
          <button 
            onClick={() => window.open(value, '_blank', 'noopener,noreferrer')} 
            disabled={!value}
            style={{ padding: '8px', cursor: value ? 'pointer' : 'not-allowed', background: isDarkMode ? '#333' : '#eee', border: isDarkMode ? '1px solid #555' : '1px solid #ccc', color: isDarkMode ? '#eee' : 'black', borderRadius: '4px' }}
            title="Open Facebook Profile"
          >
            🔗
          </button>
        </div>
      );
    }
    
    return <input key={field.id} type={field.type} placeholder={field.placeholder} value={value} onChange={e => set(e.target.value)} style={style} />;
  };

  useEffect(() => {
    localStorage.setItem('fbToken', fbToken);
  }, [fbToken]);

  const handleFbFetch = async () => {
    if (!fbId || !fbToken) {
      alert("Please provide both Facebook User ID and Access Token.");
      return;
    }
    try {
      // Fetch basic fields and profile picture
      const response = await fetch(`https://graph.facebook.com/${fbId}?fields=name,gender,birthday,picture.type(large)&access_token=${fbToken}`);
      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      if (data.name) setName(data.name);
      if (data.gender) setGender(data.gender === 'male' ? 'male' : data.gender === 'female' ? 'female' : 'other');
      if (data.birthday) {
        // FB format is MM/DD/YYYY, convert to YYYY-MM-DD
        const parts = data.birthday.split('/');
        if (parts.length === 3) setBirthDate(`${parts[2]}-${parts[0]}-${parts[1]}`);
      }
      if (data.picture && data.picture.data && data.picture.data.url) {
        // Fetch the image blob to simulate a file upload
        const imgRes = await fetch(data.picture.data.url);
        const blob = await imgRes.blob();
        const file = new File([blob], "fb-profile.jpg", { type: "image/jpeg" });
        handlePictureUpload({ target: { files: [file] } });
      }
    } catch (error) {
      alert("Error fetching Facebook data: " + error.message);
    }
  };

  const handleValidateToken = async () => {
    if (!fbToken) {
      alert("Please enter an Access Token.");
      return;
    }
    try {
      const response = await fetch(`https://graph.facebook.com/me?access_token=${fbToken}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      alert(`Token is valid for user: ${data.name} (ID: ${data.id})`);
      if (!fbId) setFbId(data.id);
    } catch (error) {
      alert("Token validation failed: " + error.message);
    }
  };

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      right: 0, 
      width: '350px', 
      height: '100%', 
      background: isDarkMode ? '#1e1e1e' : 'white', 
      padding: '20px', 
      boxSizing: 'border-box', 
      borderLeft: isDarkMode ? '1px solid #333' : '1px solid #ddd', 
      overflowY: 'auto', 
      zIndex: 200,
      boxShadow: '-2px 0 10px rgba(0,0,0,0.1)'
    }}>
      <h3>Admin Panel</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginTop: 0 }}>{editingId ? 'Edit Member' : 'Add Member'}</h4>
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!editingId && (
              <div style={{ padding: '10px', border: isDarkMode ? '1px solid #444' : '1px solid #eee', borderRadius: '4px', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>Autofill from Facebook</div>
                <input type="text" placeholder="Facebook User ID" value={fbId} onChange={e => setFbId(e.target.value)} style={{ width: '100%', padding: '5px', marginBottom: '5px', boxSizing: 'border-box', fontSize: '12px' }} />
                <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                  <input type="text" placeholder="Access Token" value={fbToken} onChange={e => setFbToken(e.target.value)} style={{ flex: 1, padding: '5px', boxSizing: 'border-box', fontSize: '12px' }} />
                  <button onClick={handleValidateToken} style={{ padding: '5px', background: '#673AB7', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Validate</button>
                </div>
                <button onClick={handleFbFetch} style={{ width: '100%', padding: '5px', background: '#1877F2', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Fetch Details</button>
              </div>
            )}
            {formConfig.map(field => renderInput(field))}
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onSubmit} style={{ flex: 1, padding: '8px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
                {editingId ? 'Update Member' : 'Add Member'}
              </button>
              {editingId && (
                <button onClick={onCancelEdit} style={{ flex: 1, padding: '8px', background: '#777', color: 'white', border: 'none', cursor: 'pointer' }}>Cancel</button>
              )}
            </div>
        </div>
      </div>

      <hr />
      <h4>Upcoming Important Dates</h4>
      {upcomingDates.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px' }}>
          {upcomingDates.map(d => (
            <li key={d.id} style={{ marginBottom: '8px', padding: '8px', background: isDarkMode ? '#2d2d2d' : '#fff', border: isDarkMode ? '1px solid #444' : '1px solid #eee', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold' }}>{d.name} <span style={{ fontWeight: 'normal', fontSize: '12px', color: isDarkMode ? '#aaa' : '#666' }}>- {d.type}</span></div>
              <div style={{ fontSize: '12px', color: isDarkMode ? '#aaa' : '#666' }}>
                {d.date.toLocaleDateString()} ({d.type === 'Birthday' ? 'Turning ' : ''}{d.years}{d.type !== 'Birthday' ? ' years' : ''})
                <br/>
                {d.diffDays === 0 ? 'Today!' : `In ${d.diffDays} days`}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ fontSize: '14px', color: isDarkMode ? '#aaa' : '#666', marginBottom: '20px' }}>No upcoming dates found.</div>
      )}

      <hr />
      <h4>Data Management</h4>
      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handleExportJSON} style={{ padding: '8px', background: '#FF9800', color: 'white', border: 'none', cursor: 'pointer' }}>Export JSON</button>
        <button onClick={handleExportCSV} style={{ padding: '8px', background: '#009688', color: 'white', border: 'none', cursor: 'pointer' }}>Export CSV</button>
        <label style={{ padding: '8px', background: '#2196F3', color: 'white', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
          Import JSON
          <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
        </label>
        <button onClick={handleResetData} style={{ padding: '8px', background: '#f44336', color: 'white', border: 'none', cursor: 'pointer' }}>Reset to Default</button>
      </div>
    </div>
  );
};

export default AdminPanel;