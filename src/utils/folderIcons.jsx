import {
  // Documents
  FaFileLines, FaFile, FaCopy, FaBookOpen, FaBook, FaClipboardList, FaClipboard,
  FaNoteSticky, FaBoxArchive, FaScroll, FaBookmark,
  // Work
  FaBriefcase, FaCalendar, FaClock, FaBell, FaSquareCheck, FaFlag, FaInbox,
  FaPaperPlane, FaBullseye,
  // Projects
  FaLayerGroup, FaCodeBranch, FaRocket, FaBox, FaBolt, FaMapPin, FaRoute, FaTableColumns,
  // Creative
  FaPalette, FaPen, FaPenNib, FaPaintbrush, FaWandMagicSparkles,
  FaMusic, FaHeadphones, FaCamera, FaFilm, FaMicrophone,
  // Learning
  FaGraduationCap, FaBrain, FaLightbulb, FaGlobe, FaTrophy, FaMedal,
  FaMicroscope, FaFlaskVial, FaAtom,
  // Tech
  FaCode, FaTerminal, FaDatabase, FaMicrochip, FaDisplay, FaShieldHalved,
  FaRobot, FaWifi, FaServer,
  // Personal
  FaHeart, FaStar, FaHouse, FaUser, FaUsers, FaDumbbell, FaPlane, FaCar,
  FaMugSaucer, FaCartShopping,
  // Finance
  FaDollarSign, FaCreditCard, FaWallet, FaArrowTrendUp, FaChartBar,
  FaReceipt, FaPiggyBank, FaLandmark, FaCoins, FaTag,
  // Nature
  FaLeaf, FaTree, FaSeedling, FaMountain, FaSun, FaMoon, FaCloud,
  FaSnowflake, FaDroplet, FaFire, FaWind, FaFeather, FaDove, FaPaw, FaSpa,
} from 'react-icons/fa6';

export const ICON_COMPONENTS = {
  // Documents
  FileText: FaFileLines, File: FaFile, Files: FaCopy,
  BookOpen: FaBookOpen, Book: FaBook,
  ClipboardList: FaClipboardList, Clipboard: FaClipboard,
  Note: FaNoteSticky, Archive: FaBoxArchive, Scroll: FaScroll, Bookmark: FaBookmark,
  // Work
  Briefcase: FaBriefcase, Calendar: FaCalendar, Clock: FaClock,
  Bell: FaBell, CheckSquare: FaSquareCheck, Flag: FaFlag,
  Inbox: FaInbox, Send: FaPaperPlane, Target: FaBullseye,
  // Projects
  Layers: FaLayerGroup, GitBranch: FaCodeBranch, Rocket: FaRocket,
  Package: FaBox, Lightning: FaBolt, MapPin: FaMapPin, Route: FaRoute, Kanban: FaTableColumns,
  // Creative
  Palette: FaPalette, Pen: FaPen, PenNib: FaPenNib,
  Paintbrush: FaPaintbrush, MagicWand: FaWandMagicSparkles,
  Music: FaMusic, Headphones: FaHeadphones, Camera: FaCamera, Film: FaFilm, Mic: FaMicrophone,
  // Learning
  GraduationCap: FaGraduationCap, Brain: FaBrain, Lightbulb: FaLightbulb,
  Globe: FaGlobe, Trophy: FaTrophy, Medal: FaMedal,
  Microscope: FaMicroscope, Flask: FaFlaskVial, Atom: FaAtom,
  // Tech
  Code: FaCode, Terminal: FaTerminal, Database: FaDatabase,
  Cpu: FaMicrochip, Monitor: FaDisplay, Shield: FaShieldHalved,
  Robot: FaRobot, Wifi: FaWifi, Server: FaServer,
  // Personal
  Heart: FaHeart, Star: FaStar, Home: FaHouse, User: FaUser, Users: FaUsers,
  Dumbbell: FaDumbbell, Plane: FaPlane, Car: FaCar, Coffee: FaMugSaucer, ShoppingCart: FaCartShopping,
  // Finance
  Dollar: FaDollarSign, CreditCard: FaCreditCard, Wallet: FaWallet,
  TrendUp: FaArrowTrendUp, ChartBar: FaChartBar, Receipt: FaReceipt,
  PiggyBank: FaPiggyBank, Bank: FaLandmark, Coins: FaCoins, Tag: FaTag,
  // Nature
  Leaf: FaLeaf, Tree: FaTree, Seedling: FaSeedling, Mountain: FaMountain,
  Sun: FaSun, Moon: FaMoon, Cloud: FaCloud, Snowflake: FaSnowflake,
  Water: FaDroplet, Fire: FaFire, Wind: FaWind,
  Feather: FaFeather, Dove: FaDove, Paw: FaPaw, Spa: FaSpa,
};

// Flat ordered list for the picker grid — no categories
export const FOLDER_ICONS = [
  // Documents
  'FileText', 'File', 'Files', 'BookOpen', 'Book', 'ClipboardList', 'Note', 'Archive', 'Scroll', 'Bookmark',
  // Work
  'Briefcase', 'Calendar', 'Clock', 'Bell', 'CheckSquare', 'Flag', 'Inbox', 'Send', 'Target',
  // Projects
  'Layers', 'Kanban', 'GitBranch', 'Rocket', 'Package', 'Lightning', 'MapPin', 'Route',
  // Creative
  'Palette', 'Pen', 'PenNib', 'Paintbrush', 'MagicWand', 'Music', 'Headphones', 'Camera', 'Film', 'Mic',
  // Learning
  'GraduationCap', 'Brain', 'Lightbulb', 'Globe', 'Trophy', 'Medal', 'Microscope', 'Flask', 'Atom',
  // Tech
  'Code', 'Terminal', 'Database', 'Cpu', 'Monitor', 'Shield', 'Robot', 'Wifi', 'Server',
  // Personal
  'Heart', 'Star', 'Home', 'User', 'Users', 'Dumbbell', 'Plane', 'Car', 'Coffee', 'ShoppingCart',
  // Finance
  'Dollar', 'CreditCard', 'Wallet', 'TrendUp', 'ChartBar', 'Receipt', 'PiggyBank', 'Bank', 'Coins', 'Tag',
  // Nature
  'Leaf', 'Tree', 'Seedling', 'Mountain', 'Sun', 'Moon', 'Cloud', 'Snowflake', 'Water', 'Fire', 'Wind',
  'Feather', 'Dove', 'Paw', 'Spa',
];

export function FolderIcon({ name, size = 9, color, style, ...props }) {
  const Comp = ICON_COMPONENTS[name];
  if (!Comp) return null;
  return (
    <Comp
      size={size}
      color={color}
      style={style}
      {...props}
    />
  );
}
