import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import './App.css'
import TreeNode from './TreeNode'
import Minimap from './Minimap'
import TimelineView from './TimelineView'
import RadialTreeView from './RadialTreeView'
import AdminPanel from './AdminPanel'
import ContextMenu from './ContextMenu'
import { initialFamilyData } from './initialData'
import AuthPage from './AuthPage'
import ProfilePage from './ProfilePage'
import { familyService } from './familyService'

function App() {
  // Initial flat data for the family tree
  const [familyData, setFamilyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedParent, setSelectedParent] = useState(() => {
    return familyData && familyData.length > 0 ? familyData[0].id : '';
  });
  const [editingId, setEditingId] = useState(null);
  const [viewState, setViewState] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const hasCenteredRef = useRef(false);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') !== 'false';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) return JSON.parse(saved);
    const sessionSaved = sessionStorage.getItem('currentUser');
    return sessionSaved ? JSON.parse(sessionSaved) : null;
  });
  const [filterType, setFilterType] = useState('all');
  const [selectedNodeId, setSelectedNodeId] = useState(() => {
    return familyData && familyData.length > 0 ? familyData[0].id : null;
  });
  const [familyTitles, setFamilyTitles] = useState(() => {
    const saved = localStorage.getItem('familyTitles');
    return saved ? JSON.parse(saved) : {};
  });
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [expandAction, setExpandAction] = useState(null);
  const [layout, setLayout] = useState('horizontal');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'timeline'
  const [isAllExpanded, setIsAllExpanded] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState([]);

  const addToHistory = useCallback(() => {
    setHistory(prev => [...prev, familyData]);
    setRedoStack([]);
  }, [familyData]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previousData = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, familyData]);
    setFamilyData(previousData);
  }, [history, familyData]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextData = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setHistory(prev => [...prev, familyData]);
    setFamilyData(nextData);
  }, [redoStack, familyData]);

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      familyService.getUserTree(currentUser.id).then(data => {
        const loadedData = data || JSON.parse(JSON.stringify(initialFamilyData));
        setFamilyData(loadedData);
        if (loadedData && loadedData.length > 0) {
          setSelectedNodeId(loadedData[0].id);
          setSelectedParent(loadedData[0].id);
        }
        setIsLoading(false);
      });
    }
  }, [currentUser]);

  useEffect(() => {
    // Save to "DB" whenever familyData changes, but only if loaded
    if (currentUser && !isLoading && familyData.length > 0) {
      familyService.saveUserTree(currentUser.id, familyData);
    }
  }, [familyData, currentUser, isLoading]);

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (selectedNodeId !== null) {
      localStorage.setItem('selectedNodeId', String(selectedNodeId));
    } else {
      localStorage.removeItem('selectedNodeId');
    }
  }, [selectedNodeId]);

  useEffect(() => {
    localStorage.setItem('familyTitles', JSON.stringify(familyTitles));
  }, [familyTitles]);

  useEffect(() => {
    hasCenteredRef.current = false;
    
    // Trigger global search if term is long enough
    if (searchTerm.length > 2 && currentUser) {
      familyService.searchGlobal(searchTerm, currentUser.id).then(results => {
        setGlobalSearchResults(results);
      });
    } else {
      setGlobalSearchResults([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setIsMenuOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setContextMenu(null);
      }
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNodeContextMenu = (e, node) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node: node
    });
  };

  const handleCenterNode = useCallback((nodeElement) => {
    if (hasCenteredRef.current || !containerRef.current || !nodeElement) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const nodeRect = nodeElement.getBoundingClientRect();

    const deltaX = (containerRect.width / 2) - (nodeRect.left - containerRect.left + nodeRect.width / 2);
    const deltaY = (containerRect.height / 2) - (nodeRect.top - containerRect.top + nodeRect.height / 2);

    setViewState(prev => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    hasCenteredRef.current = true;
  }, []);

  // Convert flat list to tree structure
  const fullTreeData = useMemo(() => {
    const dataMap = {};
    const tree = [];

    // 1. Initialize map
    familyData.forEach(item => {
      dataMap[item.id] = { ...item, children: [], partner: null };
    });

    // 2. Identify secondary partners
    const secondaryIds = new Set();
    familyData.forEach(item => {
      if (item.partnerId) {
        const partner = dataMap[item.partnerId]; // Optimization: Use map instead of find
        if (partner) {
           let isItemSecondary = false;
           if (partner.parentId && !item.parentId) isItemSecondary = true;
           else if ((partner.parentId && item.parentId) || (!partner.parentId && !item.parentId)) {
             if (item.id > partner.id) isItemSecondary = true;
           }
           
           if (isItemSecondary) secondaryIds.add(item.id);
        }
      }
    });

    // 3. Link children to parents
    familyData.forEach(item => {
      // Allow secondary nodes to be linked to parents so we can traverse up

      if (item.parentId && dataMap[item.parentId]) {
        dataMap[item.parentId].children.push(dataMap[item.id]);
      }
    });

    // 4. Link partners (Bidirectional)
    familyData.forEach(item => {
      if (item.partnerId) {
        const node = dataMap[item.id];
        const partnerNode = dataMap[item.partnerId];
        if (partnerNode) node.partner = partnerNode;
      }
    });

    // 5. Handle secondary nodes (merge children) and build tree roots
    familyData.forEach(item => {
      if (secondaryIds.has(item.id)) return;

      const node = dataMap[item.id];
      
      if (item.partnerId) {
        const partnerNode = dataMap[item.partnerId];
        if (partnerNode && secondaryIds.has(item.partnerId)) {
           // Move partner's children to this node to ensure they appear under the couple
           node.children.push(...partnerNode.children);
        }
      }

      if (!item.parentId) {
         tree.push(node);
      }
    });

    return { roots: tree, dataMap, secondaryIds };
  }, [familyData]);

  const treeData = useMemo(() => {
    const { roots: tree, dataMap, secondaryIds } = fullTreeData;

    if (filterType === 'descendants' && selectedNodeId && dataMap[selectedNodeId]) {
      return [dataMap[selectedNodeId]];
    }

    // If a node is selected, only show the tree that contains it.
    if (selectedNodeId) {
      const findRootForNode = (nodeId) => {
        if (secondaryIds.has(nodeId)) {
          const node = dataMap[nodeId];
          if (node && !node.parentId && node.partnerId) {
            nodeId = node.partnerId;
          }
        }

        let current = dataMap[nodeId];
        if (!current) return null;
        while (current.parentId && dataMap[current.parentId]) {
          current = dataMap[current.parentId];
        }
        return current;
      };

      const activeRoot = findRootForNode(selectedNodeId);
      if (activeRoot) {
        return [activeRoot];
      }
    }

    return tree;
  }, [fullTreeData, filterType, selectedNodeId]);

  const timelineData = useMemo(() => {
    const visibleIds = new Set();
    const traverse = (node) => {
      if (!node || visibleIds.has(node.id)) return;
      visibleIds.add(node.id);
      if (node.partner) visibleIds.add(node.partner.id);
      if (node.children) node.children.forEach(traverse);
    };
    treeData.forEach(traverse);
    return familyData.filter(n => visibleIds.has(n.id));
  }, [treeData, familyData]);

  const currentRootId = useMemo(() => {
    if (!selectedNodeId) return null;
    const { dataMap, secondaryIds } = fullTreeData;
    
    if (secondaryIds.has(selectedNodeId)) {
      const node = dataMap[selectedNodeId];
      if (node && !node.parentId && node.partnerId) {
        return node.partnerId; // Return partner as root if secondary is root-like
      }
    }

    let current = dataMap[selectedNodeId];
    if (!current) return null;
    while (current.parentId && dataMap[current.parentId]) {
      current = dataMap[current.parentId];
    }
    return current.id;
  }, [selectedNodeId, fullTreeData]);

  const upcomingDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    const dates = [];

    const processDate = (dateStr, type, suffix, member) => {
      if (!dateStr) return;
      const parts = dateStr.split('-').map(Number);
      if (parts.length !== 3) return;
      const [year, month, day] = parts;
      
      let nextDate = new Date(currentYear, month - 1, day);
      if (nextDate < today) nextDate.setFullYear(currentYear + 1);
      
      const diffTime = nextDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const years = nextDate.getFullYear() - year;
      
      dates.push({
        id: member.id + suffix,
        name: member.name,
        type,
        date: nextDate,
        diffDays,
        years
      });
    };

    familyData.forEach(m => {
      processDate(m.birthDate, 'Birthday', '_dob', m);
      processDate(m.deathDate, 'Death Anniversary', '_dod', m);
      processDate(m.anniversaryDate, 'Anniversary', '_doa', m);
    });

    return dates.sort((a, b) => a.diffDays - b.diffDays).slice(0, 3);
  }, [familyData]);

  const pathIds = useMemo(() => {
    const ids = new Set();
    if (!selectedNodeId) return ids;

    const getPathToRoot = (startId) => {
      const path = [];
      let current = familyData.find(n => n.id === startId);
      while (current) {
        path.push(current.id);
        current = familyData.find(n => n.id === current.parentId);
      }
      return path;
    };

    if (selectedNodeId && targetNodeId) {
      const pathA = getPathToRoot(selectedNodeId);
      const pathB = getPathToRoot(targetNodeId);
      
      let lcaId = null;
      for (const id of pathA) {
        if (pathB.includes(id)) {
          lcaId = id;
          break;
        }
      }

      if (lcaId) {
        for (const id of pathA) {
          ids.add(id);
          if (id === lcaId) break;
        }
        for (const id of pathB) {
          ids.add(id);
          if (id === lcaId) break;
        }
      } else {
        ids.add(selectedNodeId);
        ids.add(targetNodeId);
      }
    } else {
      getPathToRoot(selectedNodeId).forEach(id => ids.add(id));
    }
    return ids;
  }, [selectedNodeId, targetNodeId, familyData]);

  const descendantCounts = useMemo(() => {
    const counts = {};
    const childrenMap = {};

    familyData.forEach(m => {
      if (m.parentId) {
        if (!childrenMap[m.parentId]) childrenMap[m.parentId] = [];
        childrenMap[m.parentId].push(m.id);
      }
    });

    const getCount = (id) => {
      if (counts[id] !== undefined) return counts[id];
      
      const children = childrenMap[id] || [];
      let count = 0;
      
      children.forEach(childId => {
        count += 1 + getCount(childId);
      });
      
      counts[id] = count;
      return count;
    };

    familyData.forEach(m => getCount(m.id));
    return counts;
  }, [familyData]);

  const highlightedIds = useMemo(() => {
    if (!searchTerm.trim()) return new Set();

    const lowerSearch = searchTerm.toLowerCase().trim();
    const ids = new Set();

    // Regex for relationships
    const siblingMatch = lowerSearch.match(/^(?:siblings?|brothers?|sisters?) of (.+)$/);
    const childMatch = lowerSearch.match(/^(?:children|kids?|sons?|daughters?) of (.+)$/);
    const parentMatch = lowerSearch.match(/^(?:parents?|father|mother|mom|dad) of (.+)$/);

    if (siblingMatch) {
      const targetName = siblingMatch[1].trim();
      const targetNodes = familyData.filter(n => n.name.toLowerCase().includes(targetName));
      targetNodes.forEach(target => {
        if (target.parentId) {
            familyData.forEach(n => {
                if (n.parentId === target.parentId && n.id !== target.id) {
                    ids.add(n.id);
                }
            });
        }
      });
    } else if (childMatch) {
      const targetName = childMatch[1].trim();
      const targetNodes = familyData.filter(n => n.name.toLowerCase().includes(targetName));
      targetNodes.forEach(target => {
        familyData.forEach(n => {
            if (n.parentId === target.id) {
                ids.add(n.id);
            }
        });
      });
    } else if (parentMatch) {
      const targetName = parentMatch[1].trim();
      const targetNodes = familyData.filter(n => n.name.toLowerCase().includes(targetName));
      targetNodes.forEach(target => {
        if (target.parentId) {
            ids.add(target.parentId);
        }
      });
    } else {
      // Default search
      familyData.forEach(n => {
        if (n.name.toLowerCase().includes(lowerSearch)) {
            ids.add(n.id);
        }
      });
    }

    return ids;
  }, [searchTerm, familyData]);

  const searchResults = useMemo(() => familyData.filter(n => highlightedIds.has(n.id)), [familyData, highlightedIds]);

  const handleAddMember = (memberData) => {
    if (!memberData.name.trim()) return;
    addToHistory();
    
    // Determine parentId and partnerId
    // If memberData has them explicitly, use them. Otherwise default to selectedParent logic.
    let parentId = memberData.parentId;
    let partnerId = memberData.partnerId || null;

    if (parentId === undefined) {
        parentId = selectedParent ? Number(selectedParent) : null;
    }

    const newMember = {
      id: Date.now(),
      name: memberData.name,
      notes: memberData.notes,
      birthDate: memberData.birthDate || null,
      deathDate: memberData.deathDate || null,
      anniversaryDate: memberData.anniversaryDate || null,
      profilePicture: memberData.profilePicture,
      gender: memberData.gender,
      partnerId: partnerId,
      parentId: parentId,
      facebookUrl: memberData.facebookUrl || null,
    };

    let updatedData = [...familyData, newMember];

    // If partnerId is set, update the partner to point to new member
    if (partnerId) {
        updatedData = updatedData.map(m => 
            m.id === partnerId ? { ...m, partnerId: newMember.id } : m
        );
        
        // Sync anniversary date with partner if provided
        if (newMember.anniversaryDate) {
          updatedData = updatedData.map(m => 
            m.id === partnerId ? { ...m, anniversaryDate: newMember.anniversaryDate } : m
          );
        }
    }

    setFamilyData(updatedData);
  };

  const handleDeleteMember = (id) => {
    addToHistory();
    
    const nodeToDelete = familyData.find(n => n.id === id);
    if (!nodeToDelete) return;

    // 1. Remove the node
    let updatedData = familyData.filter(item => item.id !== id);

    // 2. Handle children and partner
    const partnerId = nodeToDelete.partnerId;
    
    updatedData = updatedData.map(item => {
      // If this item was a child of the deleted node
      if (item.parentId === id) {
        return { ...item, parentId: partnerId || null };
      }
      // If this item was the partner of the deleted node
      if (item.id === partnerId) {
        return { ...item, partnerId: null };
      }
      return item;
    });

    // 3. Update selection if the deleted node was selected
    if (selectedNodeId === id) {
      if (nodeToDelete.parentId) {
        setSelectedNodeId(nodeToDelete.parentId);
        setSelectedParent(nodeToDelete.parentId);
      } else if (partnerId) {
        setSelectedNodeId(partnerId);
        setSelectedParent(partnerId);
      } else {
        setSelectedNodeId(null);
        setSelectedParent('');
      }
      setEditingId(null);
    }

    setFamilyData(updatedData);
  };

  const startEditing = (member) => {
    setEditingId(member.id);
  };

  const handleUpdateMember = (id, memberData) => {
    if (!memberData.name.trim()) return;
    addToHistory();
    let updatedData = familyData.map(item => 
      item.id === id ? { 
        ...item, 
        name: memberData.name, 
        notes: memberData.notes, 
        birthDate: memberData.birthDate, 
        profilePicture: memberData.profilePicture,
        gender: memberData.gender,
        deathDate: memberData.deathDate,
        anniversaryDate: memberData.anniversaryDate,
        facebookUrl: memberData.facebookUrl
      } : item
    );

    // Sync anniversary date with partner
    const updatedMember = updatedData.find(m => m.id === id);
    if (updatedMember && updatedMember.partnerId && memberData.anniversaryDate !== undefined) {
      updatedData = updatedData.map(m => 
        m.id === updatedMember.partnerId ? { ...m, anniversaryDate: memberData.anniversaryDate } : m
      );
    }

    setFamilyData(updatedData);
    setEditingId(null);
  };

  const handleMoveNode = (draggedId, targetId) => {
    if (draggedId === targetId) return;

    // Cycle detection
    let current = familyData.find(item => item.id === targetId);
    while (current) {
      if (current.id === draggedId) {
        alert("Cannot move a node into its own descendant.");
        return;
      }
      current = familyData.find(item => item.id === current.parentId);
    }

    addToHistory();
    setFamilyData(prev => prev.map(item => 
      item.id === draggedId ? { ...item, parentId: targetId } : item
    ));
  };

  const handleWheel = (e) => {
    const scaleAdjustment = -e.deltaY * 0.001;
    const newScale = Math.max(0.1, Math.min(viewState.scale + scaleAdjustment, 3));
    setViewState(prev => ({ ...prev, scale: newScale }));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    setViewState(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(familyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'family-tree.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['id', 'name', 'parentId', 'partnerId', 'birthDate', 'deathDate', 'anniversaryDate', 'notes', 'profilePicture', 'gender'];
    const csvRows = [headers.join(',')];

    for (const row of familyData) {
      const values = headers.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '';
        const stringVal = String(val);
        return `"${stringVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'family-tree.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          addToHistory();
          setFamilyData(importedData);
        } else {
          alert('Invalid data format. Expected an array.');
        }
      } catch (error) {
        alert('Error parsing JSON file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleResetData = () => {
    const confirmationMessage = "WARNING: This will delete all your current family tree data and reset it to the default state. All your work will be lost.\n\nIt is highly recommended to export your data to a JSON file before proceeding.\n\nAre you sure you want to continue?";
    if (window.confirm(confirmationMessage)) {
      addToHistory();
      setFamilyData(JSON.parse(JSON.stringify(initialFamilyData)));
    }
  };

  const handleNodeSelect = (id, isMulti) => {
    if (isMulti) {
      if (id === selectedNodeId) return;
      setTargetNodeId(prev => prev === id ? null : id);
    } else {
      setSelectedNodeId(id);
      setTargetNodeId(null);
      setSelectedParent(id);
      setEditingId(id);
    }
  };

  const handleFocusPath = () => {
    if (selectedNodeId) {
      setExpandAction({ type: 'focusPath', id: Date.now() });
    }
  };

  const handleContextAdd = (node) => {
    setIsAdmin(true);
    setContextMenu(null);
    setSelectedParent(node.id);
    setEditingId(null);
  };

  const handleTitleClick = () => {
    const isSingleTree = treeData.length === 1;
    const key = isSingleTree ? treeData[0].id : 'global';
    const defaultTitle = isSingleTree ? `${treeData[0].name} Family Tree` : 'Family Tree Project';
    const currentTitle = familyTitles[key] || defaultTitle;

    const newTitle = prompt("Enter family tree name:", currentTitle);
    if (newTitle !== null) {
      const trimmed = newTitle.trim();
      setFamilyTitles(prev => {
        const next = { ...prev };
        if (trimmed === "") delete next[key];
        else next[key] = trimmed;
        return next;
      });
    }
  };

  const handleClearSelection = () => {
    if (familyData.length > 0) {
      let current = familyData[0];
      while (current.parentId) {
        const parent = familyData.find(n => n.id === current.parentId);
        if (!parent) break;
        current = parent;
      }
      setSelectedNodeId(current.id);
      setEditingId(null);
      setViewState({ scale: 1, x: 0, y: 0 });
    } else {
      setSelectedNodeId(null);
      setEditingId(null);
    }
  };

  const toggleExpandAll = () => {
    const newExpandedState = !isAllExpanded;
    setIsAllExpanded(newExpandedState);
    setExpandAction({ type: newExpandedState ? 'expandAll' : 'collapseAll', id: Date.now() });
  };

  const handleLogin = (user, rememberMe) => {
    setCurrentUser(user);
    if (rememberMe) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    if (localStorage.getItem('currentUser')) {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    if (sessionStorage.getItem('currentUser')) {
      sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (userId) => {
    // Remove user from users list
    const users = JSON.parse(localStorage.getItem('family_tree_users') || '[]');
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('family_tree_users', JSON.stringify(updatedUsers));

    familyService.deleteUserTree(userId);
    handleLogout();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    setIsAdmin(false);
    setShowProfile(false);
  };

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
  }

  if (isLoading) {
    return <div className={`loading-screen ${isDarkMode ? 'dark-mode' : ''}`}>Loading Family Tree...</div>;
  }

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="app-header">
        <h1 className="header-title" onClick={handleTitleClick} title="Click to rename">
          {treeData.length === 1 ? (familyTitles[treeData[0].id] || `${treeData[0].name} Family Tree`) : (familyTitles['global'] || 'Family Tree Project')}
          <span style={{ fontSize: '0.8rem', marginLeft: '10px', opacity: 0.5 }}>✎</span>
        </h1>
        <div className="header-controls">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search family..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="clear-search-btn"
              >✕</button>
            )}
          </div>

          <div className="menu-container">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} 
              className="menu-btn"
            >
              <span>☰</span> Menu
            </button>
            
            {isMenuOpen && (
              <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="menu-header">
                  Signed in as <strong>{currentUser.name}</strong>
                </div>
                
                <button onClick={() => { setShowProfile(true); setIsMenuOpen(false); }} className="menu-item">👤 Profile</button>
                <button onClick={() => { setViewMode(v => v === 'tree' ? 'timeline' : 'tree'); setIsMenuOpen(false); }} className="menu-item">{viewMode === 'tree' ? '📅 Timeline View' : '🌳 Tree View'}</button>
                <button onClick={() => { setLayout(l => l === 'horizontal' ? 'vertical' : l === 'vertical' ? 'radial' : 'horizontal'); setIsMenuOpen(false); }} className="menu-item">{layout === 'horizontal' ? '↕ Vertical Layout' : layout === 'vertical' ? '◎ Radial Layout' : '↔ Horizontal Layout'}</button>
                <button onClick={() => { setIsDarkMode(!isDarkMode); setIsMenuOpen(false); }} className="menu-item">{isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
                <button onClick={() => { setIsAdmin(!isAdmin); setIsMenuOpen(false); }} className="menu-item">{isAdmin ? '🔒 Close Admin' : '🔓 Open Admin'}</button>
                
                <div className="menu-divider"></div>
                <button onClick={handleLogout} className="menu-item logout-btn">🚪 Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {searchTerm && (
        <div className="search-overlay" onClick={() => setSearchTerm('')}>
          <div className="search-results-content" onClick={e => e.stopPropagation()}>
            <h3 className="search-results-title">Search Results ({searchResults.length})</h3>
            
            <div className="search-results-list">
              {searchResults.length > 0 ? searchResults.map(node => (
                <div 
                  key={node.id}
                  onClick={() => { handleNodeSelect(node.id); setSearchTerm(''); }}
                  className="search-result-item"
                >
                  {node.profilePicture ? (
                    <img src={node.profilePicture} alt={node.name} className="search-result-avatar" />
                  ) : (
                    <div className="search-result-placeholder">{node.gender === 'female' ? '👩' : '👨'}</div>
                  )}
                  <div>
                    <div className="search-result-name">{node.name} {node.deathDate && '🪦'}</div>
                    <div className="search-result-details">
                      {node.birthDate ? `Born: ${node.birthDate}` : 'No birth date'} 
                      {node.parentId ? '' : ' (Root Member)'}
                    </div>
                  </div>
                </div>
              )) : null}
              
              {searchResults.length === 0 && globalSearchResults.length === 0 && (
                <div className="timeline-empty">No members found matching "{searchTerm}"</div>
              )}
            </div>

            {globalSearchResults.length > 0 && (
              <>
                <h3 className="global-results-divider">Results from Other Trees</h3>
                <div className="search-results-list">
                  {globalSearchResults.map((node, idx) => (
                    <div 
                      key={`global-${idx}`}
                      className="global-result-item"
                    >
                      <div className="global-result-left">
                        <div className="global-result-avatar">{node.gender === 'female' ? '👩' : '👨'}</div>
                        <div>
                          <div className="search-result-name">{node.name}</div>
                          <div className="search-result-details">
                            Tree Owner: <strong>{node.ownerName}</strong>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleSuggestEdit(node, node.ownerName)} className="suggest-btn">Suggest Input</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {showProfile ? (
          <ProfilePage 
            currentUser={currentUser} 
            onUpdateUser={handleUpdateUser} 
            onDeleteUser={handleDeleteUser}
            onBack={() => setShowProfile(false)} 
            isDarkMode={isDarkMode} 
          />
        ) : (
        <>
        {viewMode === 'tree' && (
        <div className="sidebar-controls">
          <div className="sidebar-content">
          <div className="sidebar-select-container">
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              className="sidebar-select"
            >
              <option value="all">Show All Relationships</option>
              <option value="descendants">Show Direct Descendants</option>
            </select>
          </div>
          {filterType === 'descendants' && !selectedNodeId && (
            <div className="sidebar-info">
              Select a node to view descendants
            </div>
          )}
          {selectedNodeId && !targetNodeId && (
            <div className="sidebar-hint">
              Ctrl+Click another node to find shortest path
            </div>
          )}
          {selectedNodeId && (
            <div className="toolbar-row">
              <button onClick={toggleExpandAll} className="toolbar-btn">{isAllExpanded ? 'Collapse All' : 'Expand All'}</button>
              <button onClick={handleClearSelection} className="toolbar-btn">Own Family</button>
            </div>
          )}
          <div className="toolbar-row">
            <button 
              onClick={handleUndo} 
              disabled={history.length === 0} 
              title="Undo"
              className="toolbar-btn"
            >
              <span className="toolbar-btn-icon">↺</span>
            </button>
            <button 
              onClick={handleRedo} 
              disabled={redoStack.length === 0} 
              title="Redo"
              className="toolbar-btn"
            >
              <span className="toolbar-btn-icon">↻</span>
            </button>
            <button 
              onClick={() => setViewState(s => ({ ...s, scale: s.scale + 0.1 }))} 
              title="Zoom In"
              className="toolbar-btn"
            >
              <span className="toolbar-btn-icon">+</span>
            </button>
            <button 
              onClick={() => setViewState(s => ({ ...s, scale: s.scale - 0.1 }))} 
              title="Zoom Out"
              className="toolbar-btn"
            >
              <span className="toolbar-btn-icon">-</span>
            </button>
            <button 
              onClick={() => setViewState({ scale: 1, x: 0, y: 0 })} 
              title="Reset View"
              className="toolbar-btn"
            >
              <span className="toolbar-btn-icon">⌖</span>
            </button>
          </div>
          </div>
        </div>
        )}

        {viewMode === 'tree' ? (
          <div 
            ref={containerRef}
            className="tree-view-container"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <Minimap treeData={treeData} viewState={viewState} containerRef={containerRef} contentRef={contentRef} isDarkMode={isDarkMode} layout={layout} />
            <div className={`tree ${layout === 'vertical' ? 'vertical' : ''}`} ref={contentRef} style={layout === 'radial' ? {
              transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
              transformOrigin: '0 0',
              width: 'fit-content',
              height: 'fit-content'
            } : {
              transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
              transformOrigin: '0 0',
              width: 'fit-content',
              padding: '20px'
            }}>
            {layout === 'radial' ? <RadialTreeView treeData={treeData} isDarkMode={isDarkMode} onNodeSelect={handleNodeSelect} selectedNodeId={selectedNodeId} targetNodeId={targetNodeId} onContextMenu={handleNodeContextMenu} highlightedIds={highlightedIds} /> : <ul>{treeData.map(root => <TreeNode key={root.id} node={root} highlightedIds={highlightedIds} onCenter={handleCenterNode} onMoveNode={handleMoveNode} onContextMenu={handleNodeContextMenu} isDarkMode={isDarkMode} selectedNodeId={selectedNodeId} targetNodeId={targetNodeId} onSelect={handleNodeSelect} pathIds={pathIds} expandAction={expandAction} descendantCounts={descendantCounts}  />)}</ul>}
          </div>
        </div>
        ) : (
          <div className="timeline-view-wrapper">
            <TimelineView familyData={timelineData} isDarkMode={isDarkMode} secondaryIds={fullTreeData.secondaryIds} />
          </div>
        )}

        {isAdmin && (
          <AdminPanel
            isDarkMode={isDarkMode}
            selectedParent={selectedParent} setSelectedParent={setSelectedParent}
            familyData={familyData}
            handleAddMember={handleAddMember}
            handleExportJSON={handleExportJSON}
            handleExportCSV={handleExportCSV}
            handleImportJSON={handleImportJSON}
            handleResetData={handleResetData}
            upcomingDates={upcomingDates}
            editingId={editingId}
            handleUpdateMember={handleUpdateMember}
            setEditingId={setEditingId}
            startEditing={startEditing}
            handleDeleteMember={handleDeleteMember}
            selectedNodeId={selectedNodeId}
          />
        )}

        <ContextMenu 
          contextMenu={contextMenu} 
          handleContextAdd={handleContextAdd} 
          handleDeleteMember={handleDeleteMember} 
        />
        </>
        )}
      </div>
    </div>
  )
}

export default App
