const ContextMenu = ({ contextMenu, handleContextAdd, handleDeleteMember }) => {
  if (!contextMenu) return null;

  return (
    <div style={{
      top: contextMenu.y,
      left: contextMenu.x,
    }} className="context-menu">
      <div className="context-menu-item" onClick={() => handleContextAdd(contextMenu.node)}>
        Add Member
      </div>
      <div 
        className="context-menu-item"
        style={{ color: '#d32f2f' }}
        onClick={() => handleDeleteMember(contextMenu.node.id)}
      >
        Delete
      </div>
    </div>
  );
};

export default ContextMenu;