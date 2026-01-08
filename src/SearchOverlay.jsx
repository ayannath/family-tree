import React from 'react';

const SearchOverlay = ({
  searchTerm, setSearchTerm,
  isDarkMode,
  filterType, setFilterType,
  selectedNodeId, targetNodeId,
  handleFocusPath
}) => {
  return (
    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, width: '300px', display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto' }}>
        <input
          type="text"
          placeholder="Search for a member..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '10px', width: '100%', boxSizing: 'border-box', borderRadius: '4px', border: isDarkMode ? '1px solid #555' : '1px solid #ccc', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: isDarkMode ? '#2d2d2d' : 'white', color: isDarkMode ? '#eee' : 'black' }}
        />
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '5px' }}>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '8px', flex: 1, borderRadius: '4px', border: isDarkMode ? '1px solid #555' : '1px solid #ccc', backgroundColor: isDarkMode ? '#2d2d2d' : 'white', color: isDarkMode ? '#eee' : 'black' }}
          >
            <option value="all">Show All Relationships</option>
            <option value="descendants">Show Direct Descendants</option>
          </select>
        </div>
        {filterType === 'descendants' && !selectedNodeId && (
          <div style={{ padding: '8px', background: '#ff9800', color: 'white', borderRadius: '4px', fontSize: '14px', marginTop: '5px' }}>
            Select a node to view descendants
          </div>
        )}
        {selectedNodeId && !targetNodeId && (
          <div style={{ fontSize: '12px', color: isDarkMode ? '#aaa' : '#666', padding: '5px' }}>
            Ctrl+Click another node to find shortest path
          </div>
        )}
        {selectedNodeId && (
          <button onClick={handleFocusPath} style={{ marginTop: '5px', width: '100%', padding: '8px', cursor: 'pointer', borderRadius: '4px', border: isDarkMode ? '1px solid #555' : '1px solid #ccc', backgroundColor: isDarkMode ? '#2d2d2d' : 'white', color: isDarkMode ? '#eee' : 'black' }}>Collapse All Except Path</button>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;