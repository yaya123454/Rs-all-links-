// ── PALETTE / CHANNELS ───────────────────────────────────────────

const CHANNELS = [
  { ch:  1, name: 'Instagram',   hex: '#ff32ee', r:26,  g:24,  b:20,  desc:'My Instagram here', url: 'https://www.instagram.com/rayen_shim' },
  { ch:  2, name: 'Béhance', hex: '#4b9cff', r:46,  g:61,  b:79,  desc:'My Béhance here', url:'https://www.behance.net/rayenrayenRS' },
  { ch:  3, name: 'My website', hex: '#1FDDFF', r:107, g:127, b:142, desc:'My My website here',url:'https://www.behance.net/rayenrayenRS' },
  { ch:  4, name: 'kick',  hex: '#38f708', r:74,  g:94,  b:69,  desc:'My kick here',url:'https://kick.com/t-rextn' },
  { ch:  5, name: 'Discord',  hex: '#738ADB', r:143, g:175, b:194, desc:'My Discord here',url:'https://discord.gg/Bu4rsBDV' },
  ];

// ── CANVAS SETUP ─────────────────────────────────────────────────
const tvScreen = document.getElementById('tvScreen');
const canvas   = document.getElementById('screen');
const ctx      = canvas.getContext('2d');
const glow     = document.getElementById('glow');

let CW, CH;
function resizeCanvas() {
  const rect = tvScreen.getBoundingClientRect();
  CW = canvas.width  = rect.width;
  CH = canvas.height = rect.height;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── STATE ─────────────────────────────────────────────────────────
let currentCh   = 0;
let staticNoise  = null;
let noiseAge     = 0;
let staticBurst  = 0;
let switching    = false;
let scanOffset   = 0;
let glitchTimer  = 0;
let ticker       = 0;

let currentTextArea = null; // 🔥 ADDED

// ── BUILD CHANNEL BUTTONS ─────────────────────────────────────────
const strip = document.getElementById('channelStrip');
CHANNELS.forEach((ch, i) => {
  const btn = document.createElement('button');
  btn.className = 'ch-btn' + (i === 0 ? ' active' : '');
  btn.textContent = String(ch.ch).padStart(2, '0');
  btn.style.setProperty('--ch-color', ch.hex);
  btn.addEventListener('click', () => switchTo(i));
  strip.appendChild(btn);
});

function updateButtons(idx) {
  document.querySelectorAll('.ch-btn').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });
}

// ── PHOSPHOR GLOW ─────────────────────────────────────────────────
function setGlow(ch) {
  const { r, g, b } = ch;
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  const a = 0.25 + brightness * 0.3;
  glow.style.boxShadow = `
    0 0 18px rgba(${r},${g},${b},${a}),
    0 0 45px rgba(${r},${g},${b},${a * 0.6}),
    0 0 90px rgba(${r},${g},${b},${a * 0.3})
  `;
}

// ── NOISE BUFFER ──────────────────────────────────────────────────
function makeNoiseBuffer() {
  const off = document.createElement('canvas');
  off.width = CW; off.height = CH;
  const oc = off.getContext('2d');
  const id = oc.createImageData(CW, CH);
  const d  = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() * 255 | 0;
    d[i] = d[i+1] = d[i+2] = v;
    d[i+3] = 255;
  }
  oc.putImageData(id, 0, 0);
  return off;
}

// ── DRAW SCREEN ───────────────────────────────────────────────────
function drawScreen(ch, staticAlpha) {
  const { r, g, b, hex, name, desc, ch: chNum } = ch;
  ticker++;

  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, CW, CH);

  const vg = ctx.createRadialGradient(CW/2, CH/2, CH*0.1, CW/2, CH/2, CH*0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, CW, CH);

  const luma = (r*0.299 + g*0.587 + b*0.114) / 255;

  const textLight = `rgba(0, 0, 0, 0.92)`;
  const textDark  = `rgba(255, 255, 255, 0.8)`;
  const mainColor = luma < 0.45 ? textLight : textDark;

  ctx.font = `bold ${CW * 0.075}px 'VT323', monospace`;
  ctx.textAlign = 'left';
  ctx.fillStyle = `rgba(0,0,0,0.2)`;
  ctx.fillText(`CH ${String(chNum).padStart(2, '0')}`, CW*0.05 + 1, CW*0.1 + 1);
  ctx.fillStyle = mainColor.replace('0.92','0.15').replace('0.80','0.12');
  ctx.fillText(`CH ${String(chNum).padStart(2, '0')}`, CW*0.05, CW*0.1);

  const nameSize = CW * 0.155;
  ctx.font = `${nameSize}px 'VT323', monospace`;
  ctx.textAlign = 'center';

  const textX = CW/2;
  const textY = CH/2 + nameSize*0.34;

  // 🔥 ADDED (calculate clickable area)
  const textWidth = ctx.measureText(name.toUpperCase()).width;
  currentTextArea = {
    x: textX - textWidth / 2,
    y: textY - nameSize,
    width: textWidth,
    height: nameSize
  };

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillText(name.toUpperCase(), textX + 2, textY + 2);
  ctx.fillStyle = mainColor;
  ctx.fillText(name.toUpperCase(), textX, textY);
}

// ── SWITCH CHANNEL ────────────────────────────────────────────────
function switchTo(idx) {
  if (switching) return;
  switching    = true;
  currentCh    = ((idx % CHANNELS.length) + CHANNELS.length) % CHANNELS.length;
  staticBurst  = 1.0;

  updateButtons(currentCh);
  setGlow(CHANNELS[currentCh]);

  tvScreen.classList.add('switching');
  setTimeout(() => {
    tvScreen.classList.remove('switching');
    switching = false;
  }, 500);
}

function next() { switchTo(currentCh + 1); }
function prev() { switchTo(currentCh - 1); }

// ── INPUT ─────────────────────────────────────────────────────────
document.getElementById('nextKnob').addEventListener('click', next);
document.getElementById('prevKnob').addEventListener('click', prev);

// 🔥 REPLACED your tvScreen click with this safe version
tvScreen.addEventListener('click', function(e) {

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const channel = CHANNELS[currentCh];

  // If clicking exactly on text and it has URL → open link
  if (
    currentTextArea &&
    mouseX >= currentTextArea.x &&
    mouseX <= currentTextArea.x + currentTextArea.width &&
    mouseY >= currentTextArea.y &&
    mouseY <= currentTextArea.y + currentTextArea.height &&
    channel.url
  ) {
    window.open(channel.url, "_blank");
    return;
  }

  // Otherwise keep original behavior
  next();
});

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown')                { e.preventDefault(); prev(); }
  const n = parseInt(e.key);
  if (!isNaN(n) && n >= 1 && n <= 9) switchTo(n - 1);
  if (e.key === '0') switchTo(9);
});

let autoTimer = setInterval(next, 6000);
tvScreen.addEventListener('click', () => {
  clearInterval(autoTimer);
  autoTimer = setInterval(next, 8000);
});

// ── RENDER LOOP ───────────────────────────────────────────────────
setGlow(CHANNELS[currentCh]);

function loop() {
  staticBurst = staticBurst > 0.01 ? staticBurst * 0.82 : 0;
  drawScreen(CHANNELS[currentCh], staticBurst);
  requestAnimationFrame(loop);
}

loop();
