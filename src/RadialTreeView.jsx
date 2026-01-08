import { useMemo } from 'react';

const RadialTreeView = ({ treeData, isDarkMode, onNodeSelect, selectedNodeId, targetNodeId, onContextMenu, highlightedIds }) => {
  const { nodes, links, width, height, center } = useMemo(() => {
    const nodesList = [];
    const linksList = [];
    
    // Helper to count leaves for angular width
    const traverseCount = (node) => {
      if (!node.children || node.children.length === 0) {
        node._leaves = 1;
      } else {
        node._leaves = 0;
        node.children.forEach(c => {
           node._leaves += traverseCount(c);
        });
      }
      return node._leaves;
    };

    let totalLeaves = 0;
    treeData.forEach(root => {
       totalLeaves += traverseCount(root);
    });

    const radiusStep = 120;
    
    const traversePos = (node, startAngle, endAngle, depth) => {
      const angle = (startAngle + endAngle) / 2;
      const r = depth * radiusStep;
      // Convert polar to cartesian (subtract PI/2 to start at 12 o'clock)
      const x = r * Math.cos(angle - Math.PI / 2);
      const y = r * Math.sin(angle - Math.PI / 2);
      
      nodesList.push({ ...node, x, y, angle: (angle * 180 / Math.PI) });
      
      if (node.children) {
         let currentAngle = startAngle;
         node.children.forEach(child => {
            const wedge = (endAngle - startAngle) * (child._leaves / node._leaves);
            traversePos(child, currentAngle, currentAngle + wedge, depth + 1);
            currentAngle += wedge;
         });
      }
    };

    let currentAngle = 0;
    treeData.forEach(root => {
       const wedge = (2 * Math.PI) * (root._leaves / totalLeaves);
       traversePos(root, currentAngle, currentAngle + wedge, treeData.length > 1 ? 1 : 0);
       currentAngle += wedge;
    });

    // Generate links
    const nodeMap = new Map(nodesList.map(n => [n.id, n]));
    nodesList.forEach(n => {
       if (n.parentId && nodeMap.has(n.parentId)) {
          linksList.push({ source: nodeMap.get(n.parentId), target: n });
       }
    });

    // Calculate bounds to center the tree
    if (nodesList.length === 0) return { nodes: [], links: [], width: 0, height: 0, center: {x:0, y:0} };

    const xs = nodesList.map(n => n.x);
    const ys = nodesList.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = 100;
    const w = maxX - minX + padding * 2;
    const h = maxY - minY + padding * 2;
    
    // Shift nodes
    const shiftX = -minX + padding;
    const shiftY = -minY + padding;
    
    nodesList.forEach(n => {
      n.x += shiftX;
      n.y += shiftY;
    });

    return { nodes: nodesList, links: linksList, width: w, height: h, center: { x: shiftX, y: shiftY } };
  }, [treeData]);

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <g>
        {links.map((link, i) => (
          <line 
            key={i}
            x1={link.source.x} y1={link.source.y}
            x2={link.target.x} y2={link.target.y}
            className="radial-link"
          />
        ))}
        {nodes.map(node => {
          const isSelected = selectedNodeId === node.id;
          const isTarget = targetNodeId === node.id;
          const isHighlighted = highlightedIds && highlightedIds.has(node.id);
          
          return (
            <g 
              key={node.id} 
              transform={`translate(${node.x}, ${node.y})`}
              className="radial-node"
              onClick={(e) => { e.stopPropagation(); onNodeSelect(node.id, e.ctrlKey || e.metaKey); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node); }}
            >
              <circle r="25" fill={isHighlighted ? (isDarkMode ? '#8B8000' : '#fff799') : (isDarkMode ? '#2d2d2d' : 'white')} stroke={isSelected ? (node.gender === 'female' ? '#FF69B4' : '#2196F3') : (isTarget ? '#4CAF50' : (isDarkMode ? '#555' : '#ccc'))} strokeWidth={isSelected || isTarget ? 3 : 1} className="node-bg" />
              {node.profilePicture && (
                <image href={node.profilePicture} x="-20" y="-20" height="40" width="40" style={{ clipPath: 'circle(20px at center)' }} />
              )}
              <text y={node.profilePicture ? 35 : 5} textAnchor="middle" fill={isDarkMode ? '#eee' : 'black'} fontSize="12px" style={{ pointerEvents: 'none', textShadow: isDarkMode ? '0 0 3px #000' : '0 0 3px #fff' }}>{node.name} {node.deathDate && '🪦'}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default RadialTreeView;