import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Plus,
  FileText,
  Trash2,
  Menu,
  ChevronsLeft,
  ChevronsRight,
  Bold,
  Italic,
  Strikethrough,
  Highlighter,
  Pin,
  PinOff,
  CheckSquare,
  Table,
  Image as ImageIcon,
  Folder,
  FolderMinus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Circle,
  GripVertical,
  Lock,
  Unlock,
  X,
  Share,
  Printer,
  Pencil,
  Link,
  Unlink,
  Cloud,
  CloudOff,
  LogOut
} from "lucide-react";
import { auth, db, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, doc, setDoc, onSnapshot } from "./firebase";

const EMOJIS = [
  "📄",
  "📝",
  "📓",
  "📚",
  "📌",
  "💡",
  "🧠",
  "💭",
  "🚀",
  "✨",
  "⭐️",
  "🔥",
  "🎯",
  "🎨",
  "🎬",
  "🎧",
  "☕️",
  "🍎",
  "🌍",
  "🏠",
  "💻",
  "🎮",
  "🌈",
  "⚡️",
];

const getEmojiForTitle = (title) => {
  const t = title.toLowerCase();
  const map = {
    todo: "📝",
    task: "✅",
    tasks: "✅",
    plan: "📋",
    checklist: "☑️",
    goal: "🎯",
    note: "📓",
    notes: "📓",
    journal: "📔",
    diary: "📖",
    log: "📋",
    idea: "💡",
    ideas: "💡",
    brain: "🧠",
    thought: "💭",
    draft: "📄",
    work: "💼",
    meeting: "🤝",
    project: "📊",
    report: "📈",
    presentation: "📽️",
    office: "🏢",
    email: "📧",
    inbox: "📥",
    folder: "📁",
    home: "🏠",
    personal: "👤",
    life: "🌱",
    family: "👨‍👩‍👧‍👦",
    friend: "👋",
    food: "🍎",
    recipe: "🍳",
    cook: "👨‍🍳",
    meal: "🍽️",
    diet: "🥗",
    grocery: "🛒",
    travel: "✈️",
    trip: "🚗",
    vacation: "🌴",
    flight: "🛫",
    itinerary: "🗺️",
    money: "💰",
    finance: "📈",
    budget: "💵",
    expense: "💸",
    tax: "🧾",
    health: "🏥",
    workout: "🏋️",
    gym: "💪",
    fitness: "🏃",
    code: "💻",
    dev: "👨‍💻",
    programming: "🧑‍💻",
    bug: "🐛",
    feature: "✨",
    app: "📱",
    software: "💿",
    web: "🌐",
    tech: "🔧",
    database: "🗄️",
    sql: "🗄️",
    api: "🔌",
    server: "🖥️",
    system: "⚙️",
    linux: "🐧",
    python: "🐍",
    java: "☕",
    react: "⚛️",
    javascript: "📜",
    aws: "☁️",
    docker: "🐋",
    git: "🐙",
    github: "🐙",
    release: "🚀",
    deploy: "🚢",
    game: "🎮",
    play: "🎲",
    xbox: "🎮",
    playstation: "🎮",
    nintendo: "🍄",
    mario: "🍄",
    zelda: "🗡️",
    pokemon: "🐉",
    rpg: "🎲",
    mmo: "🌍",
    movie: "🍿",
    film: "🎬",
    cinema: "🎞️",
    video: "🎥",
    tv: "📺",
    show: "📺",
    netflix: "🍿",
    anime: "🍥",
    manga: "📖",
    comic: "🦸",
    youtube: "▶️",
    twitch: "🟪",
    stream: "🎙️",
    run: "👟",
    jog: "👟",
    cardio: "🤸",
    lift: "🏋️",
    yoga: "🧘",
    stretch: "🧘",
    meditate: "🧘",
    swim: "🏊",
    bike: "🚲",
    cycle: "🚴",
    protein: "🥩",
    water: "💧",
    hydrate: "💧",
    sleep: "💤",
    rest: "🛌",
    med: "💊",
    medical: "🩺",
    doctor: "👨‍⚕️",
    write: "✍️",
    blog: "📝",
    story: "📚",
    book: "📖",
    poem: "✒️",
    novel: "📕",
    author: "✍️",
    essay: "📝",
    script: "📜",
    design: "🎨",
    art: "🖌️",
    sketch: "✏️",
    draw: "🖍️",
    paint: "🎨",
    color: "🌈",
    ui: "✨",
    ux: "✨",
    photo: "📸",
    shoot: "📸",
    music: "🎵",
    song: "🎶",
    audio: "🎧",
    podcast: "🎙️",
    band: "🎸",
    guitar: "🎸",
    piano: "🎹",
    drums: "🥁",
    invoice: "🧾",
    bill: "💳",
    pay: "💳",
    salary: "💰",
    invest: "💹",
    stock: "📉",
    crypto: "🪙",
    bitcoin: "₿",
    client: "🤝",
    pitch: "📽️",
    strategy: "♟️",
    startup: "🚀",
    business: "💼",
    shop: "🛍️",
    buy: "💳",
    cloth: "👕",
    hotel: "🏨",
    eat: "🍔",
    restaurant: "🍝",
    coffee: "☕",
    cafe: "☕",
    tree: "🌳",
    animal: "🐾",
    dog: "🐶",
    cat: "🐱",
    pet: "🐕",
    rock: "🪨",
    rocks: "🪨",
    stone: "🪨",
    earth: "🌍",
    weather: "☀️",
    cloud: "☁️",
    rain: "🌧️",
    beach: "🏖️",
    ocean: "🌊",
    sea: "🌊",
    sun: "☀️",
    tide: "🌊",
    wave: "🌊",
    coral: "🪸",
    reef: "🪸",
    mountain: "⛰️",
    hike: "🥾",
    camp: "⛺",
    tent: "⛺",
    forest: "🌲",
    park: "🏞️",
    snow: "❄️",
    winter: "⛄",
    summer: "🌞",
    sediment: "🪨",
    dirt: "🌱",
    soil: "🌱",
    fossil: "🦴",
    volcano: "🌋",
    earthquake: "💥",
    science: "🔬",
    math: "➗",
    physics: "⚛️",
    space: "🚀",
    chemistry: "🧪",
    biology: "🦠",
    cell: "🦠",
    dna: "🧬",
    atom: "⚛️",
    planet: "🪐",
    star: "⭐",
    galaxy: "🌌",
    moon: "🌙",
    comet: "☄️",
    astronomy: "🔭",
    gravity: "🍎",
    energy: "⚡",
    lab: "🧪",
    school: "🏫",
    class: "🎓",
    study: "📚",
    learn: "🧠",
    college: "🎓",
    exam: "📝",
    test: "📝",
    thesis: "📜",
    research: "🔬",
    paper: "📄",
    assignment: "📋",
    homework: "📚",
    lecture: "👩‍🏫",
    event: "📅",
    party: "🎉",
    birthday: "🎂",
    gift: "🎁",
    holiday: "🎄",
    car: "🚗",
    auto: "🚙",
    stuff: "📦",
    thing: "📦",
    beatles: "🎸",
    beatle: "🎸",
    poster: "🖼️",
    wireframe: "📐",
    mockup: "📱",
    prototype: "🪄",
    standup: "🗣️",
    sync: "🔄",
    huddle: "👥",
    kickoff: "🚀",
    retro: "⏪",
    retrospective: "⏪",
    architecture: "🏛️",
    diagram: "📊",
    flow: "🌊",
    flowchart: "🌊",
    interview: "🎙️",
    synthesis: "🧩",
    brief: "📋",
    spec: "📄",
    specs: "📄",
    sprint: "🏃",
    planning: "📅",
    backlog: "🗃️",
    roadmap: "🛣️",
    milestone: "🚩",
    launch: "🚀",
    demo: "🎉",
    brainstorm: "⛈️",
    workshop: "🛠️",
    onboarding: "👋",
    offboarding: "👋",
    typography: "🔤",
    font: "🔤",
    typeface: "🔤",
    layout: "📏",
    grid: "🔲",
    logo: "📛",
    branding: "✨",
    brand: "✨",
    palette: "🎨",
    moodboard: "📌",
    illustration: "🖌️",
    animation: "🎞️",
    motion: "🎬",
    edit: "✂️",
    cut: "✂️",
    mix: "🎛️",
    master: "🎛️",
    review: "👀",
    feedback: "💬",
    critique: "🧐",
    crit: "🧐",
    testing: "🧪",
    prod: "🏭",
    staging: "🚧",
    hotfix: "🚑",
    epic: "📚",
    minutes: "⏱️",
    agenda: "📋",
    action: "⚡",
  };

  const words = t.match(/\b\w+\b/g) || [];

  // Iterate backwards to prioritize trailing head nouns (the most important words)
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    if (Object.prototype.hasOwnProperty.call(map, word)) return map[word];
    if (
      word.endsWith("s") &&
      Object.prototype.hasOwnProperty.call(map, word.slice(0, -1))
    )
      return map[word.slice(0, -1)];
    if (
      word.endsWith("es") &&
      Object.prototype.hasOwnProperty.call(map, word.slice(0, -2))
    )
      return map[word.slice(0, -2)];
  }

  // Removed dangerous t.includes() fallback loop causing substring false positives
  return null;
};

// Define the separated commands
const COMMANDS = [
  {
    id: "text",
    title: "Text",
    description: "Just start writing with plain text.",
    icon: Type,
    type: "formatBlock",
    tag: "P",
  },
  {
    id: "checklist",
    title: "To-do List",
    description: "Track tasks with a checklist.",
    icon: CheckSquare,
    type: "checklist",
  },
  {
    id: "h1",
    title: "Heading 1",
    description: "Big section heading.",
    icon: Heading1,
    type: "formatBlock",
    tag: "H1",
  },
  {
    id: "h2",
    title: "Heading 2",
    description: "Medium section heading.",
    icon: Heading2,
    type: "formatBlock",
    tag: "H2",
  },
  {
    id: "h3",
    title: "Heading 3",
    description: "Small section heading.",
    icon: Heading3,
    type: "formatBlock",
    tag: "H3",
  },
  {
    id: "ul",
    title: "Bulleted List",
    description: "Create a simple bulleted list.",
    icon: List,
    type: "list",
    tag: "insertUnorderedList",
  },
  {
    id: "ol",
    title: "Numbered List",
    description: "Create a list with numbering.",
    icon: ListOrdered,
    type: "list",
    tag: "insertOrderedList",
  },
  {
    id: "quote",
    title: "Quote",
    description: "Capture a quote.",
    icon: Quote,
    type: "formatBlock",
    tag: "BLOCKQUOTE",
  },
  {
    id: "table",
    title: "Table",
    description: "Add a resizable grid.",
    icon: Table,
    type: "insertHTML",
    tag: `<div class="table-container" contenteditable="false" style="margin: 1.5em 0; clear: both;">
  <div class="table-title" contenteditable="true" data-placeholder="Table Title"></div>
  <div class="table-wrapper">
    <div class="table-scroll">
      <table contenteditable="true">
        <tbody>
          <tr>
            <td><br></td>
            <td><br></td>
            <td><br></td>
          </tr>
          <tr>
            <td><br></td>
            <td><br></td>
            <td><br></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="table-resize-handle" contenteditable="false" title="Drag to add/remove rows and columns"></div>
  </div>
</div>
<p><br></p>`,
  },
];

