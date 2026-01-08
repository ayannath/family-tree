import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import './App.css'
import TreeNode from './TreeNode'
import Minimap from './Minimap'
import TimelineView from './TimelineView'
import RadialTreeView from './RadialTreeView'
import AdminPanel from './AdminPanel'
import ContextMenu from './ContextMenu'
import { initialFamilyData } from './initialData'
import Header from './Header'
import SearchOverlay from './SearchOverlay'
import ZoomControls from './ZoomControls'

function App() {
  // Initial flat data for the family tree
  const [familyData, setFamilyData] = useState(() => {
    const saved = localStorage.getItem('familyTreeData');
    return saved ? JSON.parse(saved) : initialFamilyData;
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedParent, setSelectedParent] = useState('');
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
    return localStorage.getItem('darkMode') === 'true';
  });
  const [filterType, setFilterType] = useState('all');
  const [selectedNodeId, setSelectedNodeId] = useState(() => {
    const saved = localStorage.getItem('selectedNodeId');
    if (saved) return Number(saved);

    const savedData = localStorage.getItem('familyTreeData');
    const data = savedData ? JSON.parse(savedData) : initialFamilyData;
    return data && data.length > 0 ? data[0].id : null;
  });
  const [familyTitles, setFamilyTitles] = useState(() => {
    const saved = localStorage.getItem('familyTitles');
    return saved ? JSON.parse(saved) : {};
  });
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [expandAction, setExpandAction] = useState(null);
  const [layout, setLayout] = useState('horizontal');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'timeline'
  const [pendingAction, setPendingAction] = useState(null); // { type: 'add_parent', targetId: number }
  const [isAllExpanded, setIsAllExpanded] = useState(true);

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
    localStorage.setItem('familyTreeData', JSON.stringify(familyData));
  }, [familyData]);

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
  }, [searchTerm]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
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
  const treeData = useMemo(() => {
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

    // 4. Handle partners and build tree roots
    familyData.forEach(item => {
      if (secondaryIds.has(item.id)) return;

      const node = dataMap[item.id];
      
      if (item.partnerId) {
        const partnerNode = dataMap[item.partnerId];
        // Always link partner for bidirectional navigation/display
        if (partnerNode) node.partner = partnerNode;

        if (secondaryIds.has(item.partnerId)) {
           // Move partner's children to this node to ensure they appear under the couple
           node.children.push(...partnerNode.children);
        }
      }

      if (!item.parentId) {
         tree.push(node);
      }
    });

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
  }, [familyData, filterType, selectedNodeId]);

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

    // Handle pending actions (e.g., adding a parent)
    if (pendingAction && pendingAction.type === 'add_parent') {
      const targetNodeIndex = updatedData.findIndex(n => n.id === pendingAction.targetId);
      if (targetNodeIndex !== -1) {
        const targetNode = { ...updatedData[targetNodeIndex] };
        if (!targetNode.parentId) {
          // If target has no parent, set new member as parent
          targetNode.parentId = newMember.id;
          updatedData[targetNodeIndex] = targetNode;
        } else {
          // If target already has a parent, link new member as partner to existing parent
          const existingParentIndex = updatedData.findIndex(n => n.id === targetNode.parentId);
          if (existingParentIndex !== -1) {
            const existingParent = { ...updatedData[existingParentIndex] };
            
            if (existingParent.partnerId) {
              const oldPartnerIndex = updatedData.findIndex(n => n.id === existingParent.partnerId);
              if (oldPartnerIndex !== -1) {
                updatedData[oldPartnerIndex] = { ...updatedData[oldPartnerIndex], partnerId: null };
              }
            }
            
            existingParent.partnerId = newMember.id;
            updatedData[existingParentIndex] = existingParent;
            // Update newMember partnerId as well (it is the last element)
            updatedData[updatedData.length - 1] = { ...newMember, partnerId: existingParent.id };
          }
        }
      }
    }

    setFamilyData(updatedData);
    setPendingAction(null);
  };

  const handleAddParent = (childId, parentData) => {
    const child = familyData.find(n => n.id === childId);
    if (!child) return;

    addToHistory();
    
    const newParent = {
      id: Date.now(),
      name: parentData.name,
      gender: parentData.gender,
      notes: parentData.notes || '',
      birthDate: parentData.birthDate || null,
      profilePicture: parentData.profilePicture || null,
      facebookUrl: parentData.facebookUrl || null,
      parentId: null,
      partnerId: null
    };

    let updatedData = [...familyData, newParent];
    const childIndex = updatedData.findIndex(n => n.id === childId);
    const updatedChild = { ...updatedData[childIndex] };

    if (!updatedChild.parentId) {
      updatedChild.parentId = newParent.id;
      updatedData[childIndex] = updatedChild;
    } else {
      const existingParentIndex = updatedData.findIndex(n => n.id === updatedChild.parentId);
      if (existingParentIndex !== -1) {
        const existingParent = { ...updatedData[existingParentIndex] };
        
        if (existingParent.partnerId) {
          const oldPartnerIndex = updatedData.findIndex(n => n.id === existingParent.partnerId);
          if (oldPartnerIndex !== -1) {
            updatedData[oldPartnerIndex] = { ...updatedData[oldPartnerIndex], partnerId: null };
          }
        }
        
        existingParent.partnerId = newParent.id;
        newParent.partnerId = existingParent.id;
        updatedData[existingParentIndex] = existingParent;
        updatedData[updatedData.length - 1] = newParent;
      }
    }

    setFamilyData(updatedData);
  };

  const handleDeleteMember = (id) => {
    // Helper to find all descendant IDs to cascade delete
    const getDescendants = (parentId) => {
      let descendants = [];
      familyData.forEach(item => {
        if (item.parentId === parentId) {
          descendants.push(item.id);
          descendants = [...descendants, ...getDescendants(item.id)];
        }
      });
      return descendants;
    };

    addToHistory();
    const idsToDelete = [id, ...getDescendants(id)];
    setFamilyData(familyData.filter(item => !idsToDelete.includes(item.id)));
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
    if (window.confirm('Are you sure you want to reset the tree to default?')) {
      addToHistory();
      setFamilyData(initialFamilyData);
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
    setPendingAction(null);
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

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`} style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', textAlign: 'left', backgroundColor: isDarkMode ? '#121212' : 'white', color: isDarkMode ? '#eee' : 'black' }}>
      <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #eee', backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', zIndex: 10 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', cursor: 'pointer' }} onClick={handleTitleClick} title="Click to rename">
          {treeData.length === 1 ? (familyTitles[treeData[0].id] || `${treeData[0].name} Family Tree`) : (familyTitles['global'] || 'Family Tree Project')}
          <span style={{ fontSize: '0.8rem', marginLeft: '10px', opacity: 0.5 }}>✎</span>
        </h1>
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

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {viewMode === 'tree' && (
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, width: '300px', display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
          <input
              type="text"
              placeholder="Search for a member..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '10px', width: '100%', boxSizing: 'border-box', borderRadius: '4px', border: isDarkMode ? '1px solid #555' : '1px solid #ccc', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: isDarkMode ? '#2d2d2d' : 'white', color: isDarkMode ? '#eee' : 'black' }}
          />
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
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
            <div style={{ padding: '8px', background: '#ff9800', color: 'white', borderRadius: '4px', fontSize: '14px' }}>
              Select a node to view descendants
            </div>
          )}
          {selectedNodeId && !targetNodeId && (
            <div style={{ fontSize: '12px', color: isDarkMode ? '#aaa' : '#666', padding: '0 5px' }}>
              Ctrl+Click another node to find shortest path
            </div>
          )}
          {selectedNodeId && (
            <div style={{ marginTop: '5px', display: 'flex', gap: '5px' }}>
              <button onClick={toggleExpandAll} style={{ flex: 1, padding: '6px', cursor: 'pointer', borderRadius: '4px', border: isDarkMode ? '1px solid #555' : '1px solid #ccc', backgroundColor: isDarkMode ? '#2d2d2d' : 'white', color: isDarkMode ? '#eee' : 'black', fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{isAllExpanded ? 'Collapse All' : 'Expand All'}</button>
              <button onClick={handleClearSelection} style={{ flex: 1, padding: '6px', cursor: 'pointer', borderRadius: '4px', border: isDarkMode ? '1px solid #555' : '1px solid #ccc', backgroundColor: isDarkMode ? '#2d2d2d' : 'white', color: isDarkMode ? '#eee' : 'black', fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Clear Selection</button>
            </div>
          )}
          </div>
        </div>
        )}

        {viewMode === 'tree' ? (
          <div 
            ref={containerRef}
            style={{ 
              width: '100%',
              height: '100%', 
              overflow: 'hidden', 
              position: 'relative',
              cursor: isDragging ? 'grabbing' : 'grab',
              backgroundColor: isDarkMode ? '#121212' : '#f8f9fa'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <ZoomControls setViewState={setViewState} isDarkMode={isDarkMode} />
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
          <div style={{ width: '100%', height: '100%', overflowY: 'auto', backgroundColor: isDarkMode ? '#121212' : '#f8f9fa' }}>
            <TimelineView familyData={familyData} isDarkMode={isDarkMode} />
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
            handleAddParent={handleAddParent}
          />
        )}

        <ContextMenu 
          contextMenu={contextMenu} 
          handleContextAdd={handleContextAdd} 
          handleDeleteMember={handleDeleteMember} 
        />
      </div>
    </div>
  )
}

export default App
