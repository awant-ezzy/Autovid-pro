// Shared constants - safe to import from client components
// (no z-ai-web-dev-sdk import here)

export const VOICE_OPTIONS = [
  { id: 'tongtong', label: 'Tongtong (Female, warm)', gender: 'female' },
  { id: 'chuichui', label: 'Chuichui (Female, energetic)', gender: 'female' },
  { id: 'xiaochen', label: 'Xiaochen (Female, soft)', gender: 'female' },
  { id: 'jam', label: 'Jam (Male, deep)', gender: 'male' },
  { id: 'kazi', label: 'Kazi (Male, neutral)', gender: 'male' },
  { id: 'douji', label: 'Douji (Male, young)', gender: 'male' },
  { id: 'luodo', label: 'Luodo (Male, mature)', gender: 'male' }
]

export const STYLE_OPTIONS = [
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'documentary', label: 'Documentary' },
  { id: 'anime', label: 'Anime' },
  { id: '3d-render', label: '3D Render' },
  { id: 'watercolor', label: 'Watercolor' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'vintage', label: 'Vintage Film' }
]

export const DURATION_OPTIONS = [
  { id: '30s', label: '~30 seconds' },
  { id: '60s', label: '~60 seconds' },
  { id: '90s', label: '~90 seconds' }
]
