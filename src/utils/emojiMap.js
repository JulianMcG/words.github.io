export const EMOJIS = [
  "📄", "📝", "📓", "📚", "📌", "💡", "🧠", "💭", "🚀", "✨",
  "⭐️", "🔥", "🎯", "🎨", "🎬", "🎧", "☕️", "🍎", "🌍", "🏠",
  "💻", "🎮", "🌈", "⚡️", "✅", "📋", "☑️", "📔", "📖", "💼",
  "🤝", "📊", "📈", "📽️", "🏢", "📧", "📥", "📁", "👤", "🌱"
];

const EMOJI_DICTIONARY = {
  // Productivity & Work
  todo: "📝", task: "✅", tasks: "✅", plan: "📋", checklist: "☑️", goal: "🎯",
  note: "📓", notes: "📓", journal: "📔", diary: "📖", log: "📋",
  idea: "💡", ideas: "💡", brain: "🧠", thought: "💭", draft: "📄",
  work: "💼", meeting: "🤝", project: "📊", report: "📈",
  presentation: "📽️", office: "🏢", email: "📧", inbox: "📥", folder: "📁",
  schedule: "📅", calendar: "🗓️", deadline: "⏰", productivity: "🚀",
  summary: "📑", overview: "📖", documentation: "📄", docs: "📄",

  // Personal, People & Life
  home: "🏠", personal: "👤", life: "🌱", family: "👨‍👩‍👧‍👦", friend: "👋",
  people: "👥", person: "🧑", man: "👨", woman: "👩", baby: "👶",
  kid: "🧒", boy: "👦", girl: "👧", adult: "🧑", elder: "🧓",
  wedding: "💒", marriage: "💍", relationship: "❤️", dating: "🌹",
  party: "🎉", birthday: "🎂", gift: "🎁", celebrate: "🎊", event: "🎈",

  // Food & Drink
  food: "🍎", recipe: "🍳", cook: "👨‍🍳", meal: "🍽️", diet: "🥗",
  grocery: "🛒", breakfast: "🥞", lunch: "🥪", dinner: "🍝", snack: "🥨",
  coffee: "☕", cafe: "☕", tea: "🍵", drink: "🍹", water: "💧",
  beer: "🍺", wine: "🍷", cocktail: "🍸", fruit: "🍓", veg: "🥕",
  meat: "🥩", chicken: "🍗", soup: "🍲", noodle: "🍜", rice: "🍚",
  sushi: "🍣", seafood: "🦪", pizza: "🍕", burger: "🍔", fries: "🍟",
  dessert: "🍰", sweet: "🍬", cake: "🎂", cookie: "🍪", chocolate: "🍫",

  // Travel & Geography
  travel: "✈️", trip: "🚗", vacation: "🌴", flight: "🛫", itinerary: "🗺️",
  car: "🚗", auto: "🚙", bus: "🚌", train: "🚆", subway: "🚇",
  bicycle: "🚲", bike: "🚲", motorcycle: "🏍️", boat: "⛵", ship: "🚢",
  ticket: "🎫", passport: "🛂", luggage: "🧳", map: "🗺️", globe: "🌍",
  city: "🏙️", town: "🏘️", village: "🏡", country: "🏞️", state: "🇺🇸",

  // Economy, Finance & Business
  money: "💰", finance: "📈", budget: "💵", expense: "💸", tax: "🧾",
  invoice: "🧾", bill: "💳", pay: "💳", salary: "💰", invest: "💹",
  stock: "📉", crypto: "🪙", bitcoin: "₿", client: "🤝", pitch: "📽️",
  strategy: "♟️", startup: "🚀", business: "💼", shop: "🛍️",
  store: "🏬", buy: "🛒", sell: "📈", market: "🏪", marketing: "📢",
  sales: "💸", economy: "📊", bank: "🏦", cash: "💰", card: "💳",

  // Health, Fitness & Medical
  health: "🏥", workout: "🏋️", gym: "💪", fitness: "🏃", exercise: "🤸",
  run: "👟", jog: "👟", cardio: "🏃‍♀️", lift: "🏋️", yoga: "🧘",
  stretch: "🧘", meditate: "🧘", swim: "🏊", sport: "🏅",
  pill: "💊", medicine: "💊", hospital: "🏥", nurse: "🧑‍⚕️", syringe: "💉",
  virus: "🦠", sick: "🤒", ill: "🤒", fever: "🌡️", injury: "🤕",
  doctor: "👨‍⚕️", dentist: "🦷", therapy: "🛋️", mental: "🧠", wellness: "💆",

  // Tech, Coding & Engineering
  code: "💻", dev: "👨‍💻", programming: "🧑‍💻", bug: "🐛", feature: "✨",
  app: "📱", software: "💿", web: "🌐", tech: "🔧", database: "🗄️",
  sql: "🗄️", api: "🔌", server: "🖥️", system: "⚙️", linux: "🐧",
  python: "🐍", java: "☕", react: "⚛️", javascript: "📜", aws: "☁️",
  docker: "🐋", git: "🐙", github: "🐙", release: "🚀", deploy: "🚢",
  frontend: "🎨", backend: "⚙️", fullstack: "🥞", html: "🌐", css: "💅",
  typescript: "📘", node: "🟩", cloud: "☁️", architecture: "🏛️", logic: "🧠",
  algorithm: "🧮", network: "🌐", security: "🔒", password: "🔑", auth: "🛡️",
  hardware: "🔩", cpu: "📠", gpu: "🖥️", chip: "💽", internet: "📡",

  // Art, Design & Creativity
  design: "🎨", art: "🖌️", sketch: "✏️", draw: "🖍️", paint: "🎨",
  color: "🌈", ui: "✨", ux: "✨", photo: "📸", shoot: "📸",
  typography: "🔤", font: "🔤", typeface: "🔤", layout: "📏", grid: "🔲",
  logo: "📛", branding: "✨", brand: "✨", palette: "🎨", moodboard: "📌",
  illustration: "🖌️", animation: "🎞️", motion: "🎬", edit: "✂️", cut: "✂️",
  gallery: "🖼️", frame: "🖼️", print: "🖨️", poster: "📜",

  // Entertainment, Media & Fun
  game: "🎮", play: "🎲", xbox: "🎮", playstation: "🎮", nintendo: "🍄",
  mario: "🍄", zelda: "🗡️", pokemon: "🐉", rpg: "🎲", mmo: "🌍",
  indie: "👾", boardgame: "♟️", puzzle: "🧩",
  movie: "🍿", film: "🎬", cinema: "🎞️", video: "🎥", tv: "📺",
  show: "📺", netflix: "🍿", anime: "🍥", manga: "📖", comic: "🦸",
  youtube: "▶️", twitch: "🟪", stream: "🎙️", podcast: "🎙️",
  music: "🎵", song: "🎶", audio: "🎧", band: "🎸", guitar: "🎸",
  piano: "🎹", drums: "🥁", mix: "🎛️", master: "🎛️", radio: "📻",

  // Writing, Content & Literature
  write: "✍️", blog: "📝", story: "📚", book: "📖", poem: "✒️",
  novel: "📕", author: "✍️", essay: "📝", script: "📜", publication: "📰",
  news: "🗞️", article: "📄", copy: "📝", reading: "📖", literature: "📚",

  // Science & Education
  science: "🔬", math: "➗", physics: "⚛️", space: "🚀", chemistry: "🧪",
  biology: "🦠", cell: "🦠", dna: "🧬", atom: "⚛️", planet: "🪐",
  star: "⭐", galaxy: "🌌", moon: "🌙", comet: "☄️", astronomy: "🔭",
  gravity: "🍎", energy: "⚡", lab: "🧪", school: "🏫", class: "🎓",
  study: "📚", learn: "🧠", college: "🎓", exam: "📝", test: "📝",
  thesis: "📜", research: "🔬", paper: "📄", assignment: "📋", homework: "📚",
  lecture: "👩‍🏫", scholar: "🧑‍🎓", university: "🏛️", teacher: "🧑‍🏫",

  // Nature & Environment
  tree: "🌳", animal: "🐾", dog: "🐶", cat: "🐱", pet: "🐕",
  rock: "🪨", stone: "🪨", earth: "🌍", weather: "☀️", cloud: "☁️",
  rain: "🌧️", beach: "🏖️", ocean: "🌊", sea: "🌊", sun: "☀️",
  tide: "🌊", wave: "🌊", coral: "🪸", reef: "🪸", mountain: "⛰️",
  hike: "🥾", camp: "⛺", tent: "⛺", forest: "🌲", park: "🏞️",
  snow: "❄️", winter: "⛄", summer: "🌞", dirt: "🌱", soil: "🌱",
  fossil: "🦴", volcano: "🌋", earthquake: "💥", fire: "🔥", wind: "💨",
  leaf: "🍃", flower: "🌸", bug: "🐞", insect: "🐜", bird: "🐦",

  // Objects, Tools & Misc
  stuff: "📦", thing: "📦", item: "📦", tool: "🔧", gear: "⚙️",
  box: "📦", mail: "✉️", letter: "📩", package: "📦", key: "🔑",
  lock: "🔒", unlock: "🔓", phone: "📱", screen: "🖥️", watch: "⌚",
  clock: "🕒", time: "⏳", calendar: "📅", bag: "🎒", shoe: "👟",
  shirt: "👕", pants: "👖", dress: "👗", glasses: "👓", hat: "🧢",

  // Emotions
  happy: "😄", sad: "😢", angry: "😠", love: "❤️", hate: "💔",
  surprise: "😲", fear: "😨", laugh: "😂", cry: "😭", smile: "🙂",
  mood: "🎭", feeling: "💞",
};

export const getEmojiForTitle = (title) => {
  if (!title) return null;
  const t = title.toLowerCase();
  
  // Clean punctuation and get bare words
  const words = t.match(/\b\w+\b/g) || [];

  // Iterate backwards to prioritize trailing head nouns
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    
    if (Object.prototype.hasOwnProperty.call(EMOJI_DICTIONARY, word)) 
      return EMOJI_DICTIONARY[word];
    
    // Plural rules fallback (s, es)
    if (word.endsWith("s") && Object.prototype.hasOwnProperty.call(EMOJI_DICTIONARY, word.slice(0, -1)))
      return EMOJI_DICTIONARY[word.slice(0, -1)];
    if (word.endsWith("es") && Object.prototype.hasOwnProperty.call(EMOJI_DICTIONARY, word.slice(0, -2)))
      return EMOJI_DICTIONARY[word.slice(0, -2)];
      
    // Gerund rules fallback (ing)
    if (word.endsWith("ing") && Object.prototype.hasOwnProperty.call(EMOJI_DICTIONARY, word.slice(0, -3)))
      return EMOJI_DICTIONARY[word.slice(0, -3)];
  }

  return null;
};
