import { useMemo, useState } from 'react';

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

// Component to display family members in a chronological timeline based on birth date
const TimelineView = ({ familyData, isDarkMode, secondaryIds }) => {
  const [sortOrder, setSortOrder] = useState('asc');

  // Sort family members by birth date based on sortOrder
  const sortedData = useMemo(() => {
    const withDate = familyData.filter(f => f.birthDate);
    const withoutDate = familyData.filter(f => !f.birthDate);

    withDate.sort((a, b) => {
      const dateA = new Date(a.birthDate);
      const dateB = new Date(b.birthDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return [...withDate, ...withoutDate];
  }, [familyData, sortOrder]);

  // Render a message if no family data is available
  if (sortedData.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? '#ccc' : '#666' }}>
        <h3>No family members found</h3>
        <p>Add family members in the Admin Panel to see the timeline.</p>
      </div>
    );
  }

  // Main timeline render
  return (
    <div>
      <div style={{ 
        padding: '10px', 
        textAlign: 'center', 
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        backgroundColor: isDarkMode ? '#121212' : '#f8f9fa',
        borderBottom: isDarkMode ? '1px solid #333' : '1px solid #ddd'
      }}>
        <button 
          onClick={() => setSortOrder('asc')}
          style={{
            padding: '6px 12px',
            marginRight: '10px',
            cursor: 'pointer',
            backgroundColor: sortOrder === 'asc' ? '#2196F3' : 'transparent',
            color: sortOrder === 'asc' ? 'white' : (isDarkMode ? '#eee' : 'black'),
            border: isDarkMode ? '1px solid #555' : '1px solid #ccc',
            borderRadius: '4px'
          }}>Oldest First (ASC)</button>
        <button 
          onClick={() => setSortOrder('desc')}
          style={{
            padding: '6px 12px',
            cursor: 'pointer',
            backgroundColor: sortOrder === 'desc' ? '#2196F3' : 'transparent',
            color: sortOrder === 'desc' ? 'white' : (isDarkMode ? '#eee' : 'black'),
            border: isDarkMode ? '1px solid #555' : '1px solid #ccc',
            borderRadius: '4px'
          }}>Newest First (DESC)</button>
      </div>
    <div className="timeline-container">
      {/* Central vertical line */}
      <div className="timeline-line"></div>
      
      {/* Map through sorted members to create timeline items */}
      {sortedData.map((member, index) => (
        <div key={member.id} className="timeline-item">
          {/* Birth date marker on the timeline */}
          <div className="timeline-year">{member.birthDate || 'Unknown'}</div>
          
          {/* Content card for the family member */}
          <div className="timeline-content" style={{
            border: secondaryIds && secondaryIds.has(member.id) ? (isDarkMode ? '2px dashed #777' : '2px dashed #888') : undefined
          }}>
            {/* Profile picture if available */}
            {member.profilePicture && (
               <img 
                 src={member.profilePicture} 
                 alt={member.name} 
                 style={{ 
                   width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', 
                   display: 'inline-block', verticalAlign: 'middle', marginBottom: '10px', 
                   float: index % 2 === 0 ? 'left' : 'right', 
                   marginRight: index % 2 === 0 ? '15px' : '0', 
                   marginLeft: index % 2 !== 0 ? '15px' : '0' 
                 }} 
               />
            )}
            
            {/* Member details: Name, Age, Notes */}
            <div style={{ overflow: 'hidden' }}>
                <strong style={{ display: 'block', fontSize: '1.1em' }}>
                  {member.name} {member.deathDate && '🪦'}
                  {member.birthDate && (
                    <span style={{ fontSize: '0.8em', fontWeight: 'normal', marginLeft: '5px', color: isDarkMode ? '#ccc' : '#666' }}>
                      ({member.deathDate ? 'Died at' : 'Age'}: {calculateLifeDuration(member.birthDate, member.deathDate)})
                    </span>
                  )}
                </strong>
                {member.notes && <div style={{ fontSize: '0.9em', color: isDarkMode ? '#ccc' : '#666', marginTop: '5px' }}>{member.notes}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
    </div>
  );
};

export default TimelineView;