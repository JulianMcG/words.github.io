// Maps keywords → icon keys in ICON_COMPONENTS
export const FOLDER_ICON_DICTIONARY = {
  // Documents
  notes: 'FileText', note: 'FileText', docs: 'FileText', document: 'FileText',
  writing: 'FileText', journal: 'FileText', diary: 'FileText', log: 'FileText',
  entries: 'FileText', drafts: 'FileText',
  memo: 'Note', sticky: 'Note', reminders: 'Note',
  book: 'Book', books: 'BookOpen', reading: 'BookOpen', library: 'BookOpen',
  list: 'ClipboardList', todo: 'ClipboardList', checklist: 'ClipboardList',
  tasks: 'CheckSquare', task: 'CheckSquare', items: 'ClipboardList',
  archive: 'Archive', saved: 'Archive', storage: 'Archive',
  files: 'Files', attachments: 'Files',

  // Work
  work: 'Briefcase', job: 'Briefcase', office: 'Briefcase', business: 'Briefcase',
  career: 'Briefcase', professional: 'Briefcase',
  meeting: 'Calendar', meetings: 'Calendar', schedule: 'Calendar',
  calendar: 'Calendar', events: 'Calendar', appointments: 'Calendar',
  deadline: 'Clock', time: 'Clock', hours: 'Clock', timesheet: 'Clock',
  inbox: 'Inbox', email: 'Inbox', messages: 'Inbox',
  goals: 'Target', goal: 'Target', target: 'Target', objectives: 'Target', okrs: 'Target',
  planning: 'Target', strategy: 'Target',

  // Projects
  project: 'Layers', projects: 'Layers',
  sprint: 'Kanban', kanban: 'Kanban', board: 'Kanban', backlog: 'Kanban',
  launch: 'Rocket', startup: 'Rocket', release: 'Rocket',
  roadmap: 'Route', milestones: 'MapPin',
  git: 'GitBranch', repo: 'GitBranch', version: 'GitBranch',

  // Creative
  creative: 'Palette', art: 'Palette', portfolio: 'Palette', artwork: 'Palette',
  design: 'Palette', ux: 'Palette', ui: 'Palette', visual: 'Palette',
  music: 'Music', songs: 'Music', song: 'Music', album: 'Music', band: 'Music',
  playlist: 'Headphones', audio: 'Headphones', podcast: 'Headphones',
  photo: 'Camera', photos: 'Camera', photography: 'Camera', pictures: 'Camera',
  video: 'Film', videos: 'Film', film: 'Film', movies: 'Film', cinema: 'Film',

  // Learning & Research
  study: 'GraduationCap', school: 'GraduationCap', course: 'GraduationCap',
  class: 'GraduationCap', university: 'GraduationCap', college: 'GraduationCap',
  learning: 'GraduationCap', education: 'GraduationCap', training: 'GraduationCap',
  research: 'Microscope', science: 'Flask', lab: 'Flask',
  experiment: 'Flask', chemistry: 'Flask', biology: 'Atom', physics: 'Atom',
  ideas: 'Lightbulb', idea: 'Lightbulb', brainstorm: 'Brain', brain: 'Brain',
  travel: 'Globe', world: 'Globe', geography: 'Globe',

  // Tech
  code: 'Code', coding: 'Code', programming: 'Code', dev: 'Code',
  development: 'Code', software: 'Code', engineering: 'Code',
  github: 'GitBranch', database: 'Database', data: 'Database', sql: 'Database',
  backend: 'Server', server: 'Server', infrastructure: 'Server',
  web: 'Globe', internet: 'Globe', website: 'Globe',
  api: 'Code', terminal: 'Terminal', cli: 'Terminal', shell: 'Terminal',
  security: 'Shield', privacy: 'Shield', auth: 'Shield',
  ai: 'Robot', ml: 'Robot', models: 'Robot', automation: 'Robot',

  // Personal
  personal: 'User', me: 'User', private: 'User',
  family: 'Users', friends: 'Users', team: 'Users', people: 'Users',
  home: 'Home', house: 'Home', apartment: 'Home', living: 'Home',
  health: 'Heart', fitness: 'Dumbbell', gym: 'Dumbbell', workout: 'Dumbbell',
  trip: 'Plane', vacation: 'Plane', holiday: 'Plane',
  food: 'Coffee', recipes: 'Coffee', cooking: 'Coffee', coffee: 'Coffee',
  shopping: 'ShoppingCart', wishlist: 'ShoppingCart', purchases: 'ShoppingCart',
  favorites: 'Star', starred: 'Star', best: 'Star', favorite: 'Star',

  // Finance
  finance: 'Dollar', money: 'Dollar', budget: 'Dollar',
  financial: 'Dollar', income: 'Dollar', salary: 'Dollar',
  expenses: 'CreditCard', payments: 'CreditCard', spending: 'CreditCard',
  savings: 'PiggyBank', saving: 'PiggyBank',
  investment: 'TrendUp', investing: 'TrendUp', stocks: 'TrendUp', crypto: 'TrendUp',
  taxes: 'Receipt', receipts: 'Receipt', bills: 'Receipt', invoices: 'Receipt',
  bank: 'Bank', banking: 'Bank', account: 'Bank',

  // Nature
  nature: 'Leaf', garden: 'Seedling', gardening: 'Seedling', plants: 'Seedling',
  forest: 'Tree', trees: 'Tree', woods: 'Tree', hiking: 'Mountain',
  outdoors: 'Mountain', camping: 'Mountain', adventure: 'Mountain',
  sun: 'Sun', sunny: 'Sun', summer: 'Sun', weather: 'Cloud',
  winter: 'Snowflake', snow: 'Snowflake', moon: 'Moon', night: 'Moon',
  water: 'Water', ocean: 'Water', lake: 'Water', rain: 'Water',
  fire: 'Fire', warmth: 'Fire', wind: 'Wind', breeze: 'Wind',
  animals: 'Paw', pets: 'Paw', wildlife: 'Dove', birds: 'Dove', dove: 'Dove',
  wellness: 'Spa', meditation: 'Spa', yoga: 'Spa', mindfulness: 'Spa',
  eco: 'Leaf', environment: 'Leaf', green: 'Seedling',
};

export function getIconForFolderName(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  const words = lower.split(/[\s\-_]+/);
  for (const word of words) {
    if (FOLDER_ICON_DICTIONARY[word]) return FOLDER_ICON_DICTIONARY[word];
  }
  for (const [keyword, icon] of Object.entries(FOLDER_ICON_DICTIONARY)) {
    if (lower.includes(keyword)) return icon;
  }
  return null;
}