const fetchLinkPreviewData = async (url) => {
  try {
    const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    const json = await response.json();
    
    if (json.status === 'success' && json.data) {
      const { title, description, image, url: actualUrl, publisher } = json.data;
      
      let domain = publisher || '';
      let displayUrl = actualUrl || url;
      
      if (!domain) {
        try {
          const urlObj = new URL(displayUrl);
          domain = urlObj.hostname.toLowerCase().replace(/^www\./, '');
        } catch (e) {}
      }
      
      return {
        title: title || displayUrl,
        image: image?.url || '',
        description: description || '',
        domain: domain || new URL(displayUrl).hostname.replace(/^www\./, ''),
        url: displayUrl
      };
    }
    throw new Error('Microlink API did not return success status');
  } catch (error) {
    console.error("Primary link preview fetch failed, trying fallback:", error);
    try {
      const fallbackResponse = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const fallbackData = await fallbackResponse.json();
      const html = fallbackData.contents;
      
      if (!html) return null;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      let title = doc.querySelector('meta[property="og:title"]')?.content || doc.querySelector('meta[name="twitter:title"]')?.content || doc.title || url;
      let image = doc.querySelector('meta[property="og:image"]')?.content || doc.querySelector('meta[name="twitter:image"]')?.content || '';
      let description = doc.querySelector('meta[property="og:description"]')?.content || doc.querySelector('meta[name="twitter:description"]')?.content || doc.querySelector('meta[name="description"]')?.content || '';

      let domain = '';
      let displayUrl = url;
      try {
        const urlObj = new URL(url);
        domain = urlObj.hostname.toLowerCase().replace(/^www\./, '');
        displayUrl = `${urlObj.protocol}//${domain}${urlObj.pathname}${urlObj.search}`;
      } catch (e) {}

      return { title, image, description, domain, url: displayUrl };
    } catch (fallbackError) {
      console.error("Fallback link preview fetch failed:", fallbackError);
      return null;
    }
  }
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarPeeking, setIsSidebarPeeking] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [docs, setDocs] = useState(() => {
    const saved = localStorage.getItem("words_docs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse local storage docs:", e);
      }
    }
    return [
      {
        id: "1",
        title: "",
        content: "<p><br></p>",
        isPinned: false,
        emoji: null,
        hasCustomEmoji: false,
        groupId: null,
      },
    ];
  });
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem("words_groups");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse local storage groups:", e);
      }
    }
    return [];
  });
  const [activeDocId, setActiveDocId] = useState(() => {
    return localStorage.getItem("words_active_doc") || "1";
  });
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null); // { type: 'doc' | 'group', id: string }
  const [dragTarget, setDragTarget] = useState(null); // { id: string, position: 'before' | 'after' | 'inset', type: 'doc' | 'group' }
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { docId, x, y }
  const [groupMenuOpen, setGroupMenuOpen] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [lockPasscode, setLockPasscode] = useState(() => localStorage.getItem('words_lock_passcode') || null);
  const [lockModal, setLockModal] = useState(null); // { mode: 'create' | 'unlock', docId }
  const [passcodeInput, setPasscodeInput] = useState('');

  // Cloud Sync State
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState(false); // false, 'login', 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showSyncSuggestion, setShowSyncSuggestion] = useState(false);
  const skipSyncRef = useRef(false);

  // We don't want to use state for the backups, otherwise they re-render when they shouldn't.
  // We'll use refs, and initialize them from localStorage if they exist.
  const localBackupDocsRef = useRef(() => {
    const saved = localStorage.getItem("words_local_backup_docs");
    return saved ? JSON.parse(saved) : null;
  });
  const localBackupGroupsRef = useRef(() => {
    const saved = localStorage.getItem("words_local_backup_groups");
    return saved ? JSON.parse(saved) : null;
  });
  const localBackupPasscodeRef = useRef(() => {
    return localStorage.getItem("words_local_backup_passcode") || null;
  });

  // Editor UI State
  const [slashState, setSlashState] = useState({
    isOpen: false,
    query: "",
    x: 0,
    y: 0,
    activeIndex: 0,
  });
  const [toolbarState, setToolbarState] = useState({
    show: false,
    x: 0,
    y: 0,
    showLinkInput: false,
    linkUrl: "",
    savedRange: null,
  });
  const [linkPopoverState, setLinkPopoverState] = useState({
    show: false,
    url: "",
    x: 0,
    y: 0,
  });

  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const slashMenuRef = useRef(null);
  const docsRef = useRef(docs);
  const isInternalEdit = useRef(false);
  const titleTimeoutRef = useRef(null);
  const prevActiveDocIdRef = useRef(activeDocId);

  const filteredCommands = COMMANDS.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(slashState.query.toLowerCase()) ||
      cmd.id.toLowerCase().includes(slashState.query.toLowerCase()),
  );

  // Synchronous flush: saves current editor state to docsRef + state
  const flushCurrentDoc = useCallback(() => {
    if (!editorRef.current || !titleRef.current) return;
    const currentId = prevActiveDocIdRef.current;
    const content = editorRef.current.innerHTML || "<p><br></p>";
    const title = titleRef.current.innerText || "";
    // Update ref synchronously so subsequent reads are correct
    docsRef.current = docsRef.current.map((d) =>
      d.id === currentId ? { ...d, content, title } : d
    );
    setDocs(docsRef.current);
  }, []);

  useEffect(() => {
    // Flush the PREVIOUS doc's content before loading the new one
    const prevId = prevActiveDocIdRef.current;
    if (prevId && prevId !== activeDocId) {
      flushCurrentDoc();
    }
    prevActiveDocIdRef.current = activeDocId;

    // Load synchronously from docsRef (already updated by flush above)
    const activeDoc = docsRef.current.find((d) => d.id === activeDocId);
    if (activeDoc && editorRef.current && titleRef.current) {
      titleRef.current.innerText = activeDoc.title;
      editorRef.current.innerHTML = activeDoc.content;
    }
  }, [activeDocId, flushCurrentDoc]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();

      // Handle Link Popover
      if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
        let node = selection.focusNode;
        if (node?.nodeType === 3) node = node.parentNode; // Get element if text node

        const anchor = node?.closest ? node.closest('a:not(.link-preview-card)') : null;

        if (anchor && anchor.href) {
          const rect = anchor.getBoundingClientRect();
          setLinkPopoverState({
            show: true,
            url: anchor.href,
            x: rect.left + rect.width / 2,
            y: rect.bottom + window.scrollY + 8, // Position below the link
          });
        } else {
          setLinkPopoverState(prev => prev.show ? { ...prev, show: false } : prev);
        }
      } else {
        setLinkPopoverState(prev => prev.show ? { ...prev, show: false } : prev);
      }

      // Handle Text Formatting Toolbar
      if (
        selection &&
        !selection.isCollapsed &&
        editorRef.current?.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        let node = selection.focusNode;
        if (node?.nodeType === 3) node = node.parentNode;
        const isLinkActive = !!(node?.closest && node.closest('a'));

        setToolbarState((prev) => ({
          ...prev,
          show: true,
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
          showLinkInput: false,
          linkUrl: "",
          isLinkActive,
          savedRange: range,
        }));
      } else {
        setToolbarState((prev) => {
          const isEditorClick = selection && editorRef.current?.contains(selection.anchorNode);
          if (prev.showLinkInput && !isEditorClick) return prev;
          return prev.show ? { ...prev, show: false, showLinkInput: false } : prev;
        });
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  useEffect(() => {
    docsRef.current = docs;
    if (!user) {
      try {
        localStorage.setItem("words_docs", JSON.stringify(docs));
      } catch (error) {
        console.warn(
          "Local storage quota exceeded. The document is too large to save locally.",
          error,
        );
      }
    }
  }, [docs, user]);

  useEffect(() => {
    try {
      localStorage.setItem("words_groups", JSON.stringify(groups));
    } catch (error) {
      console.warn("Failed to save groups to local storage.", error);
    }
  }, [groups]);

  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem("words_active_doc", activeDocId);
      } catch (error) {
        console.warn("Failed to save active doc state to local storage.", error);
      }
    }
  }, [activeDocId, user]);

  // Firebase Auth Listener - Handles Auth State Transitions (Login/Logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsAuthLoading(false);
      if (currentUser && !user) {
        // Logging in. 
        // 0. Prevent local sync to cloud until initialization fetch completes.
        skipSyncRef.current = true;

        // 1. Snapshot the CURRENT local data and save it to the backup keys.
        localBackupDocsRef.current = docs;
        localBackupGroupsRef.current = groups;
        localBackupPasscodeRef.current = lockPasscode;

        localStorage.setItem("words_local_backup_docs", JSON.stringify(docs));
        localStorage.setItem("words_local_backup_groups", JSON.stringify(groups));
        if (lockPasscode) {
          localStorage.setItem("words_local_backup_passcode", lockPasscode);
        } else {
          localStorage.removeItem("words_local_backup_passcode");
        }

      } else if (!currentUser && user) {
        // Logging out.
        // 1. Prevent sync from firing up to the cloud while we swap out the local state.
        skipSyncRef.current = true;

        // 2. Load the backups we stored
        const savedDocs = localStorage.getItem("words_local_backup_docs");
        const savedGroups = localStorage.getItem("words_local_backup_groups");
        const savedPasscode = localStorage.getItem("words_local_backup_passcode");

        const parsedDocs = savedDocs ? JSON.parse(savedDocs) : [];
        const finalDocs = parsedDocs.length > 0 ? parsedDocs : [
          { id: "1", title: "", content: "<p><br></p>", isPinned: false, emoji: null, hasCustomEmoji: false, groupId: null }
        ];

        const parsedGroups = savedGroups ? JSON.parse(savedGroups) : [];
        const nextId = finalDocs[0]?.id || "1";

        // 3. Set standard React state and synchronous refs to prevent flush race conditions
        docsRef.current = finalDocs;
        prevActiveDocIdRef.current = nextId;

        setDocs(finalDocs);
        setGroups(parsedGroups);
        setLockPasscode(savedPasscode || null);
        setActiveDocId(nextId);

        // Instantly force the DOM to match the loaded state for snappiness
        const docToLoad = finalDocs.find(d => d.id === nextId);
        if (docToLoad && editorRef.current && titleRef.current) {
          titleRef.current.innerText = docToLoad.title;
          editorRef.current.innerHTML = docToLoad.content;
        }

        // 4. Also immediately update the regular local storage keys so next refresh is correct
        localStorage.setItem("words_docs", JSON.stringify(finalDocs));
        localStorage.setItem("words_groups", JSON.stringify(parsedGroups));
        if (savedPasscode) {
          localStorage.setItem("words_lock_passcode", savedPasscode);
        } else {
          localStorage.removeItem("words_lock_passcode");
        }

        // 5. Allow sync to operate normally again (which does nothing as !user)
        setTimeout(() => { skipSyncRef.current = false; }, 100);
      }

      setUser(currentUser);
      if (currentUser) {
        setAuthModal(false);
      }
    });
    return () => unsubscribe();
  }, [user, docs, groups, lockPasscode]);

  // Sync Suggestion Logic
  useEffect(() => {
    if (user) return; // Already logged in

    // Suggest if they have more than 3 documents
    if (docs.length >= 4) {
      const hasDismissed = localStorage.getItem('words_dismissed_sync');
      if (!hasDismissed) {
        setShowSyncSuggestion(true);
      }
    }
  }, [docs, user]);

  // Two-way Sync with Firestore
  useEffect(() => {
    if (!user) return;

    // Subscribe to changes from the cloud.
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // As long as there is SOME valid data, proceed with sync
        if (data.docs || data.groups) {
          skipSyncRef.current = true; // prevent the local useEffect from bouncing this right back

          if (data.docs) {
            docsRef.current = data.docs;
            setDocs(data.docs);
          }
          
          if (data.groups) {
            setGroups(data.groups);
          }

          setLockPasscode(data.lockPasscode || null);

          if (data.docs) {
            let nextActiveId = data.activeDocId;
            if (nextActiveId && data.docs.some(d => d.id === nextActiveId)) {
              setActiveDocId(nextActiveId);
            } else if (data.docs.length > 0) {
              nextActiveId = data.docs[0].id;
              setActiveDocId(nextActiveId);
            }

            // Force immediate synchronous DOM update ONLY if the active doc actually changed from an external source or transition
            if (nextActiveId && nextActiveId !== prevActiveDocIdRef.current) {
              prevActiveDocIdRef.current = nextActiveId;
              const activeDoc = data.docs.find(d => d.id === nextActiveId);
              if (activeDoc && editorRef.current && titleRef.current) {
                titleRef.current.innerText = activeDoc.title;
                editorRef.current.innerHTML = activeDoc.content;
              }
            }
          }

          // DO NOT WRITE TO LOCALSTORAGE HERE. We keep "words_docs" pure for the unauthenticated state.

          setTimeout(() => {
            skipSyncRef.current = false;
          }, 100);
        }
      } else {
        // New user (document does not exist in Firestore).
        // Transfer all existing local data to the cloud seamlessly.
        skipSyncRef.current = true;

        // Grab exactly what is in the main local storage right now
        const localDocs = JSON.parse(localStorage.getItem("words_docs") || "[]");
        const localGroups = JSON.parse(localStorage.getItem("words_groups") || "[]");
        const actId = localStorage.getItem("words_active_doc");
        const lp = localStorage.getItem("words_lock_passcode");

        setDoc(doc(db, "users", user.uid), {
          docs: localDocs.length > 0 ? localDocs : docsRef.current, // Fallback to current state if empty
          groups: localGroups,
          activeDocId: actId || activeDocId,
          lockPasscode: lp || lockPasscode,
          lastUpdated: new Date().toISOString()
        }).then(() => {
          skipSyncRef.current = false;
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Sync to Firebase whenever local docs/groups change
  useEffect(() => {
    if (!user || skipSyncRef.current) return;

    const syncData = async () => {
      try {
        await setDoc(doc(db, "users", user.uid), {
          docs: docsRef.current,
          groups,
          activeDocId,
          lockPasscode,
          lastUpdated: new Date().toISOString()
        });
      } catch (e) {
        console.error("Error syncing to cloud:", e);
      }
    };

    const timeout = setTimeout(syncData, 500); // debounce sync
    return () => clearTimeout(timeout);
  }, [docs, groups, activeDocId, lockPasscode, user]);

  const handleGoogleLogin = (e) => {
    e.preventDefault();
    signInWithPopup(auth, googleProvider)
      .then(() => {
        setAuthError('');
      })
      .catch((error) => {
        setAuthError(error.message.replace('Firebase: ', ''));
      });
  };


  const handleEmailAuth = async () => {
    if (!authEmail || !authPassword) {
      setAuthError('Email and password required');
      return;
    }
    try {
      setAuthError('');
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
    } catch (e) {
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        } catch (createErr) {
          if (createErr.code === 'auth/email-already-in-use') {
            setAuthError('Incorrect password.');
          } else {
            setAuthError(createErr.message.replace('Firebase: ', ''));
          }
        }
      } else {
        setAuthError(e.message.replace('Firebase: ', ''));
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Update tab title and favicon based on active document
  useEffect(() => {
    const activeDoc = docsRef.current.find(d => d.id === activeDocId);
    if (!activeDoc) return;

    // Update tab title
    document.title = activeDoc.title || 'Untitled';

    // Update favicon with emoji
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    const setFavicon = () => {
      if (activeDoc.emoji) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.font = '48px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(activeDoc.emoji, 32, 36);
        link.href = canvas.toDataURL('image/png');
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        link.href = isDark ? '/favicondark.png' : '/faviconlight.png';
      }
    };

    setFavicon();

    // Listen for theme changes to update favicon
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setFavicon();
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [activeDocId, docs]);

  // Failsafe: Synchronous save on unmount/refresh + visibility change
  useEffect(() => {
    const flushSave = () => {
      if (editorRef.current && titleRef.current) {
        const currentDocs = docsRef.current.map((d) =>
          d.id === activeDocId
            ? {
              ...d,
              title: titleRef.current.innerText || "",
              content: editorRef.current.innerHTML || "<p><br></p>",
            }
            : d,
        );
        try {
          localStorage.setItem("words_docs", JSON.stringify(currentDocs));
          localStorage.setItem("words_active_doc", activeDocId);
        } catch (e) { }
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) flushSave();
    };
    window.addEventListener("beforeunload", flushSave);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    // Periodic auto-save every 5 seconds
    const autoSaveInterval = setInterval(flushSave, 5000);
    return () => {
      window.removeEventListener("beforeunload", flushSave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(autoSaveInterval);
    };
  }, [activeDocId]);

  const handleTitleInput = () => {
    const newTitle = titleRef.current?.innerText || "";

    // Instantly sync the text typed to the document state
    setDocs((prev) =>
      prev.map((d) => (d.id === activeDocId ? { ...d, title: newTitle } : d))
    );

    // Clear any existing timeout since the user is still actively typing
    if (titleTimeoutRef.current) {
      clearTimeout(titleTimeoutRef.current);
    }

    // Wait 800ms after the user *stops* typing to evaluate the smart emoji
    titleTimeoutRef.current = setTimeout(() => {
      setDocs((prev) =>
        prev.map((d) => {
          if (d.id !== activeDocId) return d;
          let nextEmoji = d.emoji;

          if (!d.hasCustomEmoji) {
            const autoEmoji = getEmojiForTitle(newTitle);
            if (autoEmoji) nextEmoji = autoEmoji;
          }

          return { ...d, emoji: nextEmoji };
        })
      );
    }, 800);
  };

  const syncContentToState = useCallback(() => {
    const newContent = editorRef.current?.innerHTML || "<p><br></p>";
    setDocs((prev) => {
      const activeDoc = prev.find((d) => d.id === activeDocId);
      if (activeDoc && activeDoc.content === newContent) {
        return prev;
      }
      const updatedDocs = prev.map((d) =>
        d.id === activeDocId ? { ...d, content: newContent } : d,
      );
      docsRef.current = updatedDocs;
      return updatedDocs;
    });
  }, [activeDocId]);

  const handleEditorInput = useCallback(() => {
    if (isInternalEdit.current) return;
    syncContentToState();

    // Check selection natively
    const selection = window.getSelection();
    if (!selection || !selection.focusNode) return;

    const node = selection.focusNode;
    const text = node.textContent.substring(0, selection.focusOffset);

    // --- Clean Stale Math Previews ---
    const stalePreviews = editorRef.current.querySelectorAll(".math-preview");
    stalePreviews.forEach((p) => p.remove());

    // --- Auto-Math Evaluation ---
    const mathMatch = text.match(
      /(?:^|[\s\u00A0])([0-9\.\+\-\*\/\^\(\)\s\u00A0]+)=$/,
    );
    if (mathMatch) {
      const eq = mathMatch[1].trim();
      if (eq.length > 0 && /\d/.test(eq) && /[\+\-\*\/\^]/.test(eq)) {
        try {
          const sanitized = eq.replace(/\^/g, "**").replace(/[\u00A0]/g, " ");
          if (/^[\d\.\+\-\*\/\^\(\)\s\*\*]+$/.test(sanitized)) {
            const ans = new Function("return " + sanitized)();
            if (isFinite(ans)) {
              isInternalEdit.current = true;

              // Insert DOM nodes directly so it stays perfectly inline
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);

                const span = document.createElement("span");
                span.className = "math-preview";
                span.contentEditable = "false";
                span.textContent = ans;

                range.insertNode(span);
                range.setStartAfter(span);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);

                // Zero-width space locks the cursor safely after the uneditable element
                document.execCommand("insertHTML", false, "\u200B");
              }

              isInternalEdit.current = false;
              syncContentToState();
            }
          }
        } catch (e) { }
      }
    }

    // --- Link Preview Detection ---
    const urlMatch = text.match(/(?:^|[\s\u00A0])(https?:\/\/[^\s\u00A0]+)[\s\u00A0]$/);
    if (urlMatch) {
      const url = urlMatch[1];

      const range = selection.getRangeAt(0);

      // Delete the typed URL + space
      range.setStart(node, selection.focusOffset - url.length - 1);
      range.deleteContents();

      // Insert placeholder
      const placeholderId = `link-preview-${Date.now()}`;
      const placeholder = document.createElement("div");
      placeholder.id = placeholderId;
      placeholder.contentEditable = "false";
      placeholder.className = "link-preview-loading";

      range.insertNode(placeholder);

      const space = document.createTextNode("\u00A0");
      placeholder.after(space);
      range.setStartAfter(space);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      syncContentToState();

      // Fetch asynchronously
      fetchLinkPreviewData(url).then(preview => {
        const el = document.getElementById(placeholderId);
        if (!el) return;

        if (preview) {
          el.outerHTML = `
            <div class="link-preview-outer" contenteditable="false" id="${placeholderId}-resolved">
              <a href="${preview.url}" target="_blank" rel="noopener noreferrer" class="link-preview-card">
                ${preview.image ? `<img src="${preview.image}" class="link-preview-image" alt="Preview" onerror="this.onerror=null; this.style.display='none';"/>` : ''}
                <div class="link-preview-content">
                  <div class="link-preview-title">${preview.title}</div>
                  <div class="link-preview-domain">${preview.domain}</div>
                </div>
              </a>
              <button class="link-remove-btn" title="Convert to plain link" data-url="${preview.url}">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          `;
          setTimeout(() => {
            const resolvedEl = document.getElementById(`${placeholderId}-resolved`);
            if (resolvedEl) {
              resolvedEl.removeAttribute('id');
              const sel = window.getSelection();
              const range = document.createRange();
              range.setStartAfter(resolvedEl);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }, 10);
        } else {
          // If fetch fails, replace with simple text link
          const link = document.createElement("a");
          link.href = url;
          link.textContent = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.style.color = "var(--color-accent)";
          link.style.textDecoration = "underline";
          link.style.cursor = "pointer";
          el.parentNode.replaceChild(link, el);
        }
        syncContentToState();
      });
      return;
    }

    // --- Slash command trigger ---
    const slashMatch = text.match(/(?:^|\s)(\/)([^/\s]*)$/);
    if (slashMatch) {
      const coords = getCaretCoordinates();
      if (coords) {
        setSlashState((prev) => ({
          isOpen: true,
          query: slashMatch[2],
          x: coords.x,
          y: coords.y,
          activeIndex:
            prev.isOpen && prev.query === slashMatch[2] ? prev.activeIndex : 0,
        }));
      }
    } else {
      setSlashState((prev) => {
        if (!prev.isOpen) return prev;
        return { ...prev, isOpen: false };
      });
    }
  }, [syncContentToState]);

  const createNewDoc = (e, targetGroupId = null) => {
    if (e) e.stopPropagation();
    // Flush current doc before creating new one
    flushCurrentDoc();
    const newId = Math.random().toString(36).substring(2, 9);
    const newDoc = {
      id: newId,
      title: "",
      content: "<p><br></p>",
      isPinned: false,
      emoji: null,
      hasCustomEmoji: false,
      groupId: targetGroupId,
    };

    const newDocs = [newDoc, ...docsRef.current];
    docsRef.current = newDocs;
    setDocs(newDocs);

    prevActiveDocIdRef.current = newId;
    setActiveDocId(newId);
    setSelectedDocIds([newId]);

    // Load the new doc into the editor directly
    if (titleRef.current) titleRef.current.innerText = "";
    if (editorRef.current) editorRef.current.innerHTML = "<p><br></p>";
  };

  const createGroup = () => {
    const newGroupId = Math.random().toString(36).substring(2, 9);
    const newGroup = {
      id: newGroupId,
      name: "New Group",
      color: "#9ca3af", // default gray
      isCollapsed: false,
    };
    setGroups(prev => [newGroup, ...prev]);

    // If docs are selected, move them to the new group
    if (selectedDocIds.length > 0) {
      const newDocs = docsRef.current.map(d =>
        selectedDocIds.includes(d.id) ? { ...d, groupId: newGroupId } : d
      );
      docsRef.current = newDocs;
      setDocs(newDocs);
      setSelectedDocIds([]); // Clear selection to revert to 'New Document' button
    }
  };

  const updateGroup = (id, updates) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGroup = (e, id) => {
    e.stopPropagation();
    // Move all docs inside this group to no group
    const newDocs = docsRef.current.map(d => d.groupId === id ? { ...d, groupId: null } : d);
    docsRef.current = newDocs;
    setDocs(newDocs);
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  const deleteDoc = (e, id) => {
    e.stopPropagation();
    setDocs((prev) => {
      if (prev.length === 1) {
        const freshDoc = {
          id: "1",
          title: "",
          content: "<p><br></p>",
          isPinned: false,
          emoji: null,
          hasCustomEmoji: false,
          groupId: null,
        };
        setActiveDocId("1");
        if (titleRef.current) titleRef.current.innerText = "";
        if (editorRef.current) editorRef.current.innerHTML = "<p><br></p>";
        docsRef.current = [freshDoc];
        return [freshDoc];
      }
      const newDocs = prev.filter((d) => d.id !== id);
      if (activeDocId === id) {
        setActiveDocId(newDocs[0].id);
      }
      docsRef.current = newDocs;
      return newDocs;
    });
    setSelectedDocIds(prev => prev.filter(selectedId => selectedId !== id));
  };

  const togglePinDoc = (e, id) => {
    e.stopPropagation();
    const newDocs = docsRef.current.map((d) => (d.id === id ? { ...d, isPinned: !d.isPinned } : d));
    docsRef.current = newDocs;
    setDocs(newDocs);
  };

  const toggleLockDoc = (docId) => {
    const doc = docsRef.current.find(d => d.id === docId);
    if (!doc) return;

    if (doc.isLocked) {
      // Unlock: prompt for passcode
      setLockModal({ mode: 'unlock', docId, action: 'toggle' });
      setPasscodeInput('');
    } else {
      // Lock: if no passcode exists yet, create one first
      if (!lockPasscode) {
        setLockModal({ mode: 'create', docId });
        setPasscodeInput('');
      } else {
        const newDocs = docsRef.current.map(d => d.id === docId ? { ...d, isLocked: true } : d);
        docsRef.current = newDocs;
        setDocs(newDocs);
      }
    }
    setContextMenu(null);
  };

  const handlePasscodeSubmit = (code) => {
    const pin = code || passcodeInput;
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return;

    if (lockModal.mode === 'create') {
      // Creating first passcode
      localStorage.setItem('words_lock_passcode', pin);
      setLockPasscode(pin);
      const newDocs = docsRef.current.map(d => d.id === lockModal.docId ? { ...d, isLocked: true } : d);
      docsRef.current = newDocs;
      setDocs(newDocs);
      setLockModal(null);
      setPasscodeInput('');
    } else if (lockModal.mode === 'unlock') {
      if (pin === lockPasscode) {
        if (lockModal.action === 'toggle') {
          const newDocs = docsRef.current.map(d => d.id === lockModal.docId ? { ...d, isLocked: false } : d);
          docsRef.current = newDocs;
          setDocs(newDocs);
        } else {
          // Opening locked doc — flush first, then switch
          flushCurrentDoc();
          prevActiveDocIdRef.current = lockModal.docId;
          setActiveDocId(lockModal.docId);
          setSelectedDocIds([lockModal.docId]);
          // Load the doc directly
          const doc = docsRef.current.find(d => d.id === lockModal.docId);
          if (doc && editorRef.current && titleRef.current) {
            titleRef.current.innerText = doc.title;
            editorRef.current.innerHTML = doc.content;
          }
          if (!isSidebarOpen) setIsSidebarPeeking(false);
        }
        setLockModal(null);
        setPasscodeInput('');
      } else {
        setPasscodeInput('');
      }
    }
  };

  const handleContextMenu = (e, docId) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      docId,
      x: rect.right,
      y: rect.top,
    });
  };

  const handleDocClick = (e, id) => {
    // Close context menu on any click
    setContextMenu(null);

    // Check if the doc is locked
    const doc = docs.find(d => d.id === id);
    if (doc?.isLocked && activeDocId !== id) {
      e.preventDefault();
      setLockModal({ mode: 'unlock', docId: id, action: 'open' });
      setPasscodeInput('');
      return;
    }

    if (e.shiftKey && selectedDocIds.length > 0) {
      e.preventDefault();
      // Simple range selection: select everything between last active and current
      const lastSelectedIdx = docs.findIndex(d => d.id === activeDocId);
      const currentIdx = docs.findIndex(d => d.id === id);

      if (lastSelectedIdx !== -1 && currentIdx !== -1) {
        const start = Math.min(lastSelectedIdx, currentIdx);
        const end = Math.max(lastSelectedIdx, currentIdx);
        const rangeIds = docs.slice(start, end + 1).map(d => d.id);

        // Add rangeIds to existing selection, making sure not to duplicate
        setSelectedDocIds(prev => [...new Set([...prev, ...rangeIds])]);
      }
    } else if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      // Toggle selection
      setSelectedDocIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(item => item !== id);
        } else {
          return [...prev, id];
        }
      });
    } else {
      // Normal click
      setActiveDocId(id);
      setSelectedDocIds([id]);
      setLockModal(null);
      setPasscodeInput('');
      if (!isSidebarOpen) setIsSidebarPeeking(false);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, type, id) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedItem({ type, id });

    // If dragging a doc that isn't selected, select only it
    // But don't switch to locked docs (would bypass passcode)
    if (type === 'doc' && !selectedDocIds.includes(id)) {
      const doc = docs.find(d => d.id === id);
      setSelectedDocIds([id]);
      if (!doc?.isLocked) {
        setActiveDocId(id);
      }
    }

    // Custom drag ghost
    if (type === 'doc' && selectedDocIds.length > 1) {
      const ghost = document.createElement("div");
      ghost.className = "bg-blue-500 text-white px-3 py-1 rounded-md text-sm shadow-lg pointer-events-none fixed -top-10";
      ghost.innerHTML = `Moving ${selectedDocIds.includes(id) ? selectedDocIds.length : 1} documents`;
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 15, 15);
      setTimeout(() => document.body.removeChild(ghost), 0);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragTarget(null);
  };

  const handleSidebarDragOver = (e, targetId = null, targetType = 'root') => {
    if (draggedItem?.type === 'group' && targetType === 'doc') {
      return; // allow bubble to group flex-col
    }
    e.preventDefault(); // Necessary to allow dropping
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (targetType === 'doc' && targetId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const position = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
      setDragTarget({ id: targetId, position, type: 'doc' });
    } else if (targetType === 'group' && targetId) {
      // If dragging a group over another group, show before/after for reordering
      if (draggedItem?.type === 'group') {
        const rect = e.currentTarget.getBoundingClientRect();
        const position = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
        setDragTarget({ id: targetId, position, type: 'group' });
      } else {
        setDragTarget({ id: targetId, position: 'inset', type: 'group' });
      }
    } else {
      setDragTarget(null);
    }
  };

  const handleDragLeave = () => {
    setDragTarget(null);
  };

  const handleDropOnGroup = (e, groupId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTarget(null);
    if (!draggedItem) return;

    if (draggedItem.type === 'doc') {
      // Move all selected docs into this group
      const idsToMove = selectedDocIds.includes(draggedItem.id) ? selectedDocIds : [draggedItem.id];
      setDocs(prev => {
        let newDocs = [...prev];
        idsToMove.forEach(docId => {
          const idx = newDocs.findIndex(d => d.id === docId);
          if (idx !== -1) {
            newDocs[idx] = { ...newDocs[idx], groupId };
          }
        });
        docsRef.current = newDocs;
        return newDocs;
      });
    } else if (draggedItem.type === 'group' && draggedItem.id !== groupId) {
      // Reorder groups
      const rect = e.currentTarget.getBoundingClientRect();
      const position = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
      setGroups(prev => {
        const draggedIdx = prev.findIndex(g => g.id === draggedItem.id);
        if (draggedIdx === -1) return prev;
        const newGroups = prev.filter(g => g.id !== draggedItem.id);
        const targetIdx = newGroups.findIndex(g => g.id === groupId);
        if (targetIdx === -1) return prev;
        newGroups.splice(position === 'before' ? targetIdx : targetIdx + 1, 0, prev[draggedIdx]);
        return newGroups;
      });
    }
    setDraggedItem(null);
  };

  const handleDropOnDoc = (e, targetDocId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTarget(null);
    if (!draggedItem) return;

    if (draggedItem.type === 'doc') {
      const rect = e.currentTarget.getBoundingClientRect();
      const position = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';

      setDocs(prev => {
        const idsToMove = selectedDocIds.includes(draggedItem.id) ? selectedDocIds : [draggedItem.id];
        if (idsToMove.includes(targetDocId)) return prev; // Don't drop onto itself

        let newDocs = prev.filter(d => !idsToMove.includes(d.id)); // Remove dragged items

        const targetIdx = newDocs.findIndex(d => d.id === targetDocId);
        if (targetIdx === -1) return prev;

        const targetDoc = newDocs[targetIdx];
        const targetGroupId = targetDoc.groupId;

        // Collect the docs to move, updating their groupId to match the target
        const docsToInsert = prev
          .filter(d => idsToMove.includes(d.id))
          .map(d => ({ ...d, groupId: targetGroupId }));

        // Insert at target index
        newDocs.splice(position === 'before' ? targetIdx : targetIdx + 1, 0, ...docsToInsert);
        docsRef.current = newDocs;
        return newDocs;
      });
    } else if (draggedItem.type === 'group') {
      // Group reordering logic if needed
    }
    setDraggedItem(null);
  };

  const handleDropOnSidebarRoot = (e) => {
    e.preventDefault();
    setDragTarget(null);
    if (!draggedItem) return;

    if (draggedItem.type === 'doc') {
      // Move selected docs to root (no group)
      const idsToMove = selectedDocIds.includes(draggedItem.id) ? selectedDocIds : [draggedItem.id];
      setDocs(prev => {
        let newDocs = [...prev];
        idsToMove.forEach(docId => {
          const idx = newDocs.findIndex(d => d.id === docId);
          if (idx !== -1) {
            newDocs[idx] = { ...newDocs[idx], groupId: null };
          }
        });
        docsRef.current = newDocs;
        return newDocs;
      });
    }
    setDraggedItem(null);
  };

  const getCaretCoordinates = () => {
    let x = 0, y = 0;
    const isSupported = typeof window.getSelection !== "undefined";
    if (isSupported) {
      const selection = window.getSelection();
      if (selection.rangeCount !== 0) {
        const range = selection.getRangeAt(0).cloneRange();
        range.collapse(true);
        const rect = range.getBoundingClientRect();
        if (rect.x === 0 && rect.y === 0) {
          const span = document.createElement("span");
          span.appendChild(document.createTextNode("\u200b"));
          range.insertNode(span);
          const spanRect = span.getBoundingClientRect();
          x = spanRect.left;
          y = spanRect.bottom;
          const spanParent = span.parentNode;
          spanParent.removeChild(span);
          spanParent.normalize();
        } else {
          x = rect.left;
          y = rect.bottom;
        }
      }
    }
    return { x, y };
  };

  const executeCommand = (command) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const node = selection.focusNode;

    const text = node.textContent.substring(0, selection.focusOffset);
    const match = text.match(/(?:^|\s)(\/)([^/\s]*)$/);

    if (match) {
      const triggerIndex = text.lastIndexOf(match[1]);
      range.setStart(node, triggerIndex);
      range.setEnd(node, selection.focusOffset);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("delete", false, null);
    }

    if (command.type === "formatBlock") {
      document.execCommand("formatBlock", false, `<${command.tag}>`);
    } else if (command.type === "list") {
      document.execCommand(command.tag, false, null);
    } else if (command.type === "insertHTML") {
      document.execCommand("insertHTML", false, command.tag);
    } else if (command.type === "checklist") {
      document.execCommand("insertUnorderedList", false, null);
      setTimeout(() => {
        const curSel = window.getSelection();
        if (curSel && curSel.focusNode) {
          const ul = (
            curSel.focusNode.nodeType === 3
              ? curSel.focusNode.parentElement
              : curSel.focusNode
          ).closest("ul");
          if (ul) {
            ul.classList.add("checklist");
            syncContentToState();
          }
        }
      }, 10);
    }

    setSlashState((prev) => ({ ...prev, isOpen: false, query: "" }));

    setTimeout(() => {
      editorRef.current.focus();
      syncContentToState();
    }, 10);
  };

  const formatText = (e, format, value = null) => {
    e.preventDefault();
    document.execCommand(format, false, value);
    syncContentToState();
  };

  // --- Image Insertion Utilities ---
  const createImgWrapperHTML = (src) => {
    return `<div class="image-outer" contenteditable="false" style="display: block; max-width: 100%; width: 320px; min-width: 100px; margin: 0.75em 0; position: relative;"><span class="image-wrapper" style="display: block; border-radius: 8px; overflow: hidden; resize: horizontal; min-height: 50px;"><img
      src="${src}" style="width: 100%; height: auto; display: block; object-fit: cover; pointer-events: none;" /></span><button
      class="image-delete-btn" contenteditable="false" title="Delete image"><svg xmlns="http://www.w3.org/2000/svg"
        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      </svg></button></div>&nbsp;`;
  };

  const insertImageFile = (file, targetNodeToReplace = null) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const max_size = 1200;

        if (width > max_size || height > max_size) {
          if (width > height) {
            height = Math.round((height * max_size) / width);
            width = max_size;
          } else {
            width = Math.round((width * max_size) / height);
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

        const html = createImgWrapperHTML(dataUrl);
        if (targetNodeToReplace) {
          targetNodeToReplace.outerHTML = html;
        } else {
          document.execCommand("insertHTML", false, html);
        }
        syncContentToState();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // --- Editor Wide Interactivity ---
  const handleEditorMouseDown = (e) => {
    if (e.target.closest(".link-remove-btn")) {
      e.preventDefault();
      const btn = e.target.closest(".link-remove-btn");
      const url = btn.getAttribute("data-url");
      const wrapper = e.target.closest(".link-preview-outer");
      if (wrapper) {
        // Create a plain span that looks like a link or standard slate text
        // Slate might overwrite standard <a> tags if not configured correctly,
        // but since we rely on `contenteditable="false"`, an <a> tag is fine.
        const link = document.createElement("a");
        link.href = url;
        link.textContent = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        // Ensure it looks like a standard hyperlink within the editor
        link.style.color = "var(--color-accent)";
        link.style.textDecoration = "underline";
        link.style.cursor = "pointer";

        wrapper.parentNode.replaceChild(link, wrapper);

        syncContentToState();
      }
      return;
    }

    if (e.target.closest(".image-delete-btn")) {
      e.preventDefault();
      const wrapper = e.target.closest(".image-outer") || e.target.closest(".image-wrapper");
      if (wrapper) {
        if (
          wrapper.nextSibling &&
          wrapper.nextSibling.nodeType === 3 &&
          wrapper.nextSibling.textContent === "\u00A0"
        ) {
          wrapper.nextSibling.remove();
        }
        wrapper.remove();
        syncContentToState();
      }
      return;
    }

    if (e.target.tagName === "LI") {
      const ul = e.target.closest("ul");
      if (ul && ul.classList.contains("checklist")) {
        const rect = e.target.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.left + 24) {
          e.target.classList.toggle("checked");
          syncContentToState();
          e.preventDefault();
          return;
        }
      }
    }
    if (e.target.classList.contains("table-resize-handle")) {
      e.preventDefault();
      const wrapper = e.target.closest(".table-wrapper");
      const table = wrapper.querySelector("table");
      const tbody = table.querySelector("tbody");
      const startX = e.clientX;
      const startY = e.clientY;
      const trs = Array.from(tbody.querySelectorAll("tr"));
      const startRows = trs.length;
      const startCols = trs[0] ? trs[0].querySelectorAll("td").length : 1;
      const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const newCols = Math.max(1, startCols + Math.round(dx / 120));
        const newRows = Math.max(1, startRows + Math.round(dy / 38));

        const currentTrs = Array.from(tbody.querySelectorAll("tr"));

        while (currentTrs.length < newRows) {
          const tr = document.createElement("tr");
          for (let i = 0; i < newCols; i++) tr.innerHTML += "<td><br></td>";
          tbody.appendChild(tr);
          currentTrs.push(tr);
        }
        while (currentTrs.length > newRows) {
          tbody.lastChild.remove();
          currentTrs.pop();
        }

        currentTrs.forEach((tr) => {
          const tds = Array.from(tr.querySelectorAll("td"));
          while (tds.length < newCols) {
            const td = document.createElement("td");
            td.innerHTML = "<br>";
            tr.appendChild(td);
            tds.push(td);
          }
          while (tds.length > newCols) {
            tr.lastChild.remove();
            tds.pop();
          }
        });
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        syncContentToState();
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      return;
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Handle image paste
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        insertImageFile(file);
        return;
      }
    }

    // Handle HTML paste: strip external font/color styles so content uses our native fonts
    const html = e.clipboardData.getData('text/html');

    // Handle Link paste
    const textData = e.clipboardData.getData('text/plain');
    const isExactUrl = /^https?:\/\/[^\s]+$/.test(textData.trim());

    if (isExactUrl) {
      e.preventDefault();
      const url = textData.trim();

      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);

      const placeholderId = `link-preview-${Date.now()}`;
      const placeholder = document.createElement("div");
      placeholder.id = placeholderId;
      placeholder.contentEditable = "false";
      placeholder.className = "link-preview-loading";

      range.deleteContents();
      range.insertNode(placeholder);

      range.setStartAfter(placeholder);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      document.execCommand('insertParagraph', false);

      syncContentToState();

      fetchLinkPreviewData(url).then(preview => {
        const el = document.getElementById(placeholderId);
        if (!el) return;

        if (preview) {
          el.outerHTML = `
            <div class="link-preview-outer" contenteditable="false" id="${placeholderId}-resolved">
              <a href="${preview.url}" target="_blank" rel="noopener noreferrer" class="link-preview-card">
                ${preview.image ? `<img src="${preview.image}" class="link-preview-image" alt="Preview" onerror="this.onerror=null; this.style.display='none';" />` : ''}
                <div class="link-preview-content">
                  <div class="link-preview-title">${preview.title}</div>
                  <div class="link-preview-domain">${preview.domain}</div>
                </div>
              </a>
              <button class="link-remove-btn" contenteditable="false" title="Convert to plain link" data-url="${preview.url}">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          `;
          setTimeout(() => {
            const resolvedEl = document.getElementById(`${placeholderId}-resolved`);
            if (resolvedEl) {
              resolvedEl.removeAttribute('id');
            }
          }, 10);
        } else {
          // Fallback
          const link = document.createElement("a");
          link.href = url;
          link.textContent = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.style.color = "var(--color-accent)";
          link.style.textDecoration = "underline";
          link.style.cursor = "pointer";
          el.parentNode.replaceChild(link, el);
        }
        syncContentToState();
      });
      return;
    }

    if (html) {
      e.preventDefault();
      const container = document.createElement('div');
      container.innerHTML = html;

      // Strip font-related inline styles from all elements
      const stylesToRemove = [
        'font-family', 'font-size', 'font-weight', 'color', 'background-color',
        'background', 'line-height', 'letter-spacing', 'word-spacing',
        'text-indent', 'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
        'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
      ];

      container.querySelectorAll('*').forEach(el => {
        // Remove class attributes that carry external styling
        el.removeAttribute('class');
        el.removeAttribute('id');

        if (el.style) {
          stylesToRemove.forEach(prop => el.style.removeProperty(prop));
          // If style attribute is now empty, remove it entirely
          if (!el.getAttribute('style')?.trim()) {
            el.removeAttribute('style');
          }
        }

        // Remove <font> tags by unwrapping their children
        if (el.tagName === 'FONT') {
          const parent = el.parentNode;
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
        }
      });

      // Unwrap spans that have no remaining attributes (they cause cursor/caret issues)
      container.querySelectorAll('span').forEach(span => {
        if (span.attributes.length === 0) {
          const parent = span.parentNode;
          while (span.firstChild) parent.insertBefore(span.firstChild, span);
          parent.removeChild(span);
        }
      });

      // Re-apply bold/italic from semantic tags (b, strong, i, em are preserved naturally)
      // Insert the cleaned HTML
      const sel = window.getSelection();
      if (sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const frag = range.createContextualFragment(container.innerHTML);
        range.insertNode(frag);
        // Move cursor to end of inserted content
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      syncContentToState();
    }
  };
  const handleDrop = (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        e.preventDefault();
        const placeholder = e.target.closest(".image-placeholder");

        if (!placeholder && document.caretRangeFromPoint) {
          const range = document.caretRangeFromPoint(e.clientX, e.clientY);
          if (range) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
        insertImageFile(file, placeholder);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleKeyDown = useCallback(
    (e) => {
      // --- 1. Math Preview Interceptor & Cleanup ---
      const preview = editorRef.current?.querySelector(".math-preview");
      if (preview) {
        // Let standard navigation arrows pass through unhindered (but strip the preview to prevent stale ghost blocks)
        if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key))
          return;
        const isNav = [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
        ].includes(e.key);

        const ans = preview.textContent;

        if ([" ", "Enter", "Tab"].includes(e.key)) {
          e.preventDefault(); // Do not insert the space/tab! Use it strictly to commit the answer.
          isInternalEdit.current = true;

          // Clean up the DOM string naturally
          if (
            preview.nextSibling &&
            preview.nextSibling.nodeType === 3 &&
            preview.nextSibling.textContent.includes("\u200B")
          ) {
            preview.nextSibling.textContent =
              preview.nextSibling.textContent.replace(/\u200B/g, "");
          }

          // Reposition cursor safely before preview so removal is clean
          const sel = window.getSelection();
          const range = document.createRange();
          range.setStartBefore(preview);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);

          preview.remove();

          // Insert Answer as raw text
          document.execCommand("insertText", false, ans);

          isInternalEdit.current = false;
          syncContentToState();
          return;
        } else if (e.key === "Backspace") {
          e.preventDefault();
          isInternalEdit.current = true;

          if (
            preview.nextSibling &&
            preview.nextSibling.nodeType === 3 &&
            preview.nextSibling.textContent.includes("\u200B")
          ) {
            preview.nextSibling.textContent =
              preview.nextSibling.textContent.replace(/\u200B/g, "");
          }

          const sel = window.getSelection();
          const range = document.createRange();
          range.setStartBefore(preview);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);

          preview.remove();

          // Also delete the '=' sign that triggered it
          document.execCommand("delete", false, null);

          isInternalEdit.current = false;
          syncContentToState();
          return;
        } else if (!isNav) {
          // Typing another character kills the preview and types over it
          if (
            preview.nextSibling &&
            preview.nextSibling.nodeType === 3 &&
            preview.nextSibling.textContent.includes("\u200B")
          ) {
            preview.nextSibling.textContent =
              preview.nextSibling.textContent.replace(/\u200B/g, "");
          }

          const sel = window.getSelection();
          const range = document.createRange();
          range.setStartBefore(preview);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);

          preview.remove();
          // Character natively inserts itself here since we didn't block it
          setTimeout(() => syncContentToState(), 0);
        }
      }

      // --- 2. Slash Commands Menu Navigation ---
      if (slashState.isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashState((prev) => ({
            ...prev,
            activeIndex: (prev.activeIndex + 1) % filteredCommands.length,
          }));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashState((prev) => ({
            ...prev,
            activeIndex:
              (prev.activeIndex - 1 + filteredCommands.length) %
              filteredCommands.length,
          }));
        } else if (e.key === "Enter") {
          e.preventDefault();
          const selectedCommand =
            filteredCommands[slashState.activeIndex] || filteredCommands[0];
          if (selectedCommand) executeCommand(selectedCommand);
        } else if (e.key === "Escape") {
          e.preventDefault();
          setSlashState((prev) => ({ ...prev, isOpen: false }));
        }
        return;
      }

      // --- 3. Markdown Formatting Shortcuts ---
      const selection = window.getSelection();

      if (e.key === " " || e.key === "Enter") {
        if (selection && selection.focusNode) {
          const focusNode = selection.focusNode;
          const text = focusNode.textContent.substring(
            0,
            selection.focusOffset,
          );

          if (text.endsWith("1.") && e.key === " ") {
            e.preventDefault();
            const range = selection.getRangeAt(0);
            range.setStart(focusNode, selection.focusOffset - 2);
            range.setEnd(focusNode, selection.focusOffset);
            range.deleteContents();
            document.execCommand("insertOrderedList", false, null);
            syncContentToState();
            return;
          } else if (
            (text.endsWith("-") || text.endsWith("*")) &&
            e.key === " "
          ) {
            e.preventDefault();
            const range = selection.getRangeAt(0);
            range.setStart(focusNode, selection.focusOffset - 1);
            range.setEnd(focusNode, selection.focusOffset);
            range.deleteContents();
            document.execCommand("insertUnorderedList", false, null);
            syncContentToState();
            return;
          } else if (text.endsWith("[]") && e.key === " ") {
            e.preventDefault();
            const range = selection.getRangeAt(0);
            range.setStart(focusNode, selection.focusOffset - 2);
            range.setEnd(focusNode, selection.focusOffset);
            range.deleteContents();
            document.execCommand("insertUnorderedList", false, null);
            setTimeout(() => {
              const curSel = window.getSelection();
              if (curSel && curSel.focusNode) {
                const ul = (
                  curSel.focusNode.nodeType === 3
                    ? curSel.focusNode.parentElement
                    : curSel.focusNode
                ).closest("ul");
                if (ul) ul.classList.add("checklist");
                syncContentToState();
              }
            }, 10);
            return;
          } else if (
            text.endsWith("/table") &&
            (e.key === " " || e.key === "Enter")
          ) {
            e.preventDefault();
            const range = selection.getRangeAt(0);
            range.setStart(focusNode, selection.focusOffset - 6);
            range.setEnd(focusNode, selection.focusOffset);
            range.deleteContents();
            const cmd = COMMANDS.find((c) => c.id === "table");
            document.execCommand("insertHTML", false, cmd.tag);
            syncContentToState();
            return;
          }
        }
      }

      if (e.key === "Tab") {
        e.preventDefault();
        document.execCommand(e.shiftKey ? "outdent" : "indent", false, null);
        syncContentToState();
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        if (selection && selection.focusNode) {
          const focusNode = selection.focusNode;
          const element =
            focusNode.nodeType === 3 ? focusNode.parentElement : focusNode;
          const blockElement = element.closest("h1, h2, h3, blockquote");

          if (blockElement) {
            setTimeout(() => {
              const newSelection = window.getSelection();
              if (newSelection && newSelection.focusNode) {
                const newNode = newSelection.focusNode;
                const newElement =
                  newNode.nodeType === 3 ? newNode.parentElement : newNode;

                if (
                  newElement &&
                  newElement.closest("h1, h2, h3, blockquote") &&
                  (newElement.textContent.trim() === "" ||
                    newElement.innerHTML === "<br>")
                ) {
                  document.execCommand("formatBlock", false, "P");
                  syncContentToState();
                }
              }
            }, 0);
          }

          const liElement = element.closest("li");
          if (liElement) {
            setTimeout(() => {
              const newSel = window.getSelection();
              if (newSel && newSel.focusNode) {
                const newNode =
                  newSel.focusNode.nodeType === 3
                    ? newSel.focusNode.parentElement
                    : newSel.focusNode;
                const newLi = newNode.closest("li");
                if (
                  newLi &&
                  newLi !== liElement &&
                  newLi.classList.contains("checked") &&
                  newLi.textContent.trim() === ""
                ) {
                  newLi.classList.remove("checked");
                  syncContentToState();
                }
              }
            }, 10);
          }
        }
      }
    },
    [slashState, filteredCommands, syncContentToState],
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        slashMenuRef.current &&
        !slashMenuRef.current.contains(event.target)
      ) {
        setSlashState((prev) => ({ ...prev, isOpen: false }));
      }
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setIsEmojiPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pinnedDocs = docs.filter((d) => d.isPinned);
  const regularDocs = docs.filter((d) => !d.isPinned);
  // A document is considered "ungrouped" if it has no groupId, OR if its groupId doesn't exist in the current groups array.
  const ungroupedDocs = regularDocs.filter((d) => !d.groupId || !groups.some(g => g.id === d.groupId));
  const activeDoc = docs.find((d) => d.id === activeDocId) || docs[0];

  const renderDocItem = (doc) => {
    const isSelected = selectedDocIds.includes(doc.id);
    const isActive = activeDocId === doc.id;
    return (
      <div
        key={doc.id}
        draggable
        onDragStart={(e) => handleDragStart(e, 'doc', doc.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleSidebarDragOver(e, doc.id, 'doc')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDropOnDoc(e, doc.id)}
        onClick={(e) => handleDocClick(e, doc.id)}
        className={`group relative flex items-center justify-between px-3 py-[6px] rounded-md cursor-pointer transition-colors ${isSelected
          ? "bg-[var(--color-bg-hover-strong)] text-[var(--color-text-primary)] font-medium"
          : isActive ? "text-[var(--color-text-primary)] font-medium bg-black/[0.02] dark:bg-white/[0.04]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
          }`}
      >
        {dragTarget?.id === doc.id && dragTarget?.position === 'before' && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full z-10 pointer-events-none" />
        )}
        <div
          ref={(el) => {
            if (el) {
              const isOverflowing = el.scrollWidth > el.clientWidth;
              if (isOverflowing) {
                el.classList.add('sidebar-doc-text');
              } else {
                el.classList.remove('sidebar-doc-text');
              }
            }
          }}
          className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden"
        >
          <div className="text-base flex-shrink-0 leading-none select-none flex items-center justify-center w-5 h-5">
            {doc.isLocked ? (
              <Lock
                size={16}
                className="text-[var(--color-icon-muted)]"
              />
            ) : doc.emoji ? (
              <span className="animate-in zoom-in spin-in-12 duration-300">
                {doc.emoji}
              </span>
            ) : (
              <FileText
                size={16}
                className={
                  isActive ? "text-[var(--color-text-muted)]" : "text-[var(--color-icon-muted)]"
                }
              />
            )}
          </div>
          <span className="text-[14px] select-none whitespace-nowrap">
            {doc.title || "Untitled"}
          </span>
        </div>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => handleContextMenu(e, doc.id)}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded transition-colors"
            title="More options"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
        {dragTarget?.id === doc.id && dragTarget?.position === 'after' && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full z-10 pointer-events-none" />
        )}
      </div>
    )
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans selection:bg-[#2383e233] overflow-hidden relative w-full">
      {/* Dynamic Editor Typography */}
      <style
        dangerouslySetInnerHTML={{
          __html: ` .editor-content { outline: none; padding-bottom: 30vh; color:
              var(--color-text-primary); } .editor-content::after { content: "" ; display: table; clear: both; } .editor-content>
              * {
                margin-top: 2px;
                margin-bottom: 2px;
                line-height: 1.5;
              }

              .editor-content h1,
              .editor-content h2,
              .editor-content h3,
              .editor-content .table-container,
              .editor-content blockquote {
                clear: both;
              }

              .editor-content h1 {
                font-size: 1.875rem;
                font-weight: 600;
                margin-top: 1.4em;
                margin-bottom: 0.25em;
                line-height: 1.3;
              }

              .editor-content h2 {
                font-size: 1.5rem;
                font-weight: 600;
                margin-top: 1.4em;
                margin-bottom: 0.25em;
                line-height: 1.3;
              }

              .editor-content h3 {
                font-size: 1.25rem;
                font-weight: 600;
                margin-top: 1em;
                margin-bottom: 0.25em;
              }

              .editor-content p {
                font-size: 1rem;
                min-height: 1.5em;
                margin-top: 4px;
                margin-bottom: 4px;
              }

              .editor-content ul {
                list-style-type: disc;
                padding-left: 1.5em;
                margin-top: 0.5em;
                margin-bottom: 0.5em;
              }

              .editor-content ul ul {
                list-style-type: circle;
                margin-top: 0.25em;
                margin-bottom: 0.25em;
              }

              .editor-content ul ul ul {
                list-style-type: square;
              }

              .editor-content ul.checklist {
                list-style: none;
                padding-left: 0;
              }

              .editor-content ul.checklist>li {
                position: relative;
                padding-left: 1.8em;
                margin-bottom: 4px;
              }

              .editor-content ul.checklist>li::before {
                content: '';
                position: absolute;
                left: 0.1em;
                top: 0.35em;
                width: 16px;
                height: 16px;
                box-shadow: inset 0 0 0 1.5px var(--color-icon-muted);
                border-radius: calc(4px + var(--radius-bonus));
                cursor: pointer;
                background-color: white;
                transition: all 0.2s ease;
              }

              .editor-content ul.checklist>li.checked::before {
                background-color: var(--color-accent);
                box-shadow: inset 0 0 0 1.5px var(--color-accent);
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E");
                background-size: 12px 12px;
                background-position: center;
                background-repeat: no-repeat;
              }

              .editor-content ul.checklist>li.checked {
                text-decoration: line-through;
                color: var(--color-text-muted);
              }

              .editor-content ol {
                list-style-type: decimal !important;
                padding-left: 1.5em;
                margin-top: 0.5em;
                margin-bottom: 0.5em;
              }

              .editor-content ol li {
                display: list-item;
                list-style-type: decimal !important;
              }

              .editor-content ol ol {
                list-style-type: lower-alpha !important;
              }

              .editor-content ol ol ol {
                list-style-type: lower-roman !important;
              }

              .editor-content li {
                font-size: 1rem;
                margin-bottom: 0.25em;
              }

              .editor-content a {
                color: var(--color-accent);
                text-decoration: underline;
                cursor: pointer;
              }

              .editor-content blockquote {
                border-left: 3px solid var(--color-text-primary);
                padding-left: 0.9em;
                margin-top: 0.8em;
                margin-bottom: 0.8em;
                font-size: 1rem;
              }
              
              .editor-content blockquote p {
                margin-top: 0;
                margin-bottom: 0;
              }

              .editor-content span[style*="background-color"] {
                padding: 0.1em 0.2em;
                border-radius: 3px;
              }

              /* Strict Inline Math Preview Styling */
              .editor-content .math-preview {
                display: inline !important;
                color: var(--color-text-muted) !important;
                pointer-events: none !important;
                user-select: none !important;
                -webkit-user-select: none !important;
                white-space: pre !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              /* Image Hover Delete Button */
              .image-outer {
                position: relative;
              }

              .image-wrapper {
                border-radius: 8px;
                overflow: hidden;
              }

              .image-outer .image-delete-btn,
              .image-wrapper .image-delete-btn {
                position: absolute;
                top: -6px;
                right: -6px;
                width: 22px;
                height: 22px;
                background: var(--color-bg-secondary, #fff);
                color: var(--color-text-muted, #888);
                border-radius: 50%;
                corner-shape: round;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.15s, background 0.15s, color 0.15s;
                cursor: pointer;
                border: 1px solid var(--color-border-primary, #e5e7eb);
                box-shadow: 0 1px 4px rgba(0,0,0,0.08);
                z-index: 20;
              }

              .image-outer:hover .image-delete-btn,
              .image-wrapper:hover .image-delete-btn {
                opacity: 1;
              }

              .image-outer .image-delete-btn:hover,
              .image-wrapper .image-delete-btn:hover {
                background: rgba(220, 38, 38, 0.9);
                color: white;
                border-color: transparent;
              }

              /* Sidebar doc text fade */
              .sidebar-doc-text {
                -webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
                mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
                transition: -webkit-mask-image 0.15s, mask-image 0.15s;
              }
              .group:hover .sidebar-doc-text {
                -webkit-mask-image: linear-gradient(to right, black calc(100% - 40px), transparent calc(100% - 8px));
                mask-image: linear-gradient(to right, black calc(100% - 40px), transparent calc(100% - 8px));
              }

              /* Clean Tables */
              .editor-content .table-container {
                margin: 1.5em 0;
                clear: both;
              }

              .editor-content .table-title {
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--color-text-primary);
                outline: none;
                margin-bottom: 0.5em;
                display: block;
              }

              .editor-content .table-title:empty:before {
                content: attr(data-placeholder);
                color: var(--color-text-muted);
                pointer-events: none;
              }

              .editor-content .table-wrapper {
                position: relative;
                display: block;
                width: 100%;
                max-width: 100%;
                box-shadow: none !important;
                outline: none !important;
              }

              .editor-content .table-scroll {
                overflow-x: auto;
                width: 100%;
                padding-bottom: 2px;
              }

              .editor-content table {
                min-width: 100%;
                border-collapse: collapse;
                outline: none !important;
                box-shadow: none !important;
                table-layout: fixed;
              }

              .editor-content tr {
                outline: none !important;
              }

              .editor-content td {
                border: 1px solid var(--color-border-primary);
                padding: 8px 12px;
                width: 120px;
                min-width: 120px;
                vertical-align: top;
                word-break: break-word;
                outline: none !important;
                transition: background 0.1s ease;
              }

              .editor-content td:focus-within {
                background: var(--color-bg-tertiary);
              }

              .table-resize-handle {
                position: absolute;
                bottom: -2px;
                right: -2px;
                width: 14px;
                height: 14px;
                background: var(--color-icon-muted);
                border-radius: 50%;
                cursor: se-resize;
                z-index: 10;
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                transition: transform 0.1s;
              }

              .table-resize-handle:hover {
                transform: scale(1.2);
                background: var(--color-accent);
              }

              .editor-content p:only-child:empty::before,
              .editor-content p:only-child:has(> br:only-child)::before,
              .editor-content:empty::before {
                content: "Type '/' for commands";
                color: var(--color-text-faint);
                pointer-events: none;
                position: absolute;
              }

              .title-input:empty::before {
                content: "Untitled";
                color: var(--color-text-faint);
                
                pointer-events: none;
                display: block;
              }

              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }

              .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }

              `,
        }}
      />{" "}
      {/* Sidebar Hover Trigger Zone (Active when closed) */}
      {!isSidebarOpen && !isSidebarPeeking && (
        <div
          className="absolute left-0 top-0 bottom-0 w-4 z-40"
          onMouseEnter={() => setIsSidebarPeeking(true)}
        />
      )}
      {/* Share Menu */}
      <div className="absolute top-4 right-4 z-30 print:hidden">
        <div className="relative">
          <button
            onClick={() => setShareMenuOpen(!shareMenuOpen)}
            className="p-2 text-[var(--color-text-faint)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
            title="Share"
          >
            <Share size={20} />
          </button>
          {shareMenuOpen && (
            <>
              <div className="fixed inset-0 z-[39]" onClick={() => setShareMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl py-1 z-[40] w-48 animate-in fade-in zoom-in-95 duration-100">
                <button
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  onClick={() => {
                    setShareMenuOpen(false);
                    setTimeout(() => window.print(), 100);
                  }}
                >
                  <Share size={14} /> Export to PDF
                </button>
                <div className="h-px bg-[var(--color-border-primary)] my-1" />
                <button
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  onClick={() => {
                    setShareMenuOpen(false);
                    setTimeout(() => window.print(), 100);
                  }}
                >
                  <Printer size={14} /> Print
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Hamburger Menu */}
      <div
        className={`absolute top-4 left-4 z-30 transition-opacity duration-300 ${!isSidebarOpen && !isSidebarPeeking
          ? "opacity-100"
          : "opacity-0 pointer-events-none"
          }

                `}
      >
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-[var(--color-text-faint)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>{" "}
      {/* Collapsible Sidebar */}
      <div
        onMouseLeave={() => {
          if (!isSidebarOpen) setIsSidebarPeeking(false);
        }}
        className={`absolute top-0 bottom-0 left-0 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-primary)] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2, 0.8, 0.2, 1)] z-50 overflow-hidden w-64 ${isSidebarOpen || isSidebarPeeking
          ? "translate-x-0"
          : "-translate-x-full"
          }

                ${isSidebarPeeking && !isSidebarOpen
            ? "shadow-[4px_0_24px_rgba(0,0,0,0.1)]"
            : "shadow-none"
          }

                `}
      >
        <div className="w-64 h-full flex flex-col">
          {" "}
          {/* Sidebar Header with Image Logo */}
          <div className="px-5 py-5 flex items-center justify-between group text-[var(--color-text-primary)]">
            <div className="flex items-center gap-2.5 font-semibold text-[15px] tracking-tight select-none">
              <div className="w-6 h-6 rounded flex items-center justify-center">
                <img src="/logolight.png" alt="Words Logo" className="w-full h-full object-contain dark:hidden" />
                <img src="/logodark.png" alt="Words Logo" className="w-full h-full object-contain hidden dark:block" />
              </div>
              Words
            </div>
            <button
              onClick={() => {
                if (isSidebarPeeking) {
                  setIsSidebarOpen(true);
                  setIsSidebarPeeking(false);
                } else {
                  setIsSidebarOpen(false);
                  setIsSidebarPeeking(false);
                }
              }}
              className="p-1 rounded-md text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover-strong)] transition-colors"
            >
              {isSidebarPeeking ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto no-scrollbar pb-6 mt-2 flex flex-col h-full px-2"
            onDragOver={handleSidebarDragOver}
            onDrop={handleDropOnSidebarRoot}
            onDoubleClick={(e) => {
              // Only create new doc if double-clicking truly empty sidebar space
              // Skip if clicking on any sidebar content item
              if (e.target.closest('button, input, a, [draggable], [data-sidebar-item]')) return;
              createNewDoc(e);
            }}
          >
            {isAuthLoading ? (
              <div className="px-3 py-2 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-[calc(4px+var(--radius-bonus))] bg-[var(--color-bg-hover)] animate-pulse" />
                    <div className="flex-1 h-3 rounded-[calc(4px+var(--radius-bonus))] bg-[var(--color-bg-hover)] animate-pulse opacity-60" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Pinned Tabs (Icons Only) */}
                {pinnedDocs.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {pinnedDocs.map((doc) => {
                        const isActive = activeDocId === doc.id;
                        const isSelected = selectedDocIds.includes(doc.id);
                        return (
                          <div
                            key={doc.id}
                            data-sidebar-item
                            onClick={(e) => handleDocClick(e, doc.id)}
                            className={`group relative flex-1 min-w-[50px] max-w-full flex items-center justify-center p-2 rounded-lg cursor-pointer transition-all border ${isSelected || isActive
                              ? "bg-[var(--color-bg-primary)] border-[var(--color-border-primary)]/80 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[var(--color-text-primary)] z-10"
                              : "bg-[var(--color-bg-hover)] border-transparent hover:bg-[var(--color-bg-hover-strong)] text-[var(--color-text-muted)]"
                              }`}
                            title={doc.title || "Untitled"}
                          >
                            <div className="text-xl flex-shrink-0 leading-none select-none flex items-center justify-center pointer-events-none">
                              {doc.emoji ? (
                                <span className="animate-in zoom-in spin-in-12 duration-300">
                                  {doc.emoji}
                                </span>
                              ) : (
                                <FileText
                                  size={20}
                                  className={
                                    isSelected || isActive
                                      ? "text-[var(--color-text-muted)]"
                                      : "text-[var(--color-icon-muted)]"
                                  }
                                />
                              )}
                            </div>
                            <button
                              onClick={(e) => togglePinDoc(e, doc.id)}
                              className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 p-0.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] shadow-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-full transition-all z-20"
                              title="Unpin"
                            >
                              <PinOff size={10} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* New Document Button or Create Group Button */}
                <div className="flex-1 flex flex-col">
                  <div className="space-y-[1px] mb-2">
                    {selectedDocIds.length > 1 ? (
                      <div
                        data-sidebar-item
                        onClick={createGroup}
                        className="group relative flex items-center justify-between px-3 py-[6px] rounded-md cursor-pointer transition-colors text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="text-base flex-shrink-0 leading-none select-none flex items-center justify-center w-5 h-5">
                            <Folder size={16} className="text-[var(--color-icon-muted)]" />
                          </div>
                          <span className="text-[14px] truncate select-none font-medium text-[var(--color-text-primary)]">
                            Group {selectedDocIds.length} items
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        data-sidebar-item
                        onClick={createNewDoc}
                        className="group relative flex items-center justify-between px-3 py-[6px] rounded-md cursor-pointer transition-colors text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="text-base flex-shrink-0 leading-none select-none flex items-center justify-center w-5 h-5">
                            <Plus size={16} className="text-[var(--color-icon-muted)]" />
                          </div>
                          <span className="text-[14px] truncate select-none text-[var(--color-icon-muted)] group-hover:text-[var(--color-text-primary)] transition-colors">
                            New Document
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Document Groups */}
                  <div className="space-y-[2px] mb-2">
                    {groups.map((group) => {
                      const groupDocs = regularDocs.filter((d) => d.groupId === group.id);
                      return (
                        <div
                          key={group.id}
                          className="flex flex-col relative"
                          onDragOver={(e) => handleSidebarDragOver(e, group.id, 'group')}
                          onDrop={(e) => handleDropOnGroup(e, group.id)}
                        >
                          {dragTarget?.id === group.id && dragTarget?.type === 'group' && dragTarget?.position === 'before' && (
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full z-10 pointer-events-none" />
                          )}
                          {dragTarget?.id === group.id && dragTarget?.type === 'group' && dragTarget?.position === 'after' && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full z-10 pointer-events-none" />
                          )}
                          <div
                            className="group relative flex items-center justify-between px-2 py-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-grab active:cursor-grabbing"
                            style={{ backgroundColor: group.color ? group.color + '10' : undefined }}
                            draggable
                            data-sidebar-item
                            onDragStart={(e) => {
                              // Prevent input from blocking the drag
                              if (e.target.tagName === 'INPUT') {
                                e.preventDefault();
                                return;
                              }
                              handleDragStart(e, 'group', group.id);
                            }}
                            onDragEnd={handleDragEnd}
                            onDragLeave={handleDragLeave}
                          >
                            <div
                              className="flex items-center gap-1.5 flex-1 cursor-pointer overflow-hidden"
                              onClick={() => updateGroup(group.id, { isCollapsed: !group.isCollapsed })}
                            >
                              <button 
                                className="hover:opacity-80 transition-opacity"
                                style={{ color: group.color || 'var(--color-icon-muted)' }}
                              >
                                {group.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                              </button>
                              <div
                                className="flex-shrink-0 cursor-pointer transition-transform hover:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const FOLDER_COLORS = ['#9ca3af', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
                                  const nextColor = FOLDER_COLORS[(FOLDER_COLORS.indexOf(group.color) + 1) % FOLDER_COLORS.length] || FOLDER_COLORS[0];
                                  updateGroup(group.id, { color: nextColor });
                                }}
                                title="Change folder color"
                              >
                                <Folder size={14} color={group.color} fill={group.color + '40'} />
                              </div>
                              {editingGroupId === group.id ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={group.name}
                                  onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  draggable={false}
                                  onDragStart={(e) => e.stopPropagation()}
                                  onBlur={() => setEditingGroupId(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setEditingGroupId(null);
                                  }}
                                  className="bg-transparent border-none outline-none text-[13px] font-medium w-full text-[var(--color-text-primary)] truncate"
                                />
                              ) : (
                                <span
                                  className="text-[13px] font-medium w-full text-[var(--color-text-primary)] truncate select-none"
                                >
                                  {group.name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); createNewDoc(e, group.id); }}
                                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded"
                                title="New doc in folder"
                              >
                                <Plus size={13} />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setGroupMenuOpen(groupMenuOpen === group.id ? null : group.id); }}
                                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded"
                                  title="More options"
                                >
                                  <MoreHorizontal size={13} />
                                </button>
                                {groupMenuOpen === group.id && (
                                  <>
                                    <div className="fixed inset-0 z-[59]" onClick={(e) => { e.stopPropagation(); setGroupMenuOpen(null); }} />
                                    <div className="absolute right-0 top-full mt-1 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl py-1 z-[60] w-44 animate-in fade-in zoom-in-95 duration-100">
                                      <button
                                        className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingGroupId(group.id);
                                          setGroupMenuOpen(null);
                                        }}
                                      >
                                        <Pencil size={14} /> Rename
                                      </button>
                                      <div className="h-px bg-[var(--color-border-primary)] my-1" />
                                      <button
                                        className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-red-500 hover:bg-[var(--color-bg-hover)] transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setGroupMenuOpen(null);
                                          deleteGroup(e, group.id);
                                        }}
                                      >
                                        <FolderMinus size={14} /> Ungroup
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Docs mapping inside this group */}
                          {!group.isCollapsed && groupDocs.length > 0 && (
                            <div className="pl-4 pr-1 mt-0.5 space-y-[1px]">
                              {groupDocs.map(renderDocItem)}
                            </div>
                          )}

                          {/* Empty state for group */}
                          {!group.isCollapsed && groupDocs.length === 0 && (
                            <div className="pl-8 py-2 text-[12px] text-[var(--color-text-faint)] italic select-none">
                              Empty
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Ungrouped Documents */}
                  <div className="space-y-[1px]">
                    {ungroupedDocs.map(renderDocItem)}
                  </div>

                  <div className="h-24 w-full flex-shrink-0" data-sidebar-empty-zone onDragOver={handleSidebarDragOver} onDrop={handleDropOnSidebarRoot}></div>
                </div>
              </>
            )}
          </div>

          {/* Cloud Sync Toggle */}
          <div className="absolute bottom-4 left-4 z-40">
            <button
              onClick={() => user ? setUserMenuOpen(!userMenuOpen) : setAuthModal('login')}
              className="p-1.5 text-[var(--color-icon-muted)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
              title={user ? "Cloud Sync Active" : "Enable Cloud Sync"}
            >
              {user ? <Cloud size={16} className={userMenuOpen ? "text-[var(--color-text-primary)]" : "text-[var(--color-icon-muted)]"} /> : <CloudOff size={16} className={authModal ? "text-[var(--color-text-primary)]" : "text-[var(--color-icon-muted)]"} />}
            </button>

            {userMenuOpen && user && (
              <>
                <div className="fixed inset-0 z-[59]" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute left-0 bottom-full mb-1 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl py-2 z-[60] min-w-[180px] animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 mb-1 border-b border-[var(--color-border-primary)]">
                    <p className="text-[11px] font-semibold text-[var(--color-text-faint)] uppercase tracking-wider mb-0.5">Signed in as</p>
                    <p className="text-[13px] text-[var(--color-text-primary)] truncate" title={user.email}>{user.email}</p>
                  </div>
                  <button
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 text-[13px] text-red-500 hover:bg-black/5 transition-colors"
                    onClick={() => {
                      handleLogout();
                      setUserMenuOpen(false);
                    }}
                  >
                    <LogOut size={14} /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-full ${lockModal ? 'overflow-hidden' : 'overflow-y-auto'} relative transition-all duration-300 ease-[cubic-bezier(0.2, 0.8, 0.2, 1)] ${isSidebarOpen ? "ml-64 print:ml-0" : "ml-0"
          }

                `}
        onClick={() => {
          if (isSidebarPeeking && !isSidebarOpen) {
            setIsSidebarPeeking(false);
          }
        }}
      >
        {lockModal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-12 z-30 bg-[var(--color-bg-primary)]">
            <div className="w-full max-w-xs flex flex-col items-center">
              <Lock size={24} className="text-[var(--color-text-faint)] mb-4" />
              <p className="text-[15px] text-[var(--color-text-muted)] text-center mb-1">
                {lockModal.mode === 'create' ? 'Create a passcode' : 'Locked Document'}
              </p>
              <p className="text-[12px] text-[var(--color-text-faint)] text-center mb-8">
                {lockModal.mode === 'create'
                  ? 'This will be used for all locked documents'
                  : 'Enter passcode to continue'}
              </p>
              <div className="relative flex justify-center gap-4 mb-8">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all pointer-events-none ${passcodeInput.length > i
                      ? 'bg-[var(--color-text-primary)] scale-110'
                      : 'bg-[var(--color-border-primary)]'
                      }`}
                  />
                ))}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  autoFocus
                  value={passcodeInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPasscodeInput(val);
                    if (val.length === 4) {
                      setTimeout(() => handlePasscodeSubmit(val), 150);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
              </div>
              <button
                onClick={() => {
                  setLockModal(null);
                  setPasscodeInput('');
                  // Reload active doc to restore editor content
                  const doc = docsRef.current.find(d => d.id === activeDocId);
                  if (doc && editorRef.current && titleRef.current) {
                    titleRef.current.innerText = doc.title;
                    editorRef.current.innerHTML = doc.content;
                  }
                }}
                className="text-[12px] text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <main className="w-full max-w-3xl mx-auto px-12 pt-24 pb-32 print:pt-0 print:pb-0 flex-grow bg-[var(--color-bg-primary)]">
          {/* Print Logo */}
          <div className="hidden print:flex mb-6 items-center gap-2">
            <img src="/faviconlight.png" alt="Logo" className="w-5 h-5 object-contain" />
            <span className="font-semibold text-[13px] text-[var(--color-text-muted)]">usewords.app</span>
          </div>
          {" "}
          {/* Title Field / Header */}
          <div className={`flex items-start gap-3 group mb-8 print:mb-4 ${!activeDoc.title && !activeDoc.emoji ? 'print:hidden' : ''}`}>
            <div className={`relative ${!activeDoc.emoji ? 'print:hidden' : ''}`} ref={emojiPickerRef}>
              <button
                className="w-12 h-12 flex items-center justify-center -ml-2 hover:bg-[var(--color-bg-hover)] rounded-md transition-colors select-none cursor-pointer text-3xl"
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              >
                {" "}
                {activeDoc.emoji ? (
                  <span
                    key={activeDoc.emoji}
                    className="animate-in zoom-in spin-in-12 duration-300 block leading-none print:translate-y-1"
                  >
                    {" "}
                    {activeDoc.emoji}
                  </span>
                ) : (
                  <FileText
                    size={32}
                    className="text-[var(--color-icon-muted)] group-hover:text-[var(--color-text-muted)] transition-colors print:hidden"
                  />
                )}
              </button>{" "}
              {isEmojiPickerOpen && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-xl rounded-xl z-50 w-64 grid grid-cols-6 gap-1 animate-in fade-in zoom-in-95 duration-100">
                  {" "}
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      className="text-2xl p-2 hover:bg-[var(--color-bg-hover)] rounded-lg flex items-center justify-center transition-colors"
                      onClick={() => {
                        setDocs((prev) =>
                          prev.map((d) =>
                            d.id === activeDocId
                              ? {
                                ...d,
                                emoji,
                                hasCustomEmoji: true,
                              }
                              : d,
                          ),
                        );
                        setIsEmojiPickerOpen(false);
                      }}
                    >
                      {" "}
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <h1
              ref={titleRef}
              className="flex-1 title-input text-4xl font-bold outline-none w-full break-words tracking-tight mt-1"
              contentEditable
              suppressContentEditableWarning
              spellCheck={true}
              autoCapitalize="off"
              autoCorrect="on"
              onInput={handleTitleInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  editorRef.current.focus();
                }
              }}
            ></h1>
          </div>{" "}
          {/* Body Field */}
          <div
            ref={editorRef}
            className="editor-content w-full"
            contentEditable
            suppressContentEditableWarning
            spellCheck={true}
            autoCapitalize="off"
            autoCorrect="on"
            onInput={handleEditorInput}
            onKeyDown={handleKeyDown}
            onMouseDown={handleEditorMouseDown}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={(e) => {
              setSlashState((prev) => ({
                ...prev,
                isOpen: false,
              }));
              // Hide popover if clicking outside of a link
              if (e.target.tagName !== "A") {
                setLinkPopoverState(prev => prev.show ? { ...prev, show: false } : prev);
              }
            }}
          ></div>
        </main>
      </div>{" "}
      {/* Floating Formatting Toolbar */}
      {linkPopoverState.show && (
        <div
          className="fixed z-40 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-lg rounded-md px-3 py-2 flex items-center gap-2 animate-in fade-in zoom-in duration-100"
          style={{
            top: `${linkPopoverState.y}px`,
            left: `${linkPopoverState.x}px`,
            transform: "translate(-50%, 0)",
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {linkPopoverState.url && (() => {
            try {
              const urlObj = new URL(linkPopoverState.url);
              return (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`}
                  alt=""
                  className="w-4 h-4 rounded-sm"
                  onError={(e) => e.target.style.display = 'none'}
                />
              );
            } catch (e) { return null; }
          })()}
          <a
            href={linkPopoverState.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-accent)] hover:underline truncate max-w-[200px]"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey) return; // Let default new tab behavior happen
              e.preventDefault();
              window.open(linkPopoverState.url, "_blank");
            }}
          >
            {linkPopoverState.url}
          </a>
        </div>
      )}
      {toolbarState.show && (
        <div
          className="fixed z-40 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-lg rounded-md px-1 py-1 flex items-center gap-1 animate-in fade-in zoom-in duration-100"
          style={{
            top: `${toolbarState.y}px`,
            left: `${toolbarState.x}px`,
            transform: "translate(-50%, -100%)",
          }}
          onMouseDown={(e) => {
            if (!e.target.closest('input')) e.preventDefault();
          }}
        >
          {toolbarState.showLinkInput ? (
            <div className="flex items-center gap-2 px-2 py-1">
              <input
                autoFocus
                type="text"
                value={toolbarState.linkUrl}
                onChange={(e) => setToolbarState(p => ({ ...p, linkUrl: e.target.value }))}
                placeholder="Paste or type a link..."
                className="bg-transparent text-sm text-[var(--color-text-primary)] outline-none min-w-[200px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (toolbarState.savedRange) {
                      const sel = window.getSelection();
                      sel.removeAllRanges();
                      sel.addRange(toolbarState.savedRange);
                      let url = toolbarState.linkUrl;
                      if (url && !url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
                      if (url) {
                        document.execCommand('createLink', false, url);
                        syncContentToState();
                      }
                      setToolbarState(p => ({ ...p, show: false, showLinkInput: false }));
                    }
                  } else if (e.key === 'Escape') {
                    setToolbarState(p => ({ ...p, show: false, showLinkInput: false }));
                  }
                }}
              />
            </div>
          ) : (
            <>
              <button
                onClick={(e) => formatText(e, "bold")}
                className="p-1.5 text-[var(--color-icon-muted)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                title="Bold"
              >
                <Bold size={15} strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => formatText(e, "italic")}
                className="p-1.5 text-[var(--color-icon-muted)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                title="Italic"
              >
                <Italic size={15} strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => formatText(e, "strikeThrough")}
                className="p-1.5 text-[var(--color-icon-muted)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                title="Strikethrough"
              >
                <Strikethrough size={15} strokeWidth={2.5} />
              </button>
              {toolbarState.isLinkActive ? (
                <button
                  onClick={(e) => {
                    document.execCommand('unlink', false, null);
                    syncContentToState();
                    setToolbarState(p => ({ ...p, show: false, showLinkInput: false, isLinkActive: false }));
                  }}
                  className="p-1.5 text-[var(--color-icon-muted)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                  title="Unlink"
                >
                  <Unlink size={15} strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    setToolbarState(p => ({ ...p, showLinkInput: true }));
                  }}
                  className="p-1.5 text-[var(--color-icon-muted)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                  title="Insert Link"
                >
                  <Link size={15} strokeWidth={2.5} />
                </button>
              )}
              <div className="w-px h-4 bg-gray-200 mx-1"></div>
              <button
                onClick={(e) => {
                  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const targetColor = isDark ? '#716215' : '#fef08a';
                  const currentColor = document.queryCommandValue('backColor');

                  const isHighlighted = currentColor && (
                    currentColor.replace(/\s+/g, '').toLowerCase() === '#fef08a' ||
                    currentColor.replace(/\s+/g, '').toLowerCase() === 'rgb(254,240,138)' ||
                    currentColor.replace(/\s+/g, '').toLowerCase() === 'rgba(254,240,138,1)' ||
                    currentColor.replace(/\s+/g, '').toLowerCase() === '#716215' ||
                    currentColor.replace(/\s+/g, '').toLowerCase() === 'rgb(113,98,21)' ||
                    currentColor.replace(/\s+/g, '').toLowerCase() === 'rgba(113,98,21,1)'
                  );

                  formatText(e, "backColor", isHighlighted ? "transparent" : targetColor);
                }}
                className="p-1.5 text-[var(--color-icon-muted)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                title="Highlight"
              >
                <Highlighter size={15} strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>
      )}
      {/* Unified Slash Command Menu Popover */}
      {slashState.isOpen && filteredCommands.length > 0 && (
        <div
          ref={slashMenuRef}
          className="fixed z-50 bg-[var(--color-bg-primary)] shadow-xl rounded-lg border border-[var(--color-border-primary)] w-72 flex flex-col transition-all duration-75 ease-out transform overflow-hidden"
          style={{
            top: `${slashState.y + 24}px`,
            left: `${slashState.x}px`,
            transform: `translateX(min(0px, calc(100vw - ${slashState.x}px - 300px)))`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {" "}
          <div className="px-3 py-2 text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-primary)]">
            {" "}
            Basic Blocks{" "}
          </div>{" "}
          <div className="py-1 max-h-72 overflow-y-auto no-scrollbar">
            {" "}
            {filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isActive = index === slashState.activeIndex;

              return (
                <button
                  key={cmd.id}
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${isActive ? "bg-[var(--color-bg-hover)]" : "hover:bg-black/[0.02]"
                    }

                            `}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() =>
                    setSlashState((prev) => ({
                      ...prev,
                      activeIndex: index,
                    }))
                  }
                >
                  {" "}
                  <div
                    className={`p-1.5 rounded-md shadow-sm border ${isActive
                      ? "bg-[var(--color-bg-primary)] border-[var(--color-border-primary)]"
                      : "bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)]"
                      }

                          `}
                  >
                    {" "}
                    <Icon
                      size={16}
                      className={isActive ? "text-[var(--color-text-primary)]" : "text-[var(--color-icon-muted)]"}
                    />{" "}
                  </div>{" "}
                  <div className="flex flex-col">
                    {" "}
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {" "}
                      {cmd.title}
                    </span>{" "}
                    <span className="text-xs text-[var(--color-text-faint)] truncate">
                      {" "}
                      {cmd.description}
                    </span>{" "}
                  </div>{" "}
                </button>
              );
            })}
          </div>{" "}
        </div>
      )}
      {/* Context Menu for Documents */}
      {contextMenu && (
        <div
          className="fixed z-[60] bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-xl rounded-lg py-1 w-44 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x + 4}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            onClick={(e) => { togglePinDoc(e, contextMenu.docId); setContextMenu(null); }}
          >
            {docs.find(d => d.id === contextMenu.docId)?.isPinned ? <><PinOff size={14} /> Unpin</> : <><Pin size={14} /> Pin</>}
          </button>
          <button
            className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            onClick={() => toggleLockDoc(contextMenu.docId)}
          >
            {docs.find(d => d.id === contextMenu.docId)?.isLocked ? <><Unlock size={14} /> Unlock</> : <><Lock size={14} /> Lock</>}
          </button>
          <div className="h-px bg-[var(--color-border-primary)] my-1" />
          <button
            className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-red-500 hover:bg-[var(--color-bg-hover)] transition-colors"
            onClick={(e) => { deleteDoc(e, contextMenu.docId); setContextMenu(null); }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
      {/* Click-away overlay for context menu */}
      {contextMenu && (
        <div className="fixed inset-0 z-[59]" onClick={() => setContextMenu(null)} />
      )}

      {/* Auth Modal */}
      {authModal && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity" onClick={() => setAuthModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-bg-primary)] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 w-full max-w-[320px] z-[101] border border-[var(--color-border-primary)] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Sync with Cloud
              </h2>
              <button onClick={() => { setAuthModal(false); setAuthError(''); setAuthPassword(''); }} className="text-[var(--color-icon-muted)] hover:bg-[var(--color-bg-hover)] rounded-md p-1 transition-colors">
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-[var(--color-text-muted)] mb-6 text-center">
              Back up your documents and access them from anywhere.
            </p>

            {authError && authModal !== 'email' && (
              <p className="text-red-500 text-xs text-center mb-4">{authError}</p>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] py-2.5 px-4 rounded-lg mb-4 hover:opacity-90 transition-opacity shadow-sm font-medium text-sm"
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>
              Continue with Google
            </button>

            {authModal === 'email' ? (
              <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(); }} className="space-y-3 animate-in fade-in duration-200">
                <input
                  type="email"
                  placeholder="Email address"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-text-primary)] transition-colors"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-text-primary)] transition-colors"
                  required
                />
                {authError && <p className="text-red-500 text-xs text-center">{authError}</p>}
                <button
                  type="submit"
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  Continue
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAuthModal('email')}
                className="w-full bg-transparent border border-[var(--color-border-primary)] text-[var(--color-text-primary)] py-2.5 px-4 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors shadow-sm font-medium text-sm"
              >
                Continue with Email
              </button>
            )}

          </div>
        </>
      )}

      {/* Sync Suggestion Popup */}
      {showSyncSuggestion && (
        <div className="fixed bottom-6 right-6 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-2xl rounded-xl p-5 w-80 z-[90] animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Cloud size={16} className="text-[var(--color-text-primary)]" /> Back up your data
            </h3>
            <button
              onClick={() => {
                setShowSyncSuggestion(false);
                localStorage.setItem('words_dismissed_sync', 'true');
              }}
              className="text-[var(--color-icon-muted)] hover:bg-[var(--color-bg-hover)] p-1 rounded-md"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-4 leading-relaxed">
            You've created a few documents! Consider enabling Cloud Sync so you don't lose your work.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setShowSyncSuggestion(false);
                setAuthModal('login');
              }}
              className="w-full py-2 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
            >
              Enable Sync
            </button>
            <button
              onClick={() => {
                setShowSyncSuggestion(false);
                localStorage.setItem('words_dismissed_sync', 'true');
              }}
              className="w-full py-2 bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg text-sm font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
