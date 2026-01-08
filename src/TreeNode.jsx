import { useState, useRef, useEffect } from 'react';
import NodeCard from './NodeCard';

const TreeNode = ({ node, highlightedIds, onCenter, onMoveNode, onContextMenu, isDarkMode, selectedNodeId, targetNodeId, onSelect, pathIds, expandAction, descendantCounts }) => {
  const isPath = pathIds && pathIds.has(node.id);
  const childInPath = node.children && node.children.some(child => pathIds && pathIds.has(child.id));
  const [expanded, setExpanded] = useState(true);
  const prevActionRef = useRef(null);

  useEffect(() => {
    if (expandAction && expandAction !== prevActionRef.current) {
      prevActionRef.current = expandAction;
      if (expandAction.type === 'focusPath' && pathIds) {
        setExpanded(pathIds.has(node.id));
      } else if (expandAction.type === 'expandAll') {
        setExpanded(true);
      } else if (expandAction.type === 'collapseAll') {
        setExpanded(false);
      }
    }
  }, [expandAction, pathIds, node.id]);
  
  // Helper to get props for NodeCard
  const getNodeProps = (n) => {
    let count = descendantCounts ? (descendantCounts[n.id] || 0) : 0;
    
    // Combine descendant counts for partners
    if (node.partner) {
      const partnerId = (n.id === node.id) ? node.partner.id : node.id;
      count += descendantCounts ? (descendantCounts[partnerId] || 0) : 0;
    }

    return {
      node: n,
      isHighlighted: highlightedIds && highlightedIds.has(n.id),
      isSelected: selectedNodeId === n.id,
      isTarget: targetNodeId === n.id,
      isPath: pathIds && pathIds.has(n.id),
      isDarkMode,
      descendantCount: count,
    };
  };

  const hasChildren = node.children && node.children.length > 0;

  return (
    <li className={isPath ? 'path-node' : ''}>
      <div className="couple-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Ghost Partner Node for centering if partner exists */}
        {node.partner && (
          <div style={{ visibility: 'hidden', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            <NodeCard 
              {...getNodeProps(node.partner)}
              onMoveNode={undefined}
              onContextMenu={undefined}
              onSelect={undefined}
              onCenter={undefined}
              isHighlighted={false}
              isSelected={false}
              isTarget={false}
              isPath={false}
              isSecondary={true}
            />
            <div className="partner-connector" style={{ width: '30px', height: '2px', margin: '0 5px' }}></div>
          </div>
        )}

        {/* Primary Node */}
        <NodeCard 
          {...getNodeProps(node)} 
          onMoveNode={onMoveNode} 
          onContextMenu={onContextMenu} 
          onSelect={onSelect} 
          onCenter={onCenter}
          highlightedIds={highlightedIds}
        />
        
        {/* Partner Node (if exists) */}
        {node.partner && (
          <>
            <div className="partner-connector" style={{ width: '30px', height: '2px', backgroundColor: isDarkMode ? '#555' : '#ccc', margin: '0 5px' }}></div>
            <NodeCard 
              {...getNodeProps(node.partner)} 
              onMoveNode={onMoveNode} 
              onContextMenu={onContextMenu} 
              onSelect={onSelect} 
              onCenter={onCenter}
              highlightedIds={highlightedIds}
              isSecondary={true}
            />
          </>
        )}
      </div>

      {hasChildren && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            margin: '5px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            width: '20px', height: '20px', borderRadius: '50%', 
            border: isDarkMode ? '1px solid #555' : '1px solid #ccc', 
            background: isDarkMode ? '#2d2d2d' : '#fff', 
            color: isDarkMode ? '#eee' : 'black', 
            padding: 0
          }}
        >
          {expanded ? '-' : '+'}
        </button>
      )}

      {hasChildren && expanded && (
        <ul className={childInPath ? 'path-branch' : ''}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} highlightedIds={highlightedIds} onCenter={onCenter} onMoveNode={onMoveNode} onContextMenu={onContextMenu} isDarkMode={isDarkMode} selectedNodeId={selectedNodeId} targetNodeId={targetNodeId} onSelect={onSelect} pathIds={pathIds} expandAction={expandAction} descendantCounts={descendantCounts}  />
          ))}
        </ul>
      )}
    </li>
  );
};

export default TreeNode;