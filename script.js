const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
let cols, drops;

function initMatrix() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  cols  = Math.floor(canvas.width / 16);
  drops = Array(cols).fill(1);
}

function drawMatrix() {
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00ff41';
  ctx.font = '14px Share Tech Mono';

  drops.forEach((y, i) => {
    const ch = Math.random() > 0.5
      ? String.fromCharCode(0x30A0 + Math.random() * 96)
      : String(Math.floor(Math.random() * 2));
    ctx.fillText(ch, i * 16, y * 16);
    if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  });
}

initMatrix();
setInterval(drawMatrix, 50);
window.addEventListener('resize', initMatrix);


let currentMode = 'ascii';

const modeLabels = {
  ascii:  'ASCII — Metin ↔ Kod (karakter sayıları)',
  base64: 'Base64 — Binary veriyi metin olarak temsil eder',
  base32: 'Base32 — Büyük harf alfabe + 2-7 rakamları kullanır',
  binary: 'Binary — Her karakter 8 bitlik ikili sayıya dönüşür'
};

function setMode(mode, btn) {
  currentMode = mode;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('mode-label').textContent = modeLabels[mode];
  document.getElementById('mode-info').textContent = 'Mod: ' + mode.toUpperCase();
  document.getElementById('output').textContent = 'Sonuç burada görünecek...';
  document.getElementById('output').className = 'output-box';
}

function getInput() {
  return document.getElementById('input').value;
}

function setOutput(text, isError = false) {
  const el = document.getElementById('output');
  el.textContent = text;
  el.className = 'output-box ' + (isError ? 'error' : 'success');
}

function base32Encode(str) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '', result = '';

  for (let c of str) {
    bits += c.charCodeAt(0).toString(2).padStart(8, '0');
  }

  while (bits.length % 5) bits += '0';

  for (let i = 0; i < bits.length; i += 5) {
    result += alphabet[parseInt(bits.slice(i, i + 5), 2)];
  }

  while (result.length % 8) result += '=';
  return result;
}

function base32Decode(str) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  str = str.toUpperCase().replace(/=+$/, '');
  let bits = '', result = '';

  for (let c of str) {
    const idx = alphabet.indexOf(c);
    if (idx === -1) throw new Error('Geçersiz Base32 karakter: ' + c);
    bits += idx.toString(2).padStart(5, '0');
  }

  bits = bits.slice(0, Math.floor(bits.length / 8) * 8);

  for (let i = 0; i < bits.length; i += 8) {
    result += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2));
  }

  return result;
}

function encode() {
  const input = getInput();
  if (!input.trim()) { setOutput('Lütfen bir metin gir.', true); return; }

  try {
    let result;

    if (currentMode === 'ascii') {
      result = [...input].map(c => c.charCodeAt(0)).join(' ');
    } else if (currentMode === 'base64') {
      result = btoa(unescape(encodeURIComponent(input)));
    } else if (currentMode === 'base32') {
      result = base32Encode(input);
    } else {
      result = [...input].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    }

    setOutput(result);
  } catch (e) {
    setOutput('Hata: ' + e.message, true);
  }
}

function decode() {
  const input = getInput();
  if (!input.trim()) { setOutput('Lütfen bir kod gir.', true); return; }

  try {
    let result;

    if (currentMode === 'ascii') {
      result = input.trim().split(/\s+/).map(n => String.fromCharCode(parseInt(n))).join('');
    } else if (currentMode === 'base64') {
      result = decodeURIComponent(escape(atob(input.trim())));
    } else if (currentMode === 'base32') {
      result = base32Decode(input.trim());
    } else {
      result = input.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
    }

    setOutput(result);
  } catch (e) {
    setOutput('Hata: Geçersiz format — ' + e.message, true);
  }
}

function clearAll() {
  document.getElementById('input').value = '';
  document.getElementById('output').textContent = 'Sonuç burada görünecek...';
  document.getElementById('output').className = 'output-box';
  document.getElementById('char-count').textContent = '0 karakter';
}

function copyOutput() {
  const text = document.getElementById('output').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = '[ KOPYALANDI ✓ ]';
    setTimeout(() => btn.textContent = '[ KOPYALA ]', 1500);
  });
}

document.getElementById('input').addEventListener('input', function () {
  document.getElementById('char-count').textContent = this.value.length + ' karakter';
});