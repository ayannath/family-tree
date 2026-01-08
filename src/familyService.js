export const familyService = {
  getUserTree: (userId) => {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        const key = `family_tree_data_${userId}`;
        const data = localStorage.getItem(key);
        resolve(data ? JSON.parse(data) : null);
      }, 300);
    });
  },

  saveUserTree: (userId, data) => {
    return new Promise((resolve) => {
      const key = `family_tree_data_${userId}`;
      localStorage.setItem(key, JSON.stringify(data));
      resolve(true);
    });
  },

  searchGlobal: (term, currentUserId) => {
    return new Promise((resolve) => {
      const users = JSON.parse(localStorage.getItem('family_tree_users') || '[]');
      let results = [];
      
      users.forEach(user => {
        if (user.id === currentUserId) return;
        
        const treeKey = `family_tree_data_${user.id}`;
        const rawData = localStorage.getItem(treeKey);
        if (rawData) {
          const tree = JSON.parse(rawData);
          const matches = tree.filter(node => 
            node.name.toLowerCase().includes(term.toLowerCase())
          );
          
          if (matches.length > 0) {
            results.push(...matches.map(m => ({ ...m, ownerName: user.name, ownerId: user.id })));
          }
        }
      });
      
      resolve(results);
    });
  },

  deleteUserTree: (userId) => {
    return new Promise((resolve) => {
      localStorage.removeItem(`family_tree_data_${userId}`);
      resolve(true);
    });
  }
};