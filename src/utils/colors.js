export const SEGMENT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#82E0AA', '#F0B27A', '#85C1E9',
]

export function getColor(index) {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length]
}
