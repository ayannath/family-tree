import React from 'react';

const Header = ({
  viewMode, setViewMode,
  layout, setLayout,
  isDarkMode, setIsDarkMode,
  handleUndo, handleRedo,
  history, redoStack,
  isAdmin, setIsAdmin
}) => {
  return (
    <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #eee', backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', zIndex: 10 }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Family Tree Project</h1>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => setViewMode(v => v === 'tree' ? 'timeline' : 'tree')} style={{ padding: '8px 16px', cursor: 'pointer', background: 'transparent', border: isDarkMode ? '1px solid #555' : '1px solid #ccc', color: isDarkMode ? '#eee' : 'black', borderRadius: '4px' }}>{viewMode === 'tree' ? '📅 Timeline' : '🌳 Tree'}</button>
        <button onClick={() => setLayout(l => l === 'horizontal' ? 'vertical' : l === 'vertical' ? 'radial' : 'horizontal')} style={{ padding: '8px 16px', cursor: 'pointer', background: 'transparent', border: isDarkMode ? '1px solid #555' : '1px solid #ccc', color: isDarkMode ? '#eee' : 'black', borderRadius: '4px' }}>{layout === 'horizontal' ? '↕ Vertical' : layout === 'vertical' ? '◎ Radial' : '↔ Horizontal'}</button>
        <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ padding: '8px 16px', cursor: 'pointer', background: 'transparent', border: isDarkMode ? '1px solid #555' : '1px solid #ccc', color: isDarkMode ? '#eee' : 'black', borderRadius: '4px' }}>{isDarkMode ? '☀️ Light' : '🌙 Dark'}</button>
        <button onClick={handleUndo} disabled={history.length === 0} style={{ padding: '8px 16px', cursor: history.length === 0 ? 'not-allowed' : 'pointer', opacity: history.length === 0 ? 0.5 : 1 }}>Undo</button>
        <button onClick={handleRedo} disabled={redoStack.length === 0} style={{ padding: '8px 16px', cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer', opacity: redoStack.length === 0 ? 0.5 : 1 }}>Redo</button>
        <button onClick={() => setIsAdmin(!isAdmin)} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {isAdmin ? 'Close Admin' : 'Open Admin Panel'}
        </button>
      </div>
    </div>
  );
};

export default Header;