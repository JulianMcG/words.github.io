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
  FolderOpen,
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
  LogOut,
  Copy,
  Paintbrush,
  AlignLeft,
  AlignCenter,
  AlignRight,
  EyeOff,
  ChevronLeft,
  ArrowLeft,
  Maximize2,
  Minimize2,
  AlignJustify,
  Undo2
} from "lucide-react";
import { auth, db, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, doc, setDoc, getDoc, onSnapshot } from "./firebase";
import { motion, AnimatePresence } from "framer-motion";
import GradualBlur from "./components/GradualBlur";
import { Sparkles } from "lucide-react";
import BuddyIcon from "./components/BuddyIcon";
import BuddyWidget from "./components/BuddyWidget";
import { EMOJIS, getEmojiForTitle } from "./utils/emojiMap";


// Define the separated commands
const COMMANDS = [
  {
    id: "buddy",
    title: "Ask Buddy",
    description: "Edit, generate, or brainstorm.",
    icon: BuddyIcon,
    type: "buddy",
  },
  {
    id: "text",
    title: "Text",
    description: "Just start writing with plain text.",
    icon: Type,
    type: "formatBlock",
    tag: "P",
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
    id: "checklist",
    title: "To-do List",
    description: "Track tasks with a checklist.",
    icon: CheckSquare,
    type: "checklist",
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

const ROOT_NATIVE_BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "BLOCKQUOTE", "UL", "OL"]);
const DROP_CONTENT_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "META",
  "LINK",
  "TITLE",
  "NOSCRIPT",
  "TEMPLATE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "SVG",
  "CANVAS",
  "FORM",
  "INPUT",
  "BUTTON",
  "TEXTAREA",
  "SELECT",
  "OPTION",
]);
const HEADING_TAG_MAP = {
  H1: "h1",
  H2: "h2",
  H3: "h3",
  H4: "h3",
  H5: "h3",
  H6: "h3",
};
const NATIVE_HIGHLIGHT_COLORS = new Map([
  ["#fef08a", "#fef08a"],
  ["rgb(254,240,138)", "#fef08a"],
  ["#fecaca", "#fecaca"],
  ["rgb(254,202,202)", "#fecaca"],
  ["#bbf7d0", "#bbf7d0"],
  ["rgb(187,247,208)", "#bbf7d0"],
  ["#716215", "#716215"],
  ["rgb(113,98,21)", "#716215"],
  ["#7f1d1d", "#7f1d1d"],
  ["rgb(127,29,29)", "#7f1d1d"],
  ["#14532d", "#14532d"],
  ["rgb(20,83,45)", "#14532d"],
  ["transparent", "transparent"],
  ["rgba(0,0,0,0)", "transparent"],
]);

const hasMeaningfulText = (text = "") => text.replace(/\u00A0/g, " ").trim().length > 0;

const escapeHtml = (text = "") => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

const normalizeColorToken = (value = "") => value.toLowerCase().replace(/\s+/g, "");

const getNativeHighlightColor = (value = "") => {
  const token = normalizeColorToken(value);
  return NATIVE_HIGHLIGHT_COLORS.get(token) || "";
};

const sanitizeHref = (href) => {
  if (!href) return "";
  const trimmedHref = href.trim();
  if (!trimmedHref) return "";

  if (/^(mailto:|tel:)/i.test(trimmedHref)) return trimmedHref;

  try {
    const parsed = new URL(trimmedHref, window.location.origin);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmedHref;
    }
  } catch {
    return "";
  }

  return "";
};

const hasMeaningfulContent = (element) => {
  if (!element) return false;
  if (hasMeaningfulText(element.textContent || "")) return true;

  return Array.from(element.childNodes).some((child) => {
    if (child.nodeType !== Node.ELEMENT_NODE) return false;
    return ["BR", "UL", "OL"].includes(child.tagName);
  });
};

const isNativeBlockNode = (node) =>
  node?.nodeType === Node.ELEMENT_NODE && ROOT_NATIVE_BLOCK_TAGS.has(node.tagName);

const getInlineFormatting = (sourceNode, explicitTag = null) => {
  const semanticTags = [];
  const seenTags = new Set();
  const pushTag = (tag) => {
    if (tag && !seenTags.has(tag)) {
      seenTags.add(tag);
      semanticTags.push(tag);
    }
  };

  pushTag(explicitTag);

  const style = sourceNode.style;
  if (style) {
    const fontWeight = style.fontWeight?.toLowerCase() || "";
    const numericWeight = Number.parseInt(fontWeight, 10);
    if (
      (fontWeight === "bold" || fontWeight === "bolder" || (!Number.isNaN(numericWeight) && numericWeight >= 600)) &&
      explicitTag !== "strong"
    ) {
      pushTag("strong");
    }

    if (style.fontStyle?.toLowerCase() === "italic" && explicitTag !== "em") {
      pushTag("em");
    }

    const textDecoration = `${style.textDecoration || ""} ${style.textDecorationLine || ""}`.toLowerCase();
    if (textDecoration.includes("underline") && explicitTag !== "u") {
      pushTag("u");
    }
    if (textDecoration.includes("line-through") && explicitTag !== "s") {
      pushTag("s");
    }
  }

  return {
    semanticTags,
    highlightColor: getNativeHighlightColor(style?.backgroundColor || ""),
  };
};

const appendFormattedInline = (sourceNode, targetParent, explicitTag = null) => {
  const { semanticTags, highlightColor } = getInlineFormatting(sourceNode, explicitTag);

  if (!semanticTags.length && !highlightColor) {
    sanitizeNodeChildren(sourceNode, targetParent);
    return;
  }

  let outermost = null;
  let currentTarget = null;

  semanticTags.forEach((tag) => {
    const el = document.createElement(tag);
    if (!outermost) {
      outermost = el;
    } else {
      currentTarget.appendChild(el);
    }
    currentTarget = el;
  });

  if (highlightColor) {
    const span = document.createElement("span");
    span.style.backgroundColor = highlightColor;
    if (!outermost) {
      outermost = span;
    } else {
      currentTarget.appendChild(span);
    }
    currentTarget = span;
  }

  sanitizeNodeChildren(sourceNode, currentTarget);

  if (hasMeaningfulContent(outermost)) {
    targetParent.appendChild(outermost);
  }
};

const getFormattedContentTarget = (sourceNode, blockElement) => {
  const { semanticTags, highlightColor } = getInlineFormatting(sourceNode);
  let currentTarget = blockElement;

  semanticTags.forEach((tag) => {
    const el = document.createElement(tag);
    currentTarget.appendChild(el);
    currentTarget = el;
  });

  if (highlightColor) {
    const span = document.createElement("span");
    span.style.backgroundColor = highlightColor;
    currentTarget.appendChild(span);
    currentTarget = span;
  }

  return currentTarget;
};

const flattenSingleParagraphInListItem = (listItem) => {
  const meaningfulChildren = Array.from(listItem.childNodes).filter((node) => {
    if (node.nodeType === Node.TEXT_NODE) return hasMeaningfulText(node.textContent);
    return node.nodeType === Node.ELEMENT_NODE;
  });

  if (
    meaningfulChildren.length === 1 &&
    meaningfulChildren[0].nodeType === Node.ELEMENT_NODE &&
    meaningfulChildren[0].tagName === "P"
  ) {
    const paragraph = meaningfulChildren[0];
    while (paragraph.firstChild) {
      listItem.insertBefore(paragraph.firstChild, paragraph);
    }
    paragraph.remove();
  }
};

const wrapLooseInlineChildren = (container) => {
  let paragraph = null;

  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !hasMeaningfulText(node.textContent)) {
      node.remove();
      return;
    }

    if (isNativeBlockNode(node)) {
      paragraph = null;
      return;
    }

    if (!paragraph) {
      paragraph = document.createElement("p");
      container.insertBefore(paragraph, node);
    }

    paragraph.appendChild(node);
  });
};

function sanitizeListNode(sourceList, targetList) {
  Array.from(sourceList.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      if (hasMeaningfulText(child.textContent)) {
        const li = document.createElement("li");
        li.textContent = child.textContent.trim();
        targetList.appendChild(li);
      }
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const li = document.createElement("li");
    if (child.classList?.contains("checked")) {
      li.classList.add("checked");
    }
    const listItemTarget = getFormattedContentTarget(child, li);

    if (child.tagName === "LI") {
      sanitizeNodeChildren(child, listItemTarget);
    } else {
      appendSanitizedNode(child, listItemTarget);
    }

    flattenSingleParagraphInListItem(li);

    if (hasMeaningfulContent(li)) {
      targetList.appendChild(li);
    }
  });
}

function sanitizeNodeChildren(sourceParent, targetParent) {
  Array.from(sourceParent.childNodes).forEach((child) => appendSanitizedNode(child, targetParent));
}

function appendSanitizedNode(node, targetParent) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (hasMeaningfulText(node.textContent)) {
      targetParent.appendChild(document.createTextNode(node.textContent));
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const tagName = node.tagName.toUpperCase();

  if (DROP_CONTENT_TAGS.has(tagName)) return;

  if (tagName === "BR") {
    targetParent.appendChild(document.createElement("br"));
    return;
  }

  if (tagName === "A") {
    const href = sanitizeHref(node.getAttribute("href"));
    if (!href) {
      sanitizeNodeChildren(node, targetParent);
      return;
    }

    const link = document.createElement("a");
    link.setAttribute("href", href);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    sanitizeNodeChildren(node, link);

    if (hasMeaningfulContent(link)) {
      targetParent.appendChild(link);
    }
    return;
  }

  if (tagName === "B" || tagName === "STRONG") {
    appendFormattedInline(node, targetParent, "strong");
    return;
  }

  if (tagName === "I" || tagName === "EM") {
    appendFormattedInline(node, targetParent, "em");
    return;
  }

  if (tagName === "U") {
    appendFormattedInline(node, targetParent, "u");
    return;
  }

  if (tagName === "S" || tagName === "STRIKE" || tagName === "DEL") {
    appendFormattedInline(node, targetParent, "s");
    return;
  }

  if (tagName === "SPAN" || tagName === "FONT") {
    appendFormattedInline(node, targetParent);
    return;
  }

  if (HEADING_TAG_MAP[tagName]) {
    const heading = document.createElement(HEADING_TAG_MAP[tagName]);
    sanitizeNodeChildren(node, getFormattedContentTarget(node, heading));
    if (hasMeaningfulContent(heading)) {
      targetParent.appendChild(heading);
    }
    return;
  }

  if (tagName === "P") {
    const paragraph = document.createElement("p");
    sanitizeNodeChildren(node, getFormattedContentTarget(node, paragraph));
    if (hasMeaningfulContent(paragraph)) {
      targetParent.appendChild(paragraph);
    }
    return;
  }

  if (tagName === "BLOCKQUOTE") {
    const blockquote = document.createElement("blockquote");
    sanitizeNodeChildren(node, getFormattedContentTarget(node, blockquote));
    wrapLooseInlineChildren(blockquote);
    if (hasMeaningfulContent(blockquote)) {
      targetParent.appendChild(blockquote);
    }
    return;
  }

  if (tagName === "UL" || tagName === "OL") {
    const list = document.createElement(tagName.toLowerCase());
    if (tagName === "UL" && node.classList.contains("checklist")) {
      list.classList.add("checklist");
    }
    sanitizeListNode(node, list);
    if (list.querySelector("li")) {
      targetParent.appendChild(list);
    }
    return;
  }

  sanitizeNodeChildren(node, targetParent);
}

const cleanupNativeHtml = (container) => {
  Array.from(container.querySelectorAll("strong, em, u, s, a, span, p, h1, h2, h3, blockquote, li"))
    .reverse()
    .forEach((element) => {
      if (!hasMeaningfulContent(element)) {
        element.remove();
      }
    });
};

const buildPlainTextHtml = (text, { forceBlockRoots = false } = {}) => {
  const normalizedText = (text || "").replace(/\r\n?/g, "\n");

  if (!forceBlockRoots) {
    return escapeHtml(normalizedText).replace(/\n/g, "<br>");
  }

  return normalizedText
    .split("\n")
    .map((line) => (line.trim() ? `<p>${escapeHtml(line)}</p>` : "<p><br></p>"))
    .join("");
};

