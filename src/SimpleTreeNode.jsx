const SimpleTreeNode = ({ node, isDarkMode }) => {
  return (
    <li>
      <div style={{ 
          border: isDarkMode ? '1px solid #555' : '1px solid #ccc', 
          padding: '2px', 
          background: isDarkMode ? '#2d2d2d' : 'white', 
          display: 'inline-block',
          borderRadius: '2px'
      }}>
         <div style={{ width: '20px', height: '10px', background: isDarkMode ? '#555' : '#eee' }}></div>
      </div>
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <SimpleTreeNode key={child.id} node={child} isDarkMode={isDarkMode} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default SimpleTreeNode;