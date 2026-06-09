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
  ascii:  'ASCII — Metin ↔ Byte Değerleri (UTF-8)',
  base64: 'Base64 — Binary veriyi metin olarak temsil eder',
  base32: 'Base32 — Büyük harf alfabe + 2-7 rakamları kullanır',
  binary: 'Binary — Her byte 8 bitlik ikili sayıya dönüşür'
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

function stringToBytes(str) {
  return new TextEncoder().encode(str);
}

function bytesToString(bytes) {
  return new TextDecoder().decode(bytes);
}


function base32Encode(bytes) {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  while (bits.length % 5 !== 0) bits += '0';
  let result = '';
  for (let i = 0; i < bits.length; i += 5)
    result += alpha[parseInt(bits.slice(i, i + 5), 2)];
  while (result.length % 8 !== 0) result += '=';
  return result;
}

function base32Decode(str) {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  str = str.toUpperCase().replace(/\s/g, '').replace(/=+$/, '');
  let bits = '';
  for (const c of str) {
    const idx = alpha.indexOf(c);
    if (idx === -1) throw new Error('Geçersiz Base32 karakteri: ' + c);
    bits += idx.toString(2).padStart(5, '0');
  }
  const byteLen = Math.floor(bits.length / 8);
  const bytes = new Uint8Array(byteLen);
  for (let i = 0; i < byteLen; i++)
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  return bytes;
}

function base64Encode(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64Decode(str) {
  str = str.replace(/\s/g, '');
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encode() {
  const input = document.getElementById('input').value;
  if (!input.trim()) { setOutput('Lütfen bir metin gir.', true); return; }
  try {
    const bytes = stringToBytes(input);
    let result;
    if (currentMode === 'ascii') {
      result = Array.from(bytes).join(' ');
    } else if (currentMode === 'base64') {
      result = base64Encode(bytes);
    } else if (currentMode === 'base32') {
      result = base32Encode(bytes);
    } else {
      result = Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join(' ');
    }
    setOutput(result);
  } catch (e) {
    setOutput('Hata: ' + e.message, true);
  }
}

function decode() {
  const input = document.getElementById('input').value.trim();
  if (!input) { setOutput('Lütfen bir kod gir.', true); return; }
  try {
    let bytes;
    if (currentMode === 'ascii') {
      const nums = input.split(/\s+/).map(n => {
        const v = parseInt(n, 10);
        if (isNaN(v) || v < 0 || v > 255) throw new Error('Geçersiz byte değeri: ' + n);
        return v;
      });
      bytes = new Uint8Array(nums);
    } else if (currentMode === 'base64') {
      bytes = base64Decode(input);
    } else if (currentMode === 'base32') {
      bytes = base32Decode(input);
    } else {
      const bins = input.split(/\s+/).map(b => {
        if (!/^[01]{8}$/.test(b)) throw new Error('Her binary grup tam 8 bit olmalı: ' + b);
        return parseInt(b, 2);
      });
      bytes = new Uint8Array(bins);
    }
    setOutput(bytesToString(bytes));
  } catch (e) {
    setOutput('Hata: ' + e.message, true);
  }
}

function setOutput(text, isError = false) {
  const el = document.getElementById('output');
  el.textContent = text;
  el.className = 'output-box ' + (isError ? 'error' : 'success');
}

function clearAll() {
  document.getElementById('input').value = '';
  document.getElementById('output').textContent = 'Sonuç burada görünecek...';
  document.getElementById('output').className = 'output-box';
  document.getElementById('char-count').textContent = '0 karakter';
}

function copyOutput() {
  const text = document.getElementById('output').textContent;
  if (text === 'Sonuç burada görünecek...') return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = '[ KOPYALANDI ✓ ]';
    setTimeout(() => btn.textContent = '[ KOPYALA ]', 1500);
  });
}

document.getElementById('input').addEventListener('input', function () {
  document.getElementById('char-count').textContent = this.value.length + ' karakter';
});