export const initialFamilyData = [
  { id: 1, name: 'Grandfather', parentId: null, partnerId: 2, notes: 'The patriarch of the family.', birthDate: '1940-01-01', gender: 'male' },
  { id: 2, name: 'Grandmother', parentId: null, partnerId: 1, notes: 'The matriarch of the family.', birthDate: '1942-05-15', gender: 'female' },
  { id: 3, name: 'Father', parentId: 1, partnerId: 7, notes: '', birthDate: '1965-08-20', gender: 'male' },
  { id: 4, name: 'Uncle', parentId: 1, notes: '', birthDate: '1968-11-10', gender: 'male' },
  { id: 5, name: 'Me', parentId: 3, notes: 'This is me!', birthDate: '1995-03-15', gender: 'male' },
  { id: 6, name: 'Sister', parentId: 3, notes: '', birthDate: '1998-07-22', gender: 'female' },
  { id: 7, name: 'Mother', parentId: null, partnerId: 3, notes: 'Mom', birthDate: '1967-04-10', gender: 'female' },
];