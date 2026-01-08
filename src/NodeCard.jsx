import { useState, useRef, useEffect } from 'react';
import { calculateAge } from './helpers';

const calculateLifeDuration = (birthDate, deathDate) => {
  if (!birthDate) return '';
  const start = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();
  let age = end.getFullYear() - start.getFullYear();
  const m = end.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < start.getDate())) {
    age--;
  }
  return age;
};

const NodeCard = ({ node, isHighlighted, isSelected, isTarget, isPath, isDarkMode, descendantCount, onMoveNode, onSelect, onContextMenu, onCenter, isSecondary }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (isHighlighted && onCenter) {
      onCenter(nodeRef.current);
    }
  }, [isHighlighted, onCenter]);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', node.id);
    e.stopPropagation();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = Number(e.dataTransfer.getData('text/plain'));
    if (draggedId !== node.id) {
      onMoveNode(draggedId, node.id);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) onContextMenu(e, node);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (onSelect) onSelect(node.id, e.ctrlKey || e.metaKey);
  };

  return (
      <div 
        ref={nodeRef} 
        className="node-card" 
        style={{ backgroundColor: isHighlighted ? (isDarkMode ? '#8B8000' : '#fff799') : (isDarkMode ? '#2d2d2d' : 'white'), color: isDarkMode ? '#eee' : 'black', cursor: 'grab', position: 'relative', border: isSelected ? (node.gender === 'female' ? '2px solid #FF69B4' : '2px solid #2196F3') : (isTarget ? '2px solid #4CAF50' : (isPath ? '2px solid #ff9800' : (isDarkMode ? `1px ${isSecondary ? 'dashed' : 'solid'} #555` : `1px ${isSecondary ? 'dashed' : 'solid'} #ccc`))), margin: '0 5px' }}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      >
        {node.profilePicture && (
          <img src={node.profilePicture} alt={node.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto 5px auto' }} />
        )}
        <strong>{node.name} {node.deathDate && '🪦'}</strong>
        <span style={{ fontSize: '12px', marginLeft: '5px', color: isDarkMode ? '#bbb' : '#666' }}>
          ({descendantCount})
        </span>
        {showTooltip && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '6px 10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none'
          }}>
            <div>ID: {node.id}</div>
            <div>Parent ID: {node.parentId || 'None'}</div>
            {node.birthDate && <div>Born: {node.birthDate} ({node.deathDate ? 'Died at' : 'Age'}: {calculateLifeDuration(node.birthDate, node.deathDate)})</div>}
            {node.deathDate && <div>Died: {node.deathDate}</div>}
            {node.notes && (
              <div style={{
                marginTop: '5px',
                paddingTop: '5px',
                borderTop: '1px solid rgba(255,255,255,0.5)',
                maxWidth: '200px',
                whiteSpace: 'normal'
              }}>
                {node.notes}
              </div>
            )}
          </div>
        )}
      </div>
  );
};

export default NodeCard;