export const CATEGORIES = [
  { id: 'streaming', label: 'Streaming', color: '#e53e3e', bg: '#fff5f5' },
  { id: 'software', label: 'Software', color: '#3182ce', bg: '#ebf8ff' },
  { id: 'music', label: 'Music', color: '#d53f8c', bg: '#fff0f7' },
  { id: 'gaming', label: 'Gaming', color: '#805ad5', bg: '#faf5ff' },
  { id: 'news', label: 'News & Media', color: '#dd6b20', bg: '#fffaf0' },
  { id: 'cloud', label: 'Cloud Storage', color: '#319795', bg: '#e6fffa' },
  { id: 'productivity', label: 'Productivity', color: '#38a169', bg: '#f0fff4' },
  { id: 'utilities', label: 'Utilities', color: '#718096', bg: '#f7fafc' },
  { id: 'fitness', label: 'Fitness', color: '#e53e3e', bg: '#fff5f5' },
  { id: 'education', label: 'Education', color: '#d69e2e', bg: '#fffff0' },
  { id: 'other', label: 'Other', color: '#a0aec0', bg: '#f7fafc' },
]

export const getCategoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