const createNativeHtmlPayload = (rawContent, { forceBlockRoots = false } = {}) => {
  if (typeof rawContent !== "string") {
    return { html: forceBlockRoots ? "<p><br></p>" : "", hasBlockRoot: forceBlockRoots };
  }

  let source = rawContent
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>");

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(source);
  const sourceHasBlockMarkup = /<(p|div|section|article|aside|main|nav|header|footer|center|h[1-6]|blockquote|ul|ol|li|table|thead|tbody|tfoot|tr|td|th)\b/i.test(source);

  if (!looksLikeHtml) {
    source = buildPlainTextHtml(source, { forceBlockRoots });
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(source, "text/html");
  const container = document.createElement("div");

  sanitizeNodeChildren(parsed.body, container);

  if (forceBlockRoots || sourceHasBlockMarkup) {
    wrapLooseInlineChildren(container);
  }

  cleanupNativeHtml(container);

  const html = container.innerHTML.trim();
  return {
    html: html || (forceBlockRoots ? "<p><br></p>" : ""),
    hasBlockRoot: Array.from(container.childNodes).some((node) => isNativeBlockNode(node)),
  };
};

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
        } catch (e) { }
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
      } catch (e) { }

      return { title, image, description, domain, url: displayUrl };
    } catch (fallbackError) {
      console.error("Fallback link preview fetch failed:", fallbackError);
      return null;
    }
  }
};
const AnimatedFolder = ({ isOpen, color, fill }) => {
  const backStyle = {
    transform: isOpen ? "skewX(8deg)" : "skewX(0deg)"
  };
  const frontStyle = {
    transform: isOpen ? "scaleY(0.7) skewX(-16deg)" : "scaleY(1) skewX(0deg)"
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="none" className="overflow-visible">
      {/* Back tab opaque mask */}
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v15" fill="var(--color-bg-primary)" className="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-[50%_21px]" style={backStyle} />
      {/* Back tab color overlay */}
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v15" fill={fill} className="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-[50%_21px] brightness-90" style={backStyle} />
      {/* Back tab stroke layer */}
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v15" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-[50%_21px]" style={backStyle} />

      {/* Front flap opaque mask */}
      <path d="M2 19 a2 2 0 0 0 2 2 h16 a2 2 0 0 0 2 -2 v-11 a2 2 0 0 0 -2 -2 h-16 a2 2 0 0 0 -2 2 z" fill="var(--color-bg-primary)" className="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-[50%_21px]" style={frontStyle} />
      {/* Front flap color overlay */}
      <path d="M2 19 a2 2 0 0 0 2 2 h16 a2 2 0 0 0 2 -2 v-11 a2 2 0 0 0 -2 -2 h-16 a2 2 0 0 0 -2 2 z" fill={fill} className="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-[50%_21px]" style={frontStyle} />
      {/* Front flap stroke layer */}
      <path d="M2 19 a2 2 0 0 0 2 2 h16 a2 2 0 0 0 2 -2 v-11 a2 2 0 0 0 -2 -2 h-16 a2 2 0 0 0 -2 2 z" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-[50%_21px]" style={frontStyle} />
    </svg>
  );
};

