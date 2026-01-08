import { useState, useEffect } from 'react';

const useAdminPanel = ({
  familyData,
  editingId,
  handleAddMember,
  handleUpdateMember,
  selectedParent,
  selectedNodeId,
  handleAddParent,
  setEditingId
}) => {
  // Unified state
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [relation, setRelation] = useState('child');
  const [facebookUrl, setFacebookUrl] = useState('');

  const [parentName, setParentName] = useState('');
  const [parentGender, setParentGender] = useState('');

  useEffect(() => {
    if (editingId) {
      const member = familyData.find(m => m.id === editingId);
      if (member) {
        setName(member.name);
        setNotes(member.notes || '');
        setBirthDate(member.birthDate || '');
        setGender(member.gender || '');
        setProfilePicture(member.profilePicture || null);
        setRelation('child'); // Default or irrelevant for edit
        setFacebookUrl(member.facebookUrl || '');
      }
    } else {
      resetForm();
    }
  }, [editingId, familyData]);

  useEffect(() => {
    // Reset form when parent changes, but only if we are adding (not editing)
    if (!editingId) {
      resetForm();
    }
  }, [selectedParent]);

  const resetForm = () => {
    setName('');
    setNotes('');
    setBirthDate('');
    setGender('');
    setProfilePicture(null);
    setRelation('child');
    setFacebookUrl('');
  };

  const handlePictureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = () => {
    if (editingId) {
      handleUpdateMember(editingId, {
        name,
        notes,
        birthDate,
        profilePicture,
        gender,
        facebookUrl
      });
    } else {
      const targetId = selectedParent ? Number(selectedParent) : null;
      
      if (relation === 'parent' && targetId) {
        handleAddParent(targetId, {
          name,
          gender,
          notes,
          birthDate,
          profilePicture,
          facebookUrl
        });
      } else {
        let parentId = targetId;
        let partnerId = null;

        if (relation === 'spouse') {
          parentId = null; // Spouses don't inherit the parent of the spouse usually
          partnerId = targetId;
        } else if (relation === 'sibling') {
          const sibling = familyData.find(m => m.id === targetId);
          parentId = sibling ? sibling.parentId : null;
        }
        // 'child' case uses default parentId = targetId

        handleAddMember({
          name,
          notes,
          birthDate,
          profilePicture,
          gender,
          parentId,
          partnerId,
          facebookUrl
        });
      }
      resetForm();
    }
  };

  const onCancelEdit = () => {
    setEditingId(null);
  };

  const onAddParent = () => {
    if (!parentName) return;
    handleAddParent(selectedNodeId, { name: parentName, gender: parentGender });
    setParentName('');
    setParentGender('');
  };

  return {
    name, setName,
    notes, setNotes,
    birthDate, setBirthDate,
    gender, setGender,
    relation, setRelation,
    parentName, setParentName,
    parentGender, setParentGender,
    handlePictureUpload,
    onSubmit,
    onCancelEdit,
    onAddParent,
    facebookUrl, setFacebookUrl,
    profilePicture, setProfilePicture
  };
};

export default useAdminPanel;