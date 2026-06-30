const HIDE_DELAY = 500;
const FADE_OUT_MS = 180;
const MIN_THUMB = 28;

const initialized = new WeakSet();

function setup(el) {
  const isWin = el === document.documentElement;

  const track = document.createElement('div');
  Object.assign(track.style, {
    position: 'fixed',
    width: '6px',
    pointerEvents: 'none',
    zIndex: '99999',
  });

  const thumb = document.createElement('div');
  thumb.className = 'csb-thumb';
  Object.assign(thumb.style, {
    position: 'absolute',
    left: '0',
    right: '0',
    borderRadius: '9999px',
    background: 'var(--color-border-primary)',
    opacity: '0',
  });

  track.appendChild(thumb);
  document.body.appendChild(track);

  let hideTimer = null;

  function metrics() {
    if (isWin) {
      return {
        scrollTop: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: window.innerHeight,
        top: 0,
        right: window.innerWidth,
        height: window.innerHeight,
      };
    }
    const r = el.getBoundingClientRect();
    return {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      top: r.top,
      right: r.right,
      height: r.height,
    };
  }

  function reposition() {
    const m = metrics();
    track.style.top    = (m.top + 2) + 'px';
    track.style.right  = (window.innerWidth - m.right + 2) + 'px';
    track.style.height = (m.height - 4) + 'px';
  }

  function moveThumb() {
    const m = metrics();
    if (m.scrollHeight <= m.clientHeight) return;
    const trackH  = m.height - 4;
    const thumbH  = Math.max(MIN_THUMB, (m.clientHeight / m.scrollHeight) * trackH);
    const ratio   = m.scrollTop / (m.scrollHeight - m.clientHeight);
    thumb.style.height    = thumbH + 'px';
    thumb.style.transform = `translateY(${ratio * (trackH - thumbH)}px)`;
  }

  function show() {
    reposition();
    moveThumb();

    thumb.classList.remove('csb-out');
    void thumb.offsetWidth;
    thumb.classList.add('csb-in');

    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      thumb.classList.remove('csb-in');
      void thumb.offsetWidth;
      thumb.classList.add('csb-out');
    }, HIDE_DELAY);
  }

  const target = isWin ? window : el;
  target.addEventListener('scroll', show, { passive: true });
  window.addEventListener('resize', reposition, { passive: true });
}

function onScroll(e) {
  const el = (e.target === document || e.target === window)
    ? document.documentElement
    : e.target;

  if (initialized.has(el)) return;
  if (el.classList?.contains('no-scrollbar')) return;

  const scrollH = isNaN(el.scrollHeight) ? document.documentElement.scrollHeight : el.scrollHeight;
  const clientH = isNaN(el.clientHeight) ? window.innerHeight : el.clientHeight;
  if (scrollH <= clientH) return;

  initialized.add(el);
  setup(el);
}

export function initScrollbar() {
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
}