export default function App() {
  const sidebarScrollRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarPeeking, setIsSidebarPeeking] = useState(false);
  const [isSidebarScrolled, setIsSidebarScrolled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [animatingEmojiDocId, setAnimatingEmojiDocId] = useState(null);
  const [previewHoverDocId, setPreviewHoverDocId] = useState(null);
  const [previewHoverGroupId, setPreviewHoverGroupId] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const [previewPos, setPreviewPos] = useState({ top: 0, left: 0 });
  const [groupPreviewPos, setGroupPreviewPos] = useState({ top: 0, left: 0 });
  const [sidebarContextMenu, setSidebarContextMenu] = useState({ isOpen: false, x: 0, y: 0 });
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [styleAccordionOpen, setStyleAccordionOpen] = useState(false);
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
        textAlign: "left",
        hideTitle: false,
        fullWidth: false,
        lineSpacing: "1.5",
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
  const [folderPendingId, setFolderPendingId] = useState(null); // doc id currently in "hold to create folder" state
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { docId, x, y }
  const [editingDocId, setEditingDocId] = useState(null);
  const [editingDocTitle, setEditingDocTitle] = useState('');
  const [groupMenuOpen, setGroupMenuOpen] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [animatingDocId, setAnimatingDocId] = useState(null);
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
  const [sharePopupInfo, setSharePopupInfo] = useState(null);
  const [deletedDocInfo, setDeletedDocInfo] = useState(null);
  const [isAltHeld, setIsAltHeld] = useState(false);
  const [pendingShareId, setPendingShareId] = useState(() => new URLSearchParams(window.location.search).get('share'));
  const [isCloudDocsLoaded, setIsCloudDocsLoaded] = useState(false);
  const skipSyncRef = useRef(false);
  const pendingLocalSaveRef = useRef(false);
  const pointerDragRef = useRef(null); // { docId, idsToMove, clone, offsetY }
  const lastReorderRef = useRef(null); // prevents duplicate reorder state updates

  useEffect(() => {
    if (sharePopupInfo) {
      const timer = setTimeout(() => {
        setSharePopupInfo(null);
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, [sharePopupInfo]);

  useEffect(() => {
    if (deletedDocInfo) {
      const timer = setTimeout(() => {
        deletedDocInfoRef.current = null;
        setDeletedDocInfo(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [deletedDocInfo]);

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
    showColorPicker: false,
    linkUrl: "",
    savedRange: null,
  });
  const [linkPopoverState, setLinkPopoverState] = useState({
    show: false,
    url: "",
    x: 0,
    y: 0,
  });
  const [buddyState, setBuddyState] = useState({
    show: false,
    x: 0,
    y: 0,
    savedRange: null,
    selectedText: "",
    selectedHtml: "",
    isCollapsed: true,
  });
  const [isSpacingAnimating, setIsSpacingAnimating] = useState(false);

  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const slashMenuRef = useRef(null);
  const docsRef = useRef(docs);
  const deletedDocInfoRef = useRef(null);
  const isInternalEdit = useRef(false);
  const titleTimeoutRef = useRef(null);
  const prevActiveDocIdRef = useRef(activeDocId);

  const undoDeleteDoc = useCallback(() => {
    const info = deletedDocInfoRef.current;
    if (!info) return;
    setDocs(info.prevDocs);
    docsRef.current = info.prevDocs;
    setActiveDocId(info.prevActiveDocId);
    deletedDocInfoRef.current = null;
    setDeletedDocInfo(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Alt') setIsAltHeld(true);
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z' && deletedDocInfoRef.current) {
        undoDeleteDoc();
      }
    };
    const onKeyUp = (e) => { if (e.key === 'Alt') setIsAltHeld(false); };
    const onBlur = () => setIsAltHeld(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [undoDeleteDoc]);

  const filteredCommands = COMMANDS.filter(
    (cmd) =>
      (cmd.id !== "buddy" || user) &&
      (cmd.title.toLowerCase().includes(slashState.query.toLowerCase()) ||
       cmd.id.toLowerCase().includes(slashState.query.toLowerCase())),
  ).sort((a, b) => {
    const q = slashState.query.toLowerCase();
    if (q.startsWith("b")) {
      if (a.id === "ul" && b.id === "buddy") return -1;
      if (a.id === "buddy" && b.id === "ul") return 1;
    }
    return 0; // Preserve default COMMANDS ordering
  });

  // Synchronous flush: saves current editor state to docsRef + state
  const flushCurrentDoc = useCallback(() => {
    if (!editorRef.current || !titleRef.current) return;
    const currentId = prevActiveDocIdRef.current;
    const content = editorRef.current.innerHTML || "<p><br></p>";
    const title = titleRef.current.textContent || "";
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
      titleRef.current.textContent = activeDoc.title;
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

        let activeAlign = 'left';
        if (document.queryCommandState("justifyCenter")) activeAlign = 'center';
        else if (document.queryCommandState("justifyRight")) activeAlign = 'right';
        else if (document.queryCommandState("justifyFull")) activeAlign = 'justify';

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
          activeAlign,
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

  // Handle Shared Document Links
  useEffect(() => {
    if (!pendingShareId || isAuthLoading || (!isCloudDocsLoaded && user)) return;

    const cloneSharedDoc = async () => {
      try {
        const sharedSnap = await getDoc(doc(db, "shared_documents", pendingShareId));
        if (sharedSnap.exists()) {
          const data = sharedSnap.data();
          const newDocId = crypto.randomUUID();
          const newDoc = {
            id: newDocId,
            title: (data.title || "Untitled") + " (Shared Copy)",
            content: data.content,
            isPinned: false,
            emoji: data.emoji || null,
            hasCustomEmoji: data.hasCustomEmoji || false,
            groupId: null,
            isLocked: false
          };

          setDocs(prev => {
            const updated = [newDoc, ...prev];
            docsRef.current = updated;
            return updated;
          });
          setActiveDocId(newDocId);
        }
      } catch (e) {
        console.error("Failed to load or parse shared document.", e);
      }
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      setPendingShareId(null);
    };
    cloneSharedDoc();
  }, [pendingShareId, isAuthLoading, isCloudDocsLoaded, user]);

  // Firebase Auth Listener - Handles Auth State Transitions (Login/Logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsAuthLoading(false);
      if (!currentUser) setIsCloudDocsLoaded(true);
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
          { id: "1", title: "", content: "<p><br></p>", isPinned: false, emoji: null, hasCustomEmoji: false, groupId: null, textAlign: "left", hideTitle: false, fullWidth: false, lineSpacing: "1.5" }
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
          titleRef.current.textContent = docToLoad.title;
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
    if (isAuthLoading) return; // Wait for initial auth response

    if (user) {
      setShowSyncSuggestion(false);
      return;
    }

    // Suggest if they have more than 3 documents
    if (docs.length >= 4) {
      const hasDismissed = localStorage.getItem('words_dismissed_sync');
      if (!hasDismissed) {
        setShowSyncSuggestion(true);
      }
    }
  }, [docs, user, isAuthLoading]);

  // Two-way Sync with Firestore
  useEffect(() => {
    if (!user) return;

    // Subscribe to changes from the cloud.
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      // Ignore cloud snapshots if we have local pending changes that haven't been saved/acknowledged yet
      if (pendingLocalSaveRef.current) return;

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
                titleRef.current.textContent = activeDoc.title;
                editorRef.current.innerHTML = activeDoc.content;
              }
            }
          }

          // DO NOT WRITE TO LOCALSTORAGE HERE. We keep "words_docs" pure for the unauthenticated state.

          setTimeout(() => {
            skipSyncRef.current = false;
            setIsCloudDocsLoaded(true);
          }, 100);
        } else {
          setIsCloudDocsLoaded(true);
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
          setIsCloudDocsLoaded(true);
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Sync to Firebase whenever local docs/groups change
  useEffect(() => {
    if (!user || skipSyncRef.current) return;

    pendingLocalSaveRef.current = true;

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
      } finally {
        pendingLocalSaveRef.current = false;
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
              title: d.hideTitle ? d.title : (titleRef.current.textContent || d.title || ""),
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

  // Failsafe: Enforce DOM text integrity against React wiping uncontrolled nodes on CSS/parent re-renders
  useEffect(() => {
    const doc = docs.find(d => d.id === activeDocId);
    if (doc && titleRef.current && titleRef.current.textContent !== doc.title) {
      if (doc.title === undefined) return;
      titleRef.current.textContent = doc.title || "";
    }
  }, [docs, activeDocId]);

  // Dismiss sidebar peek only after cursor moves 30px past the sidebar edge
  useEffect(() => {
    if (!isSidebarPeeking || isSidebarOpen) return;
    const DISMISS_THRESHOLD = 30;
    const SIDEBAR_WIDTH = 256;
    const handleMouseMove = (e) => {
      if (e.clientX > SIDEBAR_WIDTH + DISMISS_THRESHOLD) {
        setIsSidebarPeeking(false);
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isSidebarPeeking, isSidebarOpen]);

  // Live-reorder docs during pointer drag (adopted target's groupId)
  const liveReorderDocs = (idsToMove, targetId, position) => {
    const key = `${idsToMove.join(',')}-${targetId}-${position}`;
    if (lastReorderRef.current === key) return;
    lastReorderRef.current = key;
    setDocs(prev => {
      const withoutDragged = prev.filter(d => !idsToMove.includes(d.id));
      const targetIdx = withoutDragged.findIndex(d => d.id === targetId);
      if (targetIdx === -1) return prev;
      const targetGroupId = withoutDragged[targetIdx].groupId;
      const docsToInsert = prev
        .filter(d => idsToMove.includes(d.id))
        .map(d => ({ ...d, groupId: targetGroupId }));
      const result = [...withoutDragged];
      result.splice(position === 'before' ? targetIdx : targetIdx + 1, 0, ...docsToInsert);
      docsRef.current = result;
      return result;
    });
  };

  const handleInsetDrop = (idsToMove, targetDocId) => {
    const targetDoc = docsRef.current.find(d => d.id === targetDocId);
    if (!targetDoc) return;
    let targetGroupId = targetDoc.groupId;
    let isNewGroup = false;
    if (!targetGroupId) {
      targetGroupId = Math.random().toString(36).substring(2, 9);
      isNewGroup = true;
      setGroups(prev => [{ id: targetGroupId, name: "New Group", color: "#9ca3af", isCollapsed: false }, ...prev]);
    }
    setDocs(prev => {
      let newDocs = [...prev];
      const docsToMoveIds = isNewGroup ? [...idsToMove, targetDocId] : [...idsToMove];
      docsToMoveIds.forEach(id => {
        const idx = newDocs.findIndex(d => d.id === id);
        if (idx !== -1) newDocs[idx] = { ...newDocs[idx], groupId: targetGroupId };
      });
      newDocs = newDocs.filter(d => !idsToMove.includes(d.id));
      const targetIdx = newDocs.findIndex(d => d.id === targetDocId);
      if (targetIdx !== -1) {
        const docsToInsert = prev
          .filter(d => idsToMove.includes(d.id))
          .map(d => ({ ...d, groupId: targetGroupId }));
        newDocs.splice(targetIdx + 1, 0, ...docsToInsert);
      }
      docsRef.current = newDocs;
      return newDocs;
    });
  };

  const startDocPointerDrag = (e, docId) => {
    if (e.button !== 0) return;
    if (e.target.closest('button, input, a')) return;
    const startX = e.clientX;
    const startY = e.clientY;
    let dragStarted = false;

    const tryStart = (moveE) => {
      const dx = moveE.clientX - startX;
      const dy = moveE.clientY - startY;
      if (!dragStarted && Math.sqrt(dx * dx + dy * dy) > 5) {
        dragStarted = true;
        cleanup();
        initDocDrag(docId, moveE.clientX, moveE.clientY);
      }
    };
    const cleanup = () => {
      document.removeEventListener('pointermove', tryStart);
      document.removeEventListener('pointerup', cleanup);
    };
    document.addEventListener('pointermove', tryStart);
    document.addEventListener('pointerup', cleanup);
  };

  const initDocDrag = (docId, currentX, currentY) => {
    const idsToMove = selectedDocIds.includes(docId) ? selectedDocIds : [docId];
    if (!selectedDocIds.includes(docId)) setSelectedDocIds([docId]);

    const el = document.querySelector(`[data-doc-id="${docId}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();

    // Build a floating clone that looks like the real sidebar item
    const clone = el.cloneNode(true);
    // Remove any hover/focus states that may be stale
    clone.removeAttribute('data-doc-id');
    Object.assign(clone.style, {
      position: 'fixed',
      top: rect.top + 'px',
      left: rect.left + 'px',
      width: rect.width + 'px',
      margin: '0',
      pointerEvents: 'none',
      zIndex: '9999',
      borderRadius: 'calc(0.375rem + var(--radius-bonus))',
      boxShadow: '0 8px 24px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)',
      background: 'var(--color-bg-secondary)',
      opacity: '0.78',
      backdropFilter: 'blur(2px)',
      transform: 'scale(1.015)',
      transition: 'none',
    });
    document.body.appendChild(clone);

    // Store current drag target in ref so handleUp always reads the latest value
    pointerDragRef.current = { docId, idsToMove, clone, offsetY: currentY - rect.top, currentTarget: null, folderHoverTimer: null, folderHoverTarget: null };
    lastReorderRef.current = null;
    setDraggedItem({ type: 'doc', id: docId });

    const handleMove = (moveE) => {
      if (!pointerDragRef.current) return;
      const { clone, offsetY } = pointerDragRef.current;
      clone.style.top = (moveE.clientY - offsetY) + 'px';

      // Temporarily hide clone to hit-test what's underneath
      clone.style.visibility = 'hidden';
      const elBelow = document.elementFromPoint(moveE.clientX, moveE.clientY);
      clone.style.visibility = 'visible';

      if (!elBelow) {
        pointerDragRef.current.currentTarget = null;
        setDragTarget(null);
        return;
      }

      const docEl = elBelow.closest('[data-doc-id]');
      const groupHeaderEl = !docEl && elBelow.closest('[data-group-id]');

      if (docEl) {
        const targetId = docEl.getAttribute('data-doc-id');
        if (pointerDragRef.current.idsToMove.includes(targetId)) {
          clearTimeout(pointerDragRef.current.folderHoverTimer);
          pointerDragRef.current.folderHoverTimer = null;
          pointerDragRef.current.folderHoverTarget = null;
          pointerDragRef.current.currentTarget = null;
          setFolderPendingId(null);
          setDragTarget(null);
          return;
        }
        const targetRect = docEl.getBoundingClientRect();
        const relY = moveE.clientY - targetRect.top;
        const h = targetRect.height;

        if (relY >= h * 0.28 && relY <= h * 0.72) {
          // Center zone — folder creation requires a hold
          if (pointerDragRef.current.folderHoverTarget !== targetId) {
            // Moved to a new doc center — reset timer
            clearTimeout(pointerDragRef.current.folderHoverTimer);
            pointerDragRef.current.folderHoverTarget = targetId;
            // Clear any existing inset state
            const prevTarget = pointerDragRef.current.currentTarget;
            if (prevTarget?.position !== 'inset') {
              pointerDragRef.current.currentTarget = null;
              setDragTarget(null);
            }
            setFolderPendingId(targetId);
            pointerDragRef.current.folderHoverTimer = setTimeout(() => {
              if (pointerDragRef.current?.folderHoverTarget === targetId) {
                const t = { id: targetId, position: 'inset', type: 'doc' };
                pointerDragRef.current.currentTarget = t;
                setFolderPendingId(null);
                setDragTarget(t);
              }
            }, 420);
          }
          // else: already counting down for this target, do nothing
        } else {
          // Outside center zone — clear folder hover state
          if (pointerDragRef.current.folderHoverTarget) {
            clearTimeout(pointerDragRef.current.folderHoverTimer);
            pointerDragRef.current.folderHoverTimer = null;
            pointerDragRef.current.folderHoverTarget = null;
            setFolderPendingId(null);
          }
          const position = relY < h * 0.5 ? 'before' : 'after';
          const t = { id: targetId, position, type: 'doc' };
          pointerDragRef.current.currentTarget = t;
          setDragTarget(t);
          liveReorderDocs(pointerDragRef.current.idsToMove, targetId, position);
        }
      } else if (groupHeaderEl) {
        clearTimeout(pointerDragRef.current.folderHoverTimer);
        pointerDragRef.current.folderHoverTimer = null;
        pointerDragRef.current.folderHoverTarget = null;
        setFolderPendingId(null);
        const targetGroupId = groupHeaderEl.getAttribute('data-group-id');
        const t = { id: targetGroupId, position: 'inset', type: 'group' };
        pointerDragRef.current.currentTarget = t;
        setDragTarget(t);
      } else {
        if (pointerDragRef.current.folderHoverTarget) {
          clearTimeout(pointerDragRef.current.folderHoverTimer);
          pointerDragRef.current.folderHoverTimer = null;
          pointerDragRef.current.folderHoverTarget = null;
          setFolderPendingId(null);
        }
        pointerDragRef.current.currentTarget = null;
        setDragTarget(null);
      }
    };

    const handleUp = (upE) => {
      if (!pointerDragRef.current) return;
      pointerDragRef.current.clone.remove();
      const { idsToMove, currentTarget } = pointerDragRef.current;

      // Resolve the final drop action using the ref value (always fresh)
      if (currentTarget?.position === 'inset' && currentTarget?.type === 'doc') {
        handleInsetDrop(idsToMove, currentTarget.id);
      } else if (currentTarget?.position === 'inset' && currentTarget?.type === 'group') {
        setDocs(d => {
          const newDocs = d.map(dd =>
            idsToMove.includes(dd.id) ? { ...dd, groupId: currentTarget.id } : dd
          );
          docsRef.current = newDocs;
          return newDocs;
        });
      } else if (!currentTarget) {
        // Dropped over empty sidebar space → remove from any group
        const sidebarEl = document.getElementById('sidebar-scroll-root');
        if (sidebarEl && sidebarEl.contains(upE.target)) {
          setDocs(d => {
            const newDocs = d.map(dd =>
              idsToMove.includes(dd.id) ? { ...dd, groupId: null } : dd
            );
            docsRef.current = newDocs;
            return newDocs;
          });
        }
      }

      clearTimeout(pointerDragRef.current?.folderHoverTimer);
      pointerDragRef.current = null;
      lastReorderRef.current = null;
      setFolderPendingId(null);
      setDragTarget(null);
      setDraggedItem(null);
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  };

  const handleTitleInput = () => {
    const newTitle = titleRef.current?.textContent || "";

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
            if (autoEmoji && autoEmoji !== d.emoji) {
              nextEmoji = autoEmoji;

              setAnimatingEmojiDocId(d.id);
              setTimeout(() => {
                setAnimatingEmojiDocId(prev => prev === d.id ? null : prev);
              }, 200);
            }
          }

          return { ...d, emoji: nextEmoji };
        })
      );
    }, 800);
  };

  const syncContentToState = useCallback(() => {
    if (editorRef.current) {
      // Enforce checklist inheritance on nested lists created via Tab indentation
      const nestedUls = editorRef.current.querySelectorAll('ul.checklist ul:not(.checklist)');
      nestedUls.forEach(ul => ul.classList.add('checklist'));
    }
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
                const placeholderHtml = `<span class="math-preview" contenteditable="false">${ans}</span>\u200B`;
                document.execCommand("insertHTML", false, placeholderHtml);
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
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("delete", false, null);

      // Insert placeholder map natively
      const placeholderId = `link-preview-${Date.now()}`;
      const placeholderHtml = `<div id="${placeholderId}" contenteditable="false" class="link-preview-loading"></div>`;
      document.execCommand("insertHTML", false, placeholderHtml);
      
      const spaceHtml = `\u00A0`;
      document.execCommand("insertHTML", false, spaceHtml);

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
      textAlign: "left",
      hideTitle: false,
      fullWidth: false,
      lineSpacing: "1.5",
    };

    const newDocs = [newDoc, ...docsRef.current];
    docsRef.current = newDocs;
    setDocs(newDocs);

    setAnimatingDocId(newId);
    setTimeout(() => {
      setAnimatingDocId((prev) => (prev === newId ? null : prev));
    }, 1000);

    prevActiveDocIdRef.current = newId;
    setActiveDocId(newId);
    setSelectedDocIds([newId]);

    // Load the new doc into the editor directly
    if (titleRef.current) titleRef.current.textContent = "";
    if (editorRef.current) editorRef.current.innerHTML = "<p><br></p>";

    if (sidebarScrollRef.current && !targetGroupId) {
      setTimeout(() => {
        sidebarScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 10);
    }
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
    const snapshot = { prevDocs: docsRef.current, prevActiveDocId: activeDocId };
    deletedDocInfoRef.current = snapshot;
    setDeletedDocInfo(snapshot);
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
        if (titleRef.current) titleRef.current.textContent = "";
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

  const handleDuplicateDoc = (docId) => {
    const docToClone = docsRef.current.find((d) => d.id === docId);
    if (!docToClone) return;

    const newDocId = crypto.randomUUID();
    const newDoc = {
      ...docToClone,
      id: newDocId,
      title: "Copy of " + (docToClone.title || "Untitled"),
      createdAt: new Date().toISOString(),
      isPinned: false,
    };

    setDocs((prev) => {
      const idx = prev.findIndex((d) => d.id === docId);
      const updated = [...prev];
      if (idx >= 0) {
        updated.splice(idx + 1, 0, newDoc);
      } else {
        updated.unshift(newDoc);
      }
      docsRef.current = updated;
      return updated;
    });

    setAnimatingDocId(newDocId);
    setTimeout(() => {
      setAnimatingDocId((prev) => (prev === newDocId ? null : prev));
    }, 1000);

    setActiveDocId(newDocId);
    setContextMenu(null);
  };

  const handleRenameSubmit = (docId, newTitle) => {
    setDocs((prev) => {
      const updated = prev.map((d) => {
        if (d.id !== docId) return d;
        let nextEmoji = d.emoji;
        if (!d.hasCustomEmoji) {
          const autoEmoji = getEmojiForTitle(newTitle);
          if (autoEmoji && autoEmoji !== d.emoji) {
            nextEmoji = autoEmoji;
            setAnimatingEmojiDocId(d.id);
            setTimeout(() => {
              setAnimatingEmojiDocId(p => p === d.id ? null : p);
            }, 200);
          }
        }
        return { ...d, title: newTitle, emoji: nextEmoji };
      });
      docsRef.current = updated;
      return updated;
    });
    
    if (docId === activeDocId && titleRef.current) {
      if (titleRef.current.textContent !== newTitle) {
        titleRef.current.textContent = newTitle;
      }
    }
    
    setEditingDocId(null);
  };

  const handleShareDoc = async (docId) => {
    const docToShare = docsRef.current.find(d => d.id === docId);
    if (!docToShare) return;

    try {
      if (user) {
        await setDoc(doc(db, "shared_documents", docId), {
          ...docToShare,
          sharedBy: user.uid,
          sharedAt: new Date().toISOString()
        });
      }
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${docId}`;
      await navigator.clipboard.writeText(shareUrl);
      setSharePopupInfo({ url: shareUrl });
    } catch (e) {
      console.error(e);
      alert("Failed to share document. " + e.message);
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
            titleRef.current.textContent = doc.title;
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
    let x = rect.right;
    let y = rect.top;

    // Prevent off-screen rendering
    if (y + 250 > window.innerHeight) {
      y = Math.max(10, window.innerHeight - 260);
    }
    
    setContextMenu({
      docId,
      x,
      y,
    });
  };

  const handleGroupMenu = (e, groupId) => {
    e.stopPropagation();
    e.preventDefault();
    if (groupMenuOpen?.id === groupId) {
      setGroupMenuOpen(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    let x = rect.right - 176; // w-44 is 176px
    let y = Math.min(rect.bottom + 4, window.innerHeight - 100);

    setGroupMenuOpen({
      id: groupId,
      x,
      y,
    });
  };

  const handleDocClick = (e, id) => {
    // Close context menu on any click
    setContextMenu(null);
    // Dismiss document preview on click
    clearTimeout(hoverTimeoutRef.current);
    setPreviewHoverDocId(null);

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
      ghost.className = "bg-[#E8572A] text-white px-3 py-1 rounded-md text-sm shadow-lg pointer-events-none fixed -top-10";
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
      const relativeY = e.clientY - rect.top;
      const position = relativeY < rect.height * 0.5 ? 'before' : 'after';
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
      const relativeY = e.clientY - rect.top;
      const position = relativeY < rect.height * 0.5 ? 'before' : 'after';

      const idsToMove = selectedDocIds.includes(draggedItem.id) ? selectedDocIds : [draggedItem.id];
      if (idsToMove.includes(targetDocId)) return; // Don't drop onto itself

      setDocs(prev => {
        let newDocs = prev.filter(d => !idsToMove.includes(d.id));

        const targetIdx = newDocs.findIndex(d => d.id === targetDocId);
        if (targetIdx === -1) return prev;

        const tDoc = newDocs[targetIdx];
        const targetGroupId = tDoc.groupId;

        const docsToInsert = prev
          .filter(d => idsToMove.includes(d.id))
          .map(d => ({ ...d, groupId: targetGroupId }));

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

    if (command.type === "buddy") {
      setBuddyState({
        show: true,
        x: slashState.x,
        y: slashState.y,
        savedRange: range,
        selectedText: "",
        isCollapsed: true,
      });
      setSlashState((prev) => ({ ...prev, isOpen: false, query: "" }));
      return;
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

  const handleBuddyApply = (newText, op) => {
    if (!editorRef.current) return;

    const rawHtml =
      typeof newText === "object" && newText !== null ? newText.generated_html : newText;
    if (typeof rawHtml !== "string" || !rawHtml.trim()) return;

    const scrollY = window.scrollY;

    // Walk up from a DOM node to find its direct-child-of-editor ancestor
    const getEditorBlock = (node) => {
      let n = node?.nodeType === Node.TEXT_NODE ? node.parentNode : node;
      while (n && n.parentNode !== editorRef.current) n = n.parentNode;
      return n && editorRef.current.contains(n) ? n : null;
    };

    // ── replace_document ─────────────────────────────────────────────────────
    // Set innerHTML directly — avoids execCommand selectAll/insertHTML artifacts
    if (op === "replace_document") {
      const { html } = createNativeHtmlPayload(rawHtml, { forceBlockRoots: true });
      editorRef.current.innerHTML = html || "<p><br></p>";
      window.scrollTo({ top: scrollY, behavior: "instant" });
      syncContentToState();
      return;
    }

    // ── append (Insert button from chat panel) ────────────────────────────────
    if (op === "append") {
      editorRef.current.focus({ preventScroll: true });
      const { html, hasBlockRoot } = createNativeHtmlPayload(rawHtml, { forceBlockRoots: false });
      const sel = window.getSelection();
      sel.removeAllRanges();
      if (buddyState.savedRange) {
        const r = buddyState.savedRange.cloneRange();
        sel.addRange(r);
        sel.collapseToEnd();
      } else {
        const r = document.createRange();
        r.selectNodeContents(editorRef.current);
        r.collapse(false);
        sel.addRange(r);
      }
      document.execCommand("insertHTML", false, hasBlockRoot ? html : `&nbsp;${html}` || "<p><br></p>");
      window.scrollTo({ top: scrollY, behavior: "instant" });
      syncContentToState();
      return;
    }

    // ── insert_at_cursor ──────────────────────────────────────────────────────
    if (op === "insert_at_cursor") {
      editorRef.current.focus({ preventScroll: true });
      const { html } = createNativeHtmlPayload(rawHtml, { forceBlockRoots: false });
      const sel = window.getSelection();
      sel.removeAllRanges();
      if (buddyState.savedRange) {
        const r = buddyState.savedRange.cloneRange();
        sel.addRange(r);
        sel.collapseToStart();
      } else {
        const r = document.createRange();
        r.selectNodeContents(editorRef.current);
        r.collapse(false);
        sel.addRange(r);
      }
      document.execCommand("insertHTML", false, html || "<p><br></p>");
      window.scrollTo({ top: scrollY, behavior: "instant" });
      syncContentToState();
      return;
    }

    // ── replace_selection ─────────────────────────────────────────────────────
    if (op === "replace_selection" && buddyState.savedRange) {
      const { html, hasBlockRoot } = createNativeHtmlPayload(rawHtml, { forceBlockRoots: true });
      const range = buddyState.savedRange.cloneRange();
      const startBlock = getEditorBlock(range.startContainer);
      const endBlock = getEditorBlock(range.endContainer);

      // Determine if the selection covers whole block(s) vs. a partial inline range
      const isFullSingleBlock =
        startBlock &&
        startBlock === endBlock &&
        startBlock.textContent.trim() === buddyState.selectedText.trim();
      const isMultiBlock = startBlock && endBlock && startBlock !== endBlock;

      if (hasBlockRoot && (isFullSingleBlock || isMultiBlock) && startBlock) {
        // DOM-level swap: insert new nodes, remove old blocks — no execCommand, no artifacts
        const tmpDiv = document.createElement("div");
        tmpDiv.innerHTML = html || "<p><br></p>";
        const newNodes = Array.from(tmpDiv.childNodes);

        const toRemove = [];
        let cursor = startBlock;
        while (cursor) {
          toRemove.push(cursor);
          if (cursor === endBlock) break;
          cursor = cursor.nextSibling;
        }

        newNodes.forEach((n) => editorRef.current.insertBefore(n, startBlock));
        toRemove.forEach((b) => b.remove());
      } else {
        // Inline / partial-block: execCommand works correctly for non-block replacements
        editorRef.current.focus({ preventScroll: true });
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("insertHTML", false, html || "");
      }

      window.scrollTo({ top: scrollY, behavior: "instant" });
      syncContentToState();
      return;
    }

    // ── fallback: insert at end ───────────────────────────────────────────────
    editorRef.current.focus({ preventScroll: true });
    const { html } = createNativeHtmlPayload(rawHtml, { forceBlockRoots: true });
    const sel = window.getSelection();
    const r = document.createRange();
    r.selectNodeContents(editorRef.current);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
    document.execCommand("insertHTML", false, html || "<p><br></p>");
    window.scrollTo({ top: scrollY, behavior: "instant" });
    syncContentToState();
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
      const allTrs = Array.from(tbody.querySelectorAll("tr"));
      const visibleTrs = allTrs.filter(tr => tr.style.display !== 'none');
      const startRows = visibleTrs.length;
      const startCols = visibleTrs[0] ? Array.from(visibleTrs[0].querySelectorAll("td")).filter(td => td.style.display !== 'none').length : 1;

      const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const newCols = Math.max(1, startCols + Math.round(dx / 120));
        const newRows = Math.max(1, startRows + Math.round(dy / 38));

        const currentTrs = Array.from(tbody.querySelectorAll("tr"));
        const maxCols = currentTrs[0] ? currentTrs[0].querySelectorAll("td").length : newCols;

        while (currentTrs.length < newRows) {
          const tr = document.createElement("tr");
          for (let i = 0; i < Math.max(newCols, maxCols); i++) {
            const td = document.createElement("td");
            td.innerHTML = "<br>";
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
          currentTrs.push(tr);
        }

        for (let r = 0; r < currentTrs.length; r++) {
          currentTrs[r].style.display = (r < newRows) ? '' : 'none';
        }

        currentTrs.forEach((tr) => {
          const tds = Array.from(tr.querySelectorAll("td"));
          while (tds.length < newCols) {
            const td = document.createElement("td");
            td.innerHTML = "<br>";
            tr.appendChild(td);
            tds.push(td);
          }
          for (let c = 0; c < tds.length; c++) {
            tds[c].style.display = (c < newCols) ? '' : 'none';
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

    const html = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');
    const isExactUrl = /^https?:\/\/[^\s]+$/.test(textData.trim());

    if (isExactUrl) {
      e.preventDefault();
      const url = textData.trim();

      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);

      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("delete", false, null);
      
      const placeholderId = `link-preview-${Date.now()}`;
      const placeholderHtml = `<div id="${placeholderId}" contenteditable="false" class="link-preview-loading"></div>`;
      
      document.execCommand("insertHTML", false, placeholderHtml);

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
      const nativePaste = createNativeHtmlPayload(html);
      const sel = window.getSelection();
      if (sel.rangeCount && nativePaste.html) {
        document.execCommand("insertHTML", false, nativePaste.html);
      }

      syncContentToState();
      return;
    }

    if (textData) {
      e.preventDefault();

      if (textData.includes("\n")) {
        const nativeTextPaste = createNativeHtmlPayload(textData, { forceBlockRoots: true });
        document.execCommand("insertHTML", false, nativeTextPaste.html || "<p><br></p>");
      } else {
        document.execCommand("insertText", false, textData);
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
      // --- Table Highlight Deletion ---
      if ((e.key === "Backspace" || e.key === "Delete") && window.getSelection() && !window.getSelection().isCollapsed) {
        const sel = window.getSelection();
        const range = sel.getRangeAt(0);
        const startEl = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer;
        const endEl = range.endContainer.nodeType === 3 ? range.endContainer.parentElement : range.endContainer;

        const tables = editorRef.current?.querySelectorAll('.table-container') || [];
        let deletedAny = false;

        tables.forEach(t => {
          if (sel.containsNode(t, true)) {
            t.remove();
            deletedAny = true;
          }
        });

        const startTable = startEl.closest('.table-container');
        const endTable = endEl.closest('.table-container');

        if (startTable && startTable === endTable) {
          const startTd = startEl.closest('td') || startEl.closest('.table-title');
          const endTd = endEl.closest('td') || endEl.closest('.table-title');
          if (startTd && endTd && startTd !== endTd) {
            e.preventDefault();
            isInternalEdit.current = true;
            startTable.remove();
            syncContentToState();
            return;
          }
        } else if (deletedAny) {
          setTimeout(() => syncContentToState(), 10);
        }
      }

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

      // --- Formatting & Color Shortcuts ---
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          document.execCommand('bold', false, null);
          syncContentToState();
          return;
        }
        if (e.key.toLowerCase() === 'i') {
          e.preventDefault();
          document.execCommand('italic', false, null);
          syncContentToState();
          return;
        }
        if (e.key.toLowerCase() === 'u') {
          e.preventDefault();
          document.execCommand('underline', false, null);
          syncContentToState();
          return;
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && !e.altKey) {
        let hColor = null;
        if (e.key.toLowerCase() === 'h') {
          hColor = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#716215' : '#fef08a'; // Yellow
        } else if (e.key.toLowerCase() === 'r') {
          hColor = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#7f1d1d' : '#fecaca'; // Red
        } else if (e.key.toLowerCase() === 'g') {
          hColor = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#14532d' : '#bbf7d0'; // Green
        } else if (e.key.toLowerCase() === 'e') {
          hColor = 'transparent'; // Remove highlight
        }

        if (hColor) {
          e.preventDefault();
          document.execCommand('backColor', false, hColor);
          syncContentToState();
          return;
        }
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
          const cleanText = text.replace(/[\u200B]/g, '').trimStart();

          if (cleanText === "1." && e.key === " ") {
            e.preventDefault();
            const range = selection.getRangeAt(0);
            range.setStart(focusNode, selection.focusOffset - 2);
            range.setEnd(focusNode, selection.focusOffset);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand("delete", false, null);
            document.execCommand("insertOrderedList", false, null);
            syncContentToState();
            return;
          } else if (
            (cleanText === "-" || cleanText === "*") &&
            e.key === " "
          ) {
            e.preventDefault();
            const range = selection.getRangeAt(0);
            range.setStart(focusNode, selection.focusOffset - 1);
            range.setEnd(focusNode, selection.focusOffset);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand("delete", false, null);
            document.execCommand("insertUnorderedList", false, null);
            syncContentToState();
            return;
          } else if (cleanText === "[]" && e.key === " ") {
            e.preventDefault();
            const range = selection.getRangeAt(0);
            range.setStart(focusNode, selection.focusOffset - 2);
            range.setEnd(focusNode, selection.focusOffset);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand("delete", false, null);
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
            cleanText === "/table" &&
            (e.key === " " || e.key === "Enter")
          ) {
            e.preventDefault();
            const range = selection.getRangeAt(0);
            range.setStart(focusNode, selection.focusOffset - 6);
            range.setEnd(focusNode, selection.focusOffset);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand("delete", false, null);
            const cmd = COMMANDS.find((c) => c.id === "table");
            document.execCommand("insertHTML", false, cmd.tag);
            syncContentToState();
            return;
          }
        }
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const isList = selection && selection.focusNode && 
          (selection.focusNode.nodeType === 3 ? selection.focusNode.parentElement : selection.focusNode).closest('li');
        
        if (isList) {
          document.execCommand(e.shiftKey ? "outdent" : "indent", false, null);
        } else if (!e.shiftKey) {
          document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
        }
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
      if (!event.target.closest('.words-context-menu')) {
        setContextMenu(null);
        setGroupMenuOpen(null);
        setShareMenuOpen(false);
        setUserMenuOpen(false);
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
  const docFont = activeDoc?.docFont || 'sans';

  const renderDocItem = (doc) => {
    const isSelected = selectedDocIds.includes(doc.id);
    const isActive = activeDocId === doc.id;
    return (
      <motion.div
        layout
        initial={{ opacity: 0, height: 0, scale: 0.95, filter: 'blur(4px)', marginBottom: 0 }}
        animate={{ opacity: 1, height: "auto", scale: 1, filter: 'blur(0px)', marginBottom: 1 }}
        exit={{ opacity: 0, height: 0, scale: 0.95, filter: 'blur(2px)', marginBottom: 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 35, mass: 1 }}
        style={{ overflow: "hidden", transformOrigin: "top" }}
        key={doc._isTemp ? `temp-${doc.id}` : doc.id}
      >
        <div
          data-doc-id={doc.id}
          data-sidebar-item
          onPointerDown={(e) => startDocPointerDrag(e, doc.id)}
          onClick={(e) => handleDocClick(e, doc.id)}
          onMouseEnter={(e) => {
            clearTimeout(hoverTimeoutRef.current);
            setPreviewHoverGroupId(null);
            if (previewHoverDocId !== doc.id) setPreviewHoverDocId(null);

            if (activeDocId === doc.id || doc.isLocked) return;
            const rect = e.currentTarget.getBoundingClientRect();
            hoverTimeoutRef.current = setTimeout(() => {
              setPreviewPos({ top: rect.top, left: rect.right + 16 });
              setPreviewHoverDocId(doc.id);
            }, 600);
          }}
          onMouseLeave={() => {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = setTimeout(() => {
              setPreviewHoverDocId(null);
            }, 300);
          }}
          style={draggedItem?.type === 'doc' && draggedItem?.id === doc.id ? { opacity: 0, pointerEvents: 'none' } : undefined}
          className={`group relative flex items-center justify-between px-3 py-[6px] rounded-md cursor-grab active:cursor-grabbing transition-colors select-none ${isSelected
            ? "bg-[var(--color-bg-hover-strong)] text-[var(--color-text-primary)] font-medium"
            : isActive ? "text-[var(--color-text-primary)] font-medium bg-black/[0.02] dark:bg-white/[0.04]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
            } ${dragTarget?.id === doc.id && dragTarget?.position === 'inset' ? 'ring-1 ring-[var(--color-accent)] bg-[var(--color-accent)]/[0.06]' : ''}`}
        >
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
                <span
                  key={animatingEmojiDocId === doc.id ? `anim-${doc.emoji}` : doc.emoji}
                  className={`${animatingEmojiDocId === doc.id ? 'animate-tasteful-pop' : ''} inline-block leading-none`}
                >
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
            {editingDocId === doc.id ? (
              <input
                autoFocus
                type="text"
                value={editingDocTitle}
                onChange={(e) => setEditingDocTitle(e.target.value)}
                onBlur={() => handleRenameSubmit(doc.id, editingDocTitle)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(doc.id, editingDocTitle);
                  if (e.key === 'Escape') { setEditingDocId(null); setEditingDocTitle(''); }
                }}
                className="bg-transparent text-[14px] text-[var(--color-text-primary)] outline-none w-full min-w-0"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-[14px] select-none whitespace-nowrap">
                {doc.title || "Untitled"}
              </span>
            )}
          </div>
          <div
            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onMouseEnter={() => {
              clearTimeout(hoverTimeoutRef.current);
              setPreviewHoverDocId(null);
            }}
            onMouseLeave={(e) => {
              if (activeDocId === doc.id || doc.isLocked) return;
              const rect = e.currentTarget.closest('.group').getBoundingClientRect();
              hoverTimeoutRef.current = setTimeout(() => {
                setPreviewPos({ top: rect.top, left: rect.right + 16 });
                setPreviewHoverDocId(doc.id);
              }, 600);
            }}
          >
            <button
              onClick={(e) => {
                if (isAltHeld) {
                  deleteDoc(e, doc.id);
                  setContextMenu(null);
                } else {
                  handleContextMenu(e, doc.id);
                }
              }}
              className={`words-context-menu p-1 rounded transition-colors ${isAltHeld ? 'text-red-500 hover:text-red-600' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
              title={isAltHeld ? "Delete" : "More options"}
            >
              {isAltHeld ? <Trash2 size={14} /> : <MoreHorizontal size={14} />}
            </button>
          </div>
        </div>
      </motion.div>
    )
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans selection:bg-[#E8572A33] overflow-hidden relative w-full">
      {/* Dynamic Editor Typography */}
      <style
        dangerouslySetInnerHTML={{
          __html: ` .editor-content { outline: none; padding-bottom: 30vh; color: var(--color-text-primary); ${isSpacingAnimating ? 'transition: line-height 0.3s cubic-bezier(0.16, 1, 0.3, 1);' : ''} } 
              .editor-content::after { content: "" ; display: table; clear: both; } 
              .editor-content > * {
                margin-top: ${activeDoc?.lineSpacing === '1.0' ? '2px' : activeDoc?.lineSpacing === '2.0' ? '8px' : '4px'};
                margin-bottom: ${activeDoc?.lineSpacing === '1.0' ? '2px' : activeDoc?.lineSpacing === '2.0' ? '8px' : '4px'};
                line-height: inherit;
                ${isSpacingAnimating ? 'transition: margin-top 0.3s cubic-bezier(0.16, 1, 0.3, 1), margin-bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1);' : ''}
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

              .editor-content > * {
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
              }

              .editor-content ul {
                list-style-type: disc;
                list-style-position: outside;
                padding-left: 1.5em;
                margin-top: 0.5em;
                margin-bottom: 0.5em;
              }
              
              .editor-content ul li {
                padding-left: 0.1em;
              }

              .editor-content ul ul {
                list-style-type: circle;
                padding-left: 1.5em;
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
                top: 0.24em;
                width: 16px;
                height: 16px;
                box-shadow: inset 0 0 0 1.5px var(--color-icon-muted);
                border-radius: calc(4px + var(--radius-bonus));
                cursor: pointer;
                background-color: transparent;
                transition: all 0.2s ease;
              }

              .editor-content ul.checklist>li.checked::before {
                background-color: var(--color-accent);
                box-shadow: inset 0 0 0 1.5px var(--color-accent);
              }

              .editor-content ul.checklist>li::after {
                content: '';
                position: absolute;
                left: calc(0.1em + 5.5px);
                top: calc(0.24em + 2.5px);
                width: 5px;
                height: 9px;
                border: solid white;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
                clip-path: circle(0% at 0% 100%);
                opacity: 0;
                transition: clip-path 0.2s ease-out, opacity 0.2s ease-out;
              }

              .editor-content ul.checklist>li.checked::after {
                clip-path: circle(150% at 0% 100%);
                opacity: 1;
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
                corner-shape: round;
                cursor: se-resize;
                z-index: 10;
                border: 2px solid var(--color-bg-primary, white);
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
      {/* Options Menu */}
      <div className="absolute top-4 right-4 z-30 print:hidden">
        <div className="relative">
          <button
            onClick={() => setShareMenuOpen(!shareMenuOpen)}
            className="words-context-menu p-2 text-[var(--color-text-faint)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
            title="Options"
          >
            <MoreHorizontal size={20} />
          </button>
          {shareMenuOpen && (
            <>
              <motion.div layout className="words-context-menu absolute right-0 top-full mt-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl py-1 z-[40] w-56 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <button 
                      className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-lg transition-all hover:bg-[var(--color-bg-hover)] bg-transparent"
                      onClick={() => setDocs(prev => prev.map(d => d.id === activeDocId ? { ...d, docFont: 'sans' } : d))}
                    >
                      <span className={`text-[22px] leading-none mb-1 ${docFont === 'sans' ? 'text-[#E8572A]' : 'text-[var(--color-text-primary)]'}`}>Ag</span>
                      <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Default</span>
                    </button>
                    <button 
                      className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-lg transition-all hover:bg-[var(--color-bg-hover)] bg-transparent"
                      onClick={() => setDocs(prev => prev.map(d => d.id === activeDocId ? { ...d, docFont: 'serif' } : d))}
                    >
                      <span className={`text-[22px] leading-none mb-1 font-serif ${docFont === 'serif' ? 'text-[#E8572A]' : 'text-[var(--color-text-primary)]'}`}>Ag</span>
                      <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Serif</span>
                    </button>
                    <button 
                      className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-lg transition-all hover:bg-[var(--color-bg-hover)] bg-transparent"
                      onClick={() => setDocs(prev => prev.map(d => d.id === activeDocId ? { ...d, docFont: 'mono' } : d))}
                    >
                      <span className={`text-[22px] leading-none mb-1 font-mono ${docFont === 'mono' ? 'text-[#E8572A]' : 'text-[var(--color-text-primary)]'}`}>Ag</span>
                      <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Mono</span>
                    </button>
                  </div>
                </div>
                <div className="h-px bg-[var(--color-border-primary)] my-1" />
                <button
                  className="w-full text-left px-3 py-2 flex items-center justify-between text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  onClick={() => setStyleAccordionOpen(!styleAccordionOpen)}
                >
                  <div className="flex items-center gap-2.5">
                    <Paintbrush size={14} /> Style
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-200 text-[var(--color-text-muted)] ${styleAccordionOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {styleAccordionOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 pb-1 flex flex-col gap-3 px-3">
                        {/* Text Alignment */}
                        <div className="flex bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md p-1 items-center justify-between">
                          {['left', 'center', 'right', 'justify'].map((align) => {
                            const active = activeDoc?.textAlign === align || (!activeDoc?.textAlign && align === 'left');
                            return (
                              <button
                                key={align}
                                onClick={() => {
                                  setDocs(prev => prev.map(d => d.id === activeDocId ? { ...d, textAlign: align } : d));
                                  if (editorRef.current) {
                                    editorRef.current.querySelectorAll('*').forEach(el => {
                                      if (el.style) el.style.textAlign = '';
                                      if (el.hasAttribute('align')) el.removeAttribute('align');
                                    });
                                    syncContentToState();
                                  }
                                }}
                                className={`flex-1 flex justify-center py-1.5 rounded-sm transition-colors ${active ? 'bg-[var(--color-bg-primary)] shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'} hover:bg-[var(--color-bg-hover)]`}
                              >
                                {align === 'left' && <AlignLeft size={16} />}
                                {align === 'center' && <AlignCenter size={16} />}
                                {align === 'right' && <AlignRight size={16} />}
                                {align === 'justify' && <AlignJustify size={16} />}
                              </button>
                            );
                          })}
                        </div>
                        {/* Line Spacing UI */}
                        <div className="flex flex-col border border-[var(--color-border-primary)] rounded-md overflow-hidden bg-[var(--color-bg-secondary)]">
                          {['1.0', '1.5', '2.0'].map((space, idx) => {
                            const lbl = space === '1.0' ? 'Compact' : space === '1.5' ? 'Standard' : 'Spacious';
                                const active = activeDoc?.lineSpacing === space || (!activeDoc?.lineSpacing && space === '1.5');
                                return (
                                  <button
                                    key={space}
                                    onClick={() => {
                                      setIsSpacingAnimating(true);
                                      setDocs(prev => prev.map(d => d.id === activeDocId ? { ...d, lineSpacing: space } : d));
                                      setTimeout(() => setIsSpacingAnimating(false), 350);
                                    }}
                                className={`text-[12px] py-1.5 px-3 text-left hover:bg-[var(--color-bg-hover)] transition-colors ${active ? 'bg-[var(--color-bg-primary)] text-[#E8572A] font-medium' : 'text-[var(--color-text-muted)]'} ${idx > 0 ? 'border-t border-[var(--color-border-primary)]' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col opacity-70" style={{ gap: space === '1.0' ? '1px' : space === '1.5' ? '2px' : '4px' }}>
                                    <div className="w-3 h-0.5 bg-current rounded-full" />
                                    <div className="w-3 h-0.5 bg-current rounded-full" />
                                    <div className="w-2 h-0.5 bg-current rounded-full" />
                                  </div>
                                  {lbl}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Sub Divider */}
                      <div className="h-px bg-[var(--color-border-primary)] mx-3 my-1" />

                      {/* Hide Title - Standard Styled */}
                      <button
                        className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        onClick={() => setDocs(prev => prev.map(d => d.id === activeDocId ? { ...d, hideTitle: !d.hideTitle } : d))}
                      >
                        <EyeOff size={14} className={activeDoc?.hideTitle ? "text-[#E8572A]" : "text-[var(--color-text-muted)]"} />
                        <span className={activeDoc?.hideTitle ? "text-[#E8572A]" : ""}>Hide title</span>
                      </button>

                      {/* Full Width Layout - Standard Styled */}
                      <button
                        className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        onClick={() => setDocs(prev => prev.map(d => d.id === activeDocId ? { ...d, fullWidth: !d.fullWidth } : d))}
                      >
                        {activeDoc?.fullWidth ? <Minimize2 size={14} className="text-[#E8572A]" /> : <Maximize2 size={14} className="text-[var(--color-text-muted)]" />}
                        <span className={activeDoc?.fullWidth ? "text-[#E8572A]" : ""}>Full width page</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="h-px bg-[var(--color-border-primary)] my-1" />
                <button
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  onClick={() => {
                    setShareMenuOpen(false);
                    handleShareDoc(activeDocId);
                  }}
                >
                  <Link size={14} /> Share via link
                </button>
                <div className="h-px bg-[var(--color-border-primary)] my-1" />
                <button
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  onClick={() => {
                    setShareMenuOpen(false);
                    setTimeout(() => window.print(), 100);
                  }}
                >
                  <Share size={14} /> Export
                </button>
                <button
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  onClick={() => {
                    setShareMenuOpen(false);
                    setTimeout(() => window.print(), 100);
                  }}
                >
                  <Printer size={14} /> Print
                </button>
              </motion.div>
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
            <div className="flex items-center gap-1.5 font-bold text-[19px] tracking-tight select-none" style={{ fontFamily: '"Gowun Batang", serif' }}>
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
            id="sidebar-scroll-root"
            ref={sidebarScrollRef}
            className="flex-1 overflow-y-auto no-scrollbar pb-6 mt-2 flex flex-col h-full px-2"
            onScroll={(e) => setIsSidebarScrolled(e.currentTarget.scrollTop > 5)}
            onDragOver={handleSidebarDragOver}
            onDrop={handleDropOnSidebarRoot}
            onDoubleClick={(e) => {
              // Only create new doc if double-clicking truly empty sidebar space
              // Skip if clicking on any sidebar content item
              if (e.target.closest('button, input, a, [draggable], [data-sidebar-item]')) return;
              createNewDoc(e);
            }}
            onContextMenu={(e) => {
              if (e.target.closest('button, input, a, [data-sidebar-item]')) return;
              e.preventDefault();
              setSidebarContextMenu({ isOpen: true, x: e.clientX, y: e.clientY });
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
                {/* Sticky Header Zone */}
                <div className="sticky top-0 z-20 bg-[var(--color-bg-secondary)] pb-2 pt-2 -mt-2">
                  <div className={`absolute top-full left-0 right-0 h-8 pointer-events-none transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSidebarScrolled ? 'opacity-100' : 'opacity-0'}`}>
                    <GradualBlur position="top" height="100%" strength={0.15} divCount={4} zIndex={0} />
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg-secondary)] to-transparent z-10" />
                  </div>

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
                              onMouseEnter={(e) => {
                                clearTimeout(hoverTimeoutRef.current);
                                setPreviewHoverGroupId(null);
                                if (previewHoverDocId !== doc.id) setPreviewHoverDocId(null);

                                if (activeDocId === doc.id || doc.isLocked) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                hoverTimeoutRef.current = setTimeout(() => {
                                  setPreviewPos({ top: rect.top, left: 272 });
                                  setPreviewHoverDocId(doc.id);
                                }, 600);
                              }}
                              onMouseLeave={() => {
                                clearTimeout(hoverTimeoutRef.current);
                                hoverTimeoutRef.current = setTimeout(() => {
                                  setPreviewHoverDocId(null);
                                }, 300);
                              }}
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
                                onMouseEnter={(e) => {
                                  clearTimeout(hoverTimeoutRef.current);
                                  setPreviewHoverDocId(null);
                                }}
                                onMouseLeave={(e) => {
                                  if (activeDocId === doc.id || doc.isLocked) return;
                                  const rect = e.currentTarget.closest('[data-sidebar-item]').getBoundingClientRect();
                                  hoverTimeoutRef.current = setTimeout(() => {
                                    setPreviewPos({ top: rect.top, left: 272 });
                                    setPreviewHoverDocId(doc.id);
                                  }, 600);
                                }}
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
                  <div className="space-y-[1px]">
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
                </div>

                <div className="flex-1 flex flex-col relative z-0 mt-2">
                  {/* Document Groups */}
                  <div className="space-y-[2px] mb-2">
                    {groups.map((group) => {
                      const groupDocs = regularDocs.filter((d) => d.groupId === group.id);
                      return (
                        <div
                          key={group.id}
                          data-group-id={group.id}
                          className="flex flex-col relative"
                          onDragOver={(e) => handleSidebarDragOver(e, group.id, 'group')}
                          onDrop={(e) => handleDropOnGroup(e, group.id)}
                        >
                          {dragTarget?.id === group.id && dragTarget?.type === 'group' && dragTarget?.position === 'before' && (
                            <div className="absolute top-[-1px] left-2 right-2 h-[2px] bg-[#E8572A] rounded-full z-10 pointer-events-none" />
                          )}
                          {dragTarget?.id === group.id && dragTarget?.type === 'group' && dragTarget?.position === 'after' && (
                            <div className="absolute bottom-[-1px] left-2 right-2 h-[2px] bg-[#E8572A] rounded-full z-10 pointer-events-none" />
                          )}
                          {dragTarget?.id === group.id && dragTarget?.type === 'group' && dragTarget?.position === 'inset' && (
                            <div className="absolute inset-0 rounded-md ring-1 ring-[var(--color-accent)] bg-[var(--color-accent)]/[0.06] pointer-events-none z-10" />
                          )}
                          <div
                            className="group relative flex items-center justify-between px-3 py-[6px] rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-grab active:cursor-grabbing"
                            style={{ backgroundColor: group.color ? group.color + '10' : undefined }}
                            draggable
                            data-sidebar-item
                            onMouseEnter={(e) => {
                              clearTimeout(hoverTimeoutRef.current);
                              setPreviewHoverDocId(null);
                              if (previewHoverGroupId !== group.id) setPreviewHoverGroupId(null);

                              if (!group.isCollapsed) return;

                              const rect = e.currentTarget.getBoundingClientRect();
                              hoverTimeoutRef.current = setTimeout(() => {
                                setGroupPreviewPos({ top: rect.top, left: rect.right + 16 });
                                setPreviewHoverGroupId(group.id);
                              }, 600);
                            }}
                            onMouseLeave={() => {
                              clearTimeout(hoverTimeoutRef.current);
                              hoverTimeoutRef.current = setTimeout(() => {
                                setPreviewHoverGroupId(null);
                              }, 300);
                            }}
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
                              className="flex items-center gap-2.5 flex-1 cursor-pointer overflow-hidden"
                              onClick={() => {
                                updateGroup(group.id, { isCollapsed: !group.isCollapsed });
                                setPreviewHoverGroupId(null);
                                setPreviewHoverDocId(null);
                              }}
                            >
                              <div
                                className="text-base flex-shrink-0 leading-none select-none flex items-center justify-center w-5 h-5 cursor-pointer transition-transform hover:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const FOLDER_COLORS = ['#9ca3af', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
                                  const nextColor = FOLDER_COLORS[(FOLDER_COLORS.indexOf(group.color) + 1) % FOLDER_COLORS.length] || FOLDER_COLORS[0];
                                  updateGroup(group.id, { color: nextColor });
                                }}
                                title="Change folder color"
                              >
                                <AnimatedFolder isOpen={!group.isCollapsed} color={group.color || 'var(--color-icon-muted)'} fill={group.color ? group.color + '40' : 'none'} />
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
                            <div
                              className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                              onMouseEnter={() => {
                                clearTimeout(hoverTimeoutRef.current);
                                if (previewHoverGroupId !== group.id) {
                                  setPreviewHoverGroupId(null);
                                }
                              }}
                              onMouseLeave={(e) => {
                                const rect = e.currentTarget.closest('.group').getBoundingClientRect();
                                hoverTimeoutRef.current = setTimeout(() => {
                                  setGroupPreviewPos({ top: rect.top, left: rect.right + 16 });
                                  setPreviewHoverGroupId(group.id);
                                }, 600);
                              }}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); createNewDoc(e, group.id); }}
                                className="p-1 hover:opacity-70 transition-opacity rounded"
                                style={{ color: group.color || 'var(--color-icon-muted)' }}
                                title="New doc in folder"
                              >
                                <Plus size={13} />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={(e) => handleGroupMenu(e, group.id)}
                                  className="words-context-menu p-1 hover:opacity-70 transition-opacity rounded"
                                  style={{ color: group.color || 'var(--color-icon-muted)' }}
                                  title="More options"
                                >
                                  <MoreHorizontal size={13} />
                                </button>
                                {groupMenuOpen?.id === group.id && (
                                  <>
                                    <div 
                                      className="words-context-menu fixed bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl py-1 z-[60] w-44 animate-in fade-in zoom-in-95 duration-100"
                                      style={{ top: groupMenuOpen.y, left: groupMenuOpen.x }}
                                    >
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
                          <div
                            className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${group.isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
                          >
                            <div className="overflow-hidden">
                              <div className="pl-4 pr-1 pt-0.5 pb-1">
                                <AnimatePresence initial={false}>
                                  {groupDocs.length > 0 ? (
                                    groupDocs.map(renderDocItem)
                                  ) : (
                                    <div className="pl-4 py-1.5 text-[12px] text-[var(--color-text-faint)] italic select-none">
                                      Empty
                                    </div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>

                          {/* Active doc quick-view when collapsed */}
                          <AnimatePresence>
                            {group.isCollapsed && groupDocs.some(d => d.id === activeDocId) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ type: "spring", stiffness: 450, damping: 35, mass: 1 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-4 pr-1 pt-0.5 pb-1">
                                  {renderDocItem({ ...groupDocs.find(d => d.id === activeDocId), _isTemp: true })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ungrouped Documents */}
                  <div>
                    <AnimatePresence initial={false}>
                      {ungroupedDocs.map(renderDocItem)}
                    </AnimatePresence>
                  </div>

                  <div className="h-24 w-full flex-shrink-0" data-sidebar-empty-zone onDragOver={handleSidebarDragOver} onDrop={handleDropOnSidebarRoot}></div>
                </div>
              </>
            )}
          </div>

          {/* Bottom styling fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-30">
            <GradualBlur position="bottom" height="100%" strength={0.4} divCount={5} zIndex={0} />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-secondary)] to-transparent z-10" />
          </div>

          {/* Cloud Sync Toggle */}
          <div className="absolute bottom-4 left-4 z-40">
            <button
              onClick={() => user ? setUserMenuOpen(!userMenuOpen) : setAuthModal('login')}
              className="words-context-menu group p-1.5 text-[var(--color-icon-muted)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
              title={user ? "Cloud Sync Active" : "Enable Cloud Sync"}
            >
              {user ? <Cloud size={16} className={userMenuOpen ? "text-[var(--color-text-primary)]" : "text-[var(--color-icon-muted)] group-hover:text-[var(--color-text-primary)] transition-colors"} /> : <CloudOff size={16} className={authModal ? "text-[var(--color-text-primary)]" : "text-[var(--color-icon-muted)] group-hover:text-[var(--color-text-primary)] transition-colors"} />}
            </button>

            {userMenuOpen && user && (
              <>
                <div className="words-context-menu absolute left-0 bottom-full mb-1 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl py-2 z-[60] min-w-[180px] animate-in fade-in zoom-in-95 duration-100">
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
                    titleRef.current.textContent = doc.title;
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
        <main className={`w-full ${activeDoc?.fullWidth ? 'max-w-[1200px] px-8 sm:px-16' : 'max-w-3xl px-12'} mx-auto pt-24 pb-32 print:pt-0 print:pb-0 flex-grow bg-[var(--color-bg-primary)] ${docFont === 'mono' ? 'font-mono' : ''} ${docFont === 'serif' ? 'font-serif theme-font-serif' : ''}`}>
          {/* Print Logo */}
          <div className="hidden print:flex mb-6 items-center gap-2">
            <img src="/faviconlight.png" alt="Logo" className="w-5 h-5 object-contain" />
            <span className="font-semibold text-[13px] text-[var(--color-text-muted)]">usewords.app</span>
          </div>
          {" "}
          {/* Title Field / Header */}
          <div className={`flex items-start gap-3 group print:mb-4 ${!activeDoc.title && !activeDoc.emoji ? 'print:hidden' : ''}`} style={{ display: activeDoc.hideTitle ? 'none' : 'flex', marginBottom: '2rem' }}>
            <div className={`relative ${!activeDoc.emoji ? 'print:hidden' : ''}`} ref={emojiPickerRef}>
              <button
                className="w-[48px] h-[48px] mt-1 flex items-center justify-center -ml-2 hover:bg-[var(--color-bg-hover)] rounded-md transition-colors select-none cursor-pointer text-3xl"
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              >
                {" "}
                {activeDoc.emoji ? (
                  <span
                    key={animatingEmojiDocId === activeDoc.id ? `anim-${activeDoc.emoji}` : activeDoc.emoji}
                    className={`${animatingEmojiDocId === activeDoc.id ? 'animate-tasteful-pop' : ''} block leading-none print:translate-y-1`}
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
              className="flex-1 title-input text-[36px] sm:text-[42px] font-bold leading-tight outline-none w-full break-words tracking-tight mt-0"
              style={{ textAlign: activeDoc.textAlign || "left" }}
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
            className={`editor-content w-full ${activeDoc.lineSpacing === '1.0' ? 'leading-none' : activeDoc.lineSpacing === '2.0' ? 'leading-loose' : 'leading-relaxed'}`}
            style={{ 
              textAlign: activeDoc.textAlign || "left"
            }}
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
      <AnimatePresence>
        {linkPopoverState.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4, x: "-50%", filter: 'blur(2px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%", filter: 'blur(0px)' }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            transition={{ duration: 0.15 }}
            className="fixed z-40 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-lg rounded-md px-3 py-2 flex items-center gap-2"
            style={{
              top: linkPopoverState.y,
              left: linkPopoverState.x,
              transformOrigin: "top center"
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
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toolbarState.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4, x: "-50%", filter: 'blur(2px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%", filter: 'blur(0px)' }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            transition={{ duration: 0.15 }}
            className="fixed z-40 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-lg rounded-md px-1 py-1 flex items-center gap-0.5"
            style={{
              top: toolbarState.y - 44,
              left: toolbarState.x,
              transformOrigin: "bottom center"
            }}
            onMouseDown={(e) => {
              if (!e.target.closest('input')) e.preventDefault();
            }}
          >
            {toolbarState.showLinkInput ? (
              <div className="flex items-center gap-2 px-1 py-1 bg-[var(--color-bg-primary)]">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setToolbarState(p => ({ ...p, showLinkInput: false }));
                  }}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-md transition-all"
                  title="Back"
                >
                  <ArrowLeft size={14} />
                </button>
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
                        setToolbarState(p => ({ ...p, show: false, showLinkInput: false, showColorPicker: false }));
                      }
                    } else if (e.key === 'Escape') {
                      setToolbarState(p => ({ ...p, show: false, showLinkInput: false, showColorPicker: false }));
                    }
                  }}
                />
              </div>
            ) : (
              <>
                <button
                  onClick={(e) => formatText(e, "bold")}
                  className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                  title="Bold"
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={(e) => formatText(e, "italic")}
                  className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                  title="Italic"
                >
                  <Italic size={14} />
                </button>
                <button
                  onClick={(e) => formatText(e, "strikeThrough")}
                  className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                  title="Strikethrough"
                >
                  <Strikethrough size={14} />
                </button>
                <div className="w-px h-4 bg-[var(--color-border-primary)] mx-0.5" />
                {toolbarState.isLinkActive ? (
                  <button
                    onClick={(e) => {
                      document.execCommand('unlink', false, null);
                      syncContentToState();
                      setToolbarState(p => ({ ...p, show: false, showLinkInput: false, isLinkActive: false }));
                    }}
                    className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                    title="Unlink"
                  >
                    <Unlink size={14} />
                  </button>
                ) : (
                  <button
                    onClick={(e) => setToolbarState(p => ({ ...p, showLinkInput: true }))}
                    className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                    title="Insert Link"
                  >
                    <Link size={14} />
                  </button>
                )}
                
                <div className="w-px h-4 bg-[var(--color-border-primary)] mx-0.5" />
                
                <div className="flex items-center gap-0.5 relative">
                  <button
                    onClick={(e) => {
                      if (toolbarState.savedRange) {
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(toolbarState.savedRange);
                      }
                      
                      const expectedHex = (toolbarState.activeHighlightColor || '#fef08a') + '40';
                      const dummy = document.createElement('div');
                      dummy.style.backgroundColor = expectedHex;
                      const expectedRgba = dummy.style.backgroundColor;
                      
                      let isHighlighted = false;
                      let currentColor = null;
                      let node = window.getSelection().anchorNode;
                      if (node?.nodeType === 3) node = node.parentNode;
                      while (node && node !== editorRef.current && node.tagName !== 'ARTICLE' && node.tagName !== 'MAIN') {
                        if (node.style?.backgroundColor && node.style.backgroundColor !== 'transparent' && node.style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                          isHighlighted = true;
                          currentColor = node.style.backgroundColor;
                          break;
                        }
                        node = node.parentNode;
                      }
                      
                      if (isHighlighted && currentColor === expectedRgba) {
                        formatText(e, "backColor", "transparent");
                      } else {
                        formatText(e, "backColor", expectedHex);
                      }
                    }}
                    className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                    title="Toggle Highlight"
                  >
                    <Highlighter size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setToolbarState(p => ({ ...p, showColorPicker: !p.showColorPicker, showAlignPicker: false }));
                    }}
                    className={`p-1.5 w-[26px] h-[26px] flex items-center justify-center rounded-md transition-colors ${toolbarState.showColorPicker ? 'bg-[var(--color-bg-hover-strong)] text-[var(--color-text-primary)]' : 'text-[var(--color-icon-muted)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)]'}`}
                    title="Color Picker"
                  >
                    <div className="w-[10px] h-[10px] rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: toolbarState.activeHighlightColor || '#fef08a' }} />
                  </button>
                  
                  {/* Color Context Menus */}
                  {toolbarState.showColorPicker && (
                    <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-xl rounded-md px-1 py-1 flex items-center gap-0.5 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-100">
                      {['#9ca3af', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'].map(color => (
                        <button
                          key={color}
                          onClick={(e) => {
                            e.preventDefault();
                            setToolbarState(p => ({ ...p, showColorPicker: false, activeHighlightColor: color }));
                          }}
                          className={`p-1.5 flex items-center justify-center rounded-md transition-colors hover:bg-[var(--color-bg-hover-strong)]`}
                          title="Select highlight color"
                        >
                          <div 
                            className={`w-3.5 h-3.5 rounded-full transition-opacity hover:opacity-80 ${toolbarState.activeHighlightColor === color ? 'ring-2 ring-offset-1 ring-[var(--color-border-primary)] dark:ring-offset-gray-900' : ''}`}
                            style={{ backgroundColor: color }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="w-px h-4 bg-[var(--color-border-primary)] mx-0.5" />
                
                <div className="relative flex items-center">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setToolbarState(p => ({ ...p, showAlignPicker: !p.showAlignPicker, showColorPicker: false }));
                    }}
                    className={`p-1.5 flex items-center gap-0.5 rounded-md transition-colors ${toolbarState.showAlignPicker ? 'bg-[var(--color-bg-hover-strong)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)]'}`}
                    title="Alignment"
                  >
                    {toolbarState.activeAlign === 'center' ? <AlignCenter size={14} /> :
                     toolbarState.activeAlign === 'right' ? <AlignRight size={14} /> :
                     toolbarState.activeAlign === 'justify' ? <AlignJustify size={14} /> :
                     <AlignLeft size={14} />}
                    <ChevronDown size={10} strokeWidth={3} className="text-[var(--color-icon-muted)]" />
                  </button>
                  
                  {/* Alignment Context Menus */}
                  {toolbarState.showAlignPicker && (
                    <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-xl rounded-md px-1 py-1 flex items-center animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-100">
                      <button
                        onClick={(e) => { formatText(e, "justifyLeft"); setToolbarState(p => ({ ...p, showAlignPicker: false, show: false })); }}
                        className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                        title="Align Left"
                      >
                        <AlignLeft size={14} />
                      </button>
                      <button
                        onClick={(e) => { formatText(e, "justifyCenter"); setToolbarState(p => ({ ...p, showAlignPicker: false, show: false })); }}
                        className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                        title="Align Center"
                      >
                        <AlignCenter size={14} />
                      </button>
                      <button
                        onClick={(e) => { formatText(e, "justifyRight"); setToolbarState(p => ({ ...p, showAlignPicker: false, show: false })); }}
                        className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                        title="Align Right"
                      >
                        <AlignRight size={14} />
                      </button>
                      <button
                        onClick={(e) => { formatText(e, "justifyFull"); setToolbarState(p => ({ ...p, showAlignPicker: false, show: false })); }}
                        className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
                        title="Justify"
                      >
                        <AlignJustify size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar Context Menu Overlay */}
      {sidebarContextMenu.isOpen && (
        <div
          className="fixed inset-0 z-[140]"
          onClick={() => setSidebarContextMenu({ isOpen: false, x: 0, y: 0 })}
          onContextMenu={(e) => { e.preventDefault(); setSidebarContextMenu({ isOpen: false, x: 0, y: 0 }); }}
        />
      )}
      {/* Sidebar Context Menu */}
      {sidebarContextMenu.isOpen && (
        <div
          className="fixed z-[150] w-48 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: sidebarContextMenu.y, left: sidebarContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              createNewDoc(e);
              setSidebarContextMenu({ isOpen: false, x: 0, y: 0 });
            }}
          >
            <FileText size={14} /> New Document
          </button>

          <button
            className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              createGroup();
              setSidebarContextMenu({ isOpen: false, x: 0, y: 0 });
            }}
          >
            <Folder size={14} /> New Folder
          </button>
        </div>
      )}

      {/* Document Hover Preview Popover */}
      <AnimatePresence>
        {previewHoverDocId && (() => {
          const previewDoc = docs.find(d => d.id === previewHoverDocId);
          if (!previewDoc) return null;

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="fixed z-[100] w-64 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-2xl rounded-xl p-3 pointer-events-none before:content-[''] before:absolute before:left-[-7px] before:top-4 before:w-3.5 before:h-3.5 before:bg-[var(--color-bg-primary)] before:border-l before:border-b before:border-[var(--color-border-primary)] before:rotate-45 before:rounded-bl-[3px]"
              style={{ top: previewPos.top, left: previewPos.left, transformOrigin: "-16px 20px" }}
            >
              <h3 className="font-semibold text-[13px] text-[var(--color-text-primary)] mb-1.5 break-words">
                {previewDoc.emoji && <span className="mr-1.5">{previewDoc.emoji}</span>}
                {previewDoc.title || "Untitled"}
              </h3>
              <div className="leading-relaxed relative overflow-hidden" style={{ maxHeight: '140px' }}>
                <div
                  className="editor-content !pb-0 scale-[0.6] origin-top-left w-[166.666%] pointer-events-none text-[22px] [&_p]:!text-[22px] [&_li]:!text-[22px] [&_h3]:!text-[22px] [&_blockquote]:!text-[22px] [&_span]:!text-[22px] [&>div]:!text-[22px] [&_a]:!text-[22px] [&>*:first-child]:!mt-0 [&>p:first-child:empty]:!hidden"
                  dangerouslySetInnerHTML={{ __html: (previewDoc.content || "No content").replace(/^(<p><br><\/p>|<p>\s*<\/p>)+/gi, '') }}
                />
                <div className="absolute left-0 right-0 bottom-0 h-10 bg-gradient-to-t from-[var(--color-bg-primary)] to-transparent pointer-events-none" />
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
      {/* Group Hover Preview Popover */}
      <AnimatePresence>
        {previewHoverGroupId && (() => {
          const previewGroup = groups.find(g => g.id === previewHoverGroupId);
          if (!previewGroup) return null;
          const groupDocs = docs.filter(d => !d.isPinned && d.groupId === previewGroup.id);

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="fixed z-[100] w-64 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-2xl rounded-xl p-2 pointer-events-auto before:content-[''] before:absolute before:left-[-7px] before:top-4 before:w-3.5 before:h-3.5 before:bg-[var(--color-bg-primary)] before:border-l before:border-b before:border-[var(--color-border-primary)] before:rotate-45 before:rounded-bl-[3px]"
              style={{ top: groupPreviewPos.top, left: groupPreviewPos.left, transformOrigin: "-16px 20px" }}
              onMouseEnter={() => {
                clearTimeout(hoverTimeoutRef.current);
                setPreviewHoverDocId(null);
              }}
              onMouseLeave={() => {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = setTimeout(() => {
                  setPreviewHoverGroupId(null);
                  setPreviewHoverDocId(null);
                }, 300);
              }}
            >
              <div className="leading-relaxed relative overflow-y-auto overflow-x-hidden flex flex-col gap-[2px] custom-scrollbar pt-1 pb-1" style={{ maxHeight: '320px' }}>

                {groupDocs.length === 0 ? (
                  <div className="px-3 py-3 text-[13px] text-[var(--color-text-muted)] italic text-center opacity-70">Folder is empty</div>
                ) : (
                  groupDocs.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className="group relative flex items-center justify-between px-3 py-[6px] rounded-md cursor-pointer transition-colors hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] shrink-0"
                      onClick={(e) => {
                        handleDocClick(e, doc.id);
                        setPreviewHoverGroupId(null);
                        setPreviewHoverDocId(null);
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        clearTimeout(hoverTimeoutRef.current);
                        if (doc.isLocked) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        hoverTimeoutRef.current = setTimeout(() => {
                          setPreviewPos({ top: rect.top, left: rect.right + 16 });
                          setPreviewHoverDocId(doc.id);
                        }, 600);
                      }}
                      onMouseLeave={() => {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = setTimeout(() => {
                          setPreviewHoverDocId(null);
                        }, 300);
                      }}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden">
                        <div className="text-base flex-shrink-0 leading-none select-none flex items-center justify-center w-5 h-5">
                          {doc.isLocked ? (
                            <Lock size={16} className="text-[var(--color-icon-muted)]" />
                          ) : doc.emoji ? (
                            <span className="inline-block leading-none">{doc.emoji}</span>
                          ) : (
                            <FileText size={16} className="text-[var(--color-icon-muted)]" strokeWidth={1.5} />
                          )}
                        </div>
                        <span className="text-[13px] font-medium w-full truncate select-none">
                          {doc.title || "Untitled"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
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
          className="words-context-menu fixed z-[60] bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-xl rounded-lg py-1 w-44 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x + 4}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setEditingDocId(contextMenu.docId);
              setEditingDocTitle(docs.find(d => d.id === contextMenu.docId)?.title || "");
              setContextMenu(null);
            }}
          >
            <Pencil size={14} /> Rename
          </button>
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
          <button
            className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            onClick={() => handleDuplicateDoc(contextMenu.docId)}
          >
            <Copy size={14} /> Duplicate
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
        <div className="fixed bottom-6 right-6 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl p-4 w-80 z-[90] animate-slide-in-right">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-sm text-[var(--color-text-primary)] flex items-center gap-2">
              <Cloud size={16} className="text-[var(--color-text-faint)]" /> Back up your data
            </h3>
            <button
              onClick={() => {
                setShowSyncSuggestion(false);
                localStorage.setItem('words_dismissed_sync', 'true');
              }}
              className="text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">
            You've created a few documents! Consider enabling Cloud Sync so you don't lose your work.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowSyncSuggestion(false);
                setAuthModal('login');
              }}
              className="flex-1 py-1.5 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-md text-xs font-medium transition-opacity hover:opacity-90"
            >
              Enable Sync
            </button>
            <button
              onClick={() => {
                setShowSyncSuggestion(false);
                localStorage.setItem('words_dismissed_sync', 'true');
              }}
              className="flex-1 py-1.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-md text-xs font-medium transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Delete Undo Popup */}
      {deletedDocInfo && (
        <div className="fixed bottom-6 right-6 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl p-4 w-72 z-[100] animate-slide-in-right flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
              <Trash2 size={16} className="text-[var(--color-text-faint)]" /> Document Deleted
            </div>
            <button
              onClick={() => { deletedDocInfoRef.current = null; setDeletedDocInfo(null); }}
              className="text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={undoDeleteDoc}
              className="flex-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[var(--color-bg-hover)] transition-colors flex items-center justify-center gap-1.5"
            >
              <Undo2 size={12} /> Undo
            </button>
          </div>
        </div>
      )}

      {/* Custom Share UI Popup */}
      {sharePopupInfo && (
        <div className="fixed bottom-6 right-6 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl p-4 w-80 z-[100] animate-slide-in-right flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
              <Share size={16} className="text-[var(--color-text-faint)]" /> Link Copied
            </div>
            <button
              onClick={() => setSharePopupInfo(null)}
              className="text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] transition-colors mt-1"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              readOnly
              value={sharePopupInfo.url}
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md px-2.5 py-1.5 text-xs text-[var(--color-text-muted)] outline-none selection:bg-[var(--color-border-primary)]"
              onClick={(e) => {
                e.target.select();
                navigator.clipboard.writeText(sharePopupInfo.url);
              }}
            />
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(sharePopupInfo.url);
              }}
              className="flex-shrink-0 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] shadow-sm text-[var(--color-text-primary)] p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] transition-colors"
              title="Copy link"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      )}

      {user && (
        <BuddyWidget 
          isOpen={buddyState.show}
          position={{ x: Math.min(Math.max(buddyState.x || window.innerWidth / 2, 0), window.innerWidth - 380), y: Math.max(buddyState.y || 100, 0) + 16 }}
          onClose={() => setBuddyState(p => ({ ...p, show: false }))}
          onApplyText={handleBuddyApply}
          selectedText={buddyState.selectedText}
          selectedHtml={buddyState.selectedHtml}
          isCollapsedSelection={buddyState.isCollapsed}
          fullDocumentText={editorRef.current?.innerHTML || ""}
          docs={docs}
          activeDocId={activeDocId}
          onGlobalClick={() => {
            const sel = window.getSelection();
            let text = sel.toString();
            let selectedHtml = "";
            let savedRange = null;
            let isCollapsed = true;

            if (editorRef.current && editorRef.current.contains(sel.anchorNode) && text.trim().length > 0) {
               savedRange = sel.getRangeAt(0).cloneRange();
               isCollapsed = false;
               // Capture the selection as HTML so AI knows the full structure (headings, bold, etc.)
               const tmp = document.createElement("div");
               tmp.appendChild(sel.getRangeAt(0).cloneContents());
               selectedHtml = tmp.innerHTML;
            } else {
               text = "GLOBAL_CHAT";
            }

            setBuddyState({
              show: true,
              x: window.innerWidth - 380 - 45,
              y: window.innerHeight - 200,
              savedRange,
              selectedText: text,
              selectedHtml,
              isCollapsed,
            });
          }}
        />
      )}
    </div>
  );
}
