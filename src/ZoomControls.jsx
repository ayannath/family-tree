import React from 'react';

const ZoomControls = ({ setViewState, isDarkMode }) => {
  return (
    <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 100, display: 'flex', gap: '5px' }}>
      <button onClick={() => setViewState(s => ({ ...s, scale: s.scale + 0.1 }))} style={{ width: '30px', height: '30px', backgroundColor: isDarkMode ? '#2d2d2d' : '#efefef', color: isDarkMode ? '#eee' : 'black', border: isDarkMode ? '1px solid #555' : '1px solid #767676' }}>+</button>
      <button onClick={() => setViewState(s => ({ ...s, scale: s.scale - 0.1 }))} style={{ width: '30px', height: '30px', backgroundColor: isDarkMode ? '#2d2d2d' : '#efefef', color: isDarkMode ? '#eee' : 'black', border: isDarkMode ? '1px solid #555' : '1px solid #767676' }}>-</button>
      <button onClick={() => setViewState({ scale: 1, x: 0, y: 0 })} style={{ height: '30px', backgroundColor: isDarkMode ? '#2d2d2d' : '#efefef', color: isDarkMode ? '#eee' : 'black', border: isDarkMode ? '1px solid #555' : '1px solid #767676' }}>Reset</button>
    </div>
  );
};

export default ZoomControls;