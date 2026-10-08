'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

// ── Estrella fugaz ──
const FUGAZ_SPEED    = 220;  // mucho más rápida que un asteroide normal
const FUGAZ_TTL      = 6;    // segundos antes de desvanecerse
const FUGAZ_POINTS   = 150;  // recompensa al destruirla
const FUGAZ_INTERVAL = 15;   // segundos entre apariciones
const FUGAZ_MAX      = 1;    // máximo simultáneo en pantalla

class Asteroid {
  constructor(x, y, size = 3, opts = {}) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;
    this.fugaz = !!opts.fugaz;

    const angle = rand(0, Math.PI * 2);
    const speed = this.fugaz
      ? FUGAZ_SPEED + rand(-20, 20)
      : SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);
    this.ttl  = this.fugaz ? FUGAZ_TTL : Infinity;
    this.life = this.ttl;

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    if (this.fugaz) {
      this.ttl -= dt;
      if (this.ttl <= 0) this.dead = true;
    }
  }

  split() {
    // La estrella fugaz se parte en 2 asteroides normales pequeños
    if (this.fugaz) return [
      new Asteroid(this.x, this.y, 1),
      new Asteroid(this.x, this.y, 1),
    ];
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    // Parpadeo de aviso antes de desvanecerse
    if (this.fugaz && this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.fugaz ? '#ffd34d' : '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    // Estela de velocidad
    if (this.fugaz) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 211, 77, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 0.12, this.y - this.vy * 0.12);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ── Skins de nave ───────────────────────────────────────────────────────────────
const SKIN_KEY = 'asteroids-skin';
let currentSkin = 0;

const SKINS = [
  {
    id: 'clasica',
    nombre: 'CLÁSICA',
    color: '#fff',
    dibujar() {
      ctx.beginPath();
      ctx.moveTo( 20,  0);   // nariz
      ctx.lineTo(-12, -9);   // ala izquierda
      ctx.lineTo( -7,  0);   // muesca trasera
      ctx.lineTo(-12,  9);   // ala derecha
      ctx.closePath();
      ctx.stroke();
    },
  },
  {
    id: 'interceptor',
    nombre: 'INTERCEPTOR',
    color: '#4dd2ff',
    dibujar() {
      // Dardo alargado y afilado
      ctx.beginPath();
      ctx.moveTo( 24,  0);   // nariz larga
      ctx.lineTo( -6, -6);   // toma izquierda
      ctx.lineTo(-14, -12);   // ala izquierda
      ctx.lineTo( -8,  0);   // muesca trasera
      ctx.lineTo(-14,  12);   // ala derecha
      ctx.lineTo( -6,  6);
      ctx.closePath();
      ctx.stroke();
    },
  },
  {
    id: 'pesada',
    nombre: 'PESADA',
    color: '#ffb347',
    dibujar() {
      // Casco ancho de doble ala
      ctx.beginPath();
      ctx.moveTo( 16,  0);   // nariz corta
      ctx.lineTo(  2, -6);
      ctx.lineTo(-14, -13);   // ala superior
      ctx.lineTo(-10, -4);
      ctx.lineTo( -6,  0);   // muesca trasera
      ctx.lineTo(-10,  4);
      ctx.lineTo(-14,  13);   // ala inferior
      ctx.lineTo(  2,  6);
      ctx.closePath();
      ctx.stroke();
    },
  },
];

function cargarSkin() {
  try {
    const i = parseInt(localStorage.getItem(SKIN_KEY), 10);
    if (Number.isInteger(i) && i >= 0 && i < SKINS.length) currentSkin = i;
  } catch (e) { /* almacenamiento no disponible: usa clásica */ }
}

function guardarSkin() {
  try {
    localStorage.setItem(SKIN_KEY, String(currentSkin));
  } catch (e) { /* ignorar: sigue en memoria */ }
}

function cicloSkin() {
  currentSkin = (currentSkin + 1) % SKINS.length;
  guardarSkin();
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.tripleShot    = 0;
    this.shield        = 0;
    this.dead          = false;
  }

  // Protegido contra asteroides y futuros proyectiles enemigos
  isProtected() { return this.shield > 0; }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost   > 0) this.speedBoost    -= dt;
    if (this.tripleShot   > 0) this.tripleShot    -= dt;
    if (this.shield       > 0) this.shield        -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;
    const MULT = this.speedBoost > 0 ? BOOST_MULT : 1;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * MULT * dt;
      this.vy += Math.sin(this.angle) * THRUST * MULT * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      // Abanico cerrado: centro recto + 2 laterales
      return [
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = SKINS[currentSkin].color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta según skin activa
    SKINS[currentSkin].dibujar();

    // Llama del propulsor (más larga con velocidad activa)
    if (this.thrusting && Math.random() > 0.35) {
      const flame = this.speedBoost > 0 ? rand(12, 26) : rand(6, 14);
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - flame, 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = this.speedBoost > 0
        ? 'rgba(0, 255, 255, 0.9)'
        : 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    // Anillo cian mientras la velocidad está activa
    if (this.speedBoost > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    // Anillo magenta mientras el triple disparo está activo
    if (this.tripleShot > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    // Anillo del escudo mientras protege (temporal puro)
    if (this.shield > 0) {
      const pulse = 0.55 + Math.sin(performance.now() / 150) * 0.2;
      ctx.beginPath();
      ctx.arc(0, 0, this.speedBoost > 0 ? 27 : 22, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(77, 166, 255, ${pulse.toFixed(2)})`;
      ctx.lineWidth   = 2;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-ups (velocidad, triple disparo y escudo) ──────────────────────────────
const BOOST_DURATION = 5;    // segundos de propulsión doble
const BOOST_MULT     = 2;    // multiplicador de empuje
const DROP_CHANCE    = 0.15; // probabilidad de soltar velocidad al romper un asteroide
const POWERUP_TTL    = 8;    // segundos antes de desaparecer si no se recoge

// ── Power-up de triple disparo ──────────────────────────────────────────────────
const TRIPLE_DURATION    = 5;     // segundos de triple disparo
const TRIPLE_SPREAD      = 0.13;  // apertura del abanico en radianes (~7.5°)
const TRIPLE_DROP_CHANCE = 0.08;  // probabilidad de soltar al romper un asteroide
const TRIPLE_COLOR       = '#f0f'; // magenta

// ── Power-up de escudo ──────────────────────────────────────────────────────────
const SHIELD_DURATION    = 6;      // segundos de protección del escudo
const SHIELD_DROP_CHANCE = 0.08;   // probabilidad de soltar escudo al romper un asteroide
const SHIELD_COLOR       = '#4da6ff'; // azul

class PowerUp {
  constructor(x, y, kind = 'speed') {
    this.x = x;
    this.y = y;
    this.kind = kind; // 'speed' | 'triple' | 'shield'
    const angle = rand(0, Math.PI * 2);
    const speed = 15;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 10;
    this.ttl  = POWERUP_TTL;
    this.dead = false;
    this.pulse = rand(0, Math.PI * 2);
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.pulse += dt * 4;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const r = this.radius + Math.sin(this.pulse) * 1.5;
    const color = this.kind === 'triple' ? TRIPLE_COLOR
      : this.kind === 'shield' ? SHIELD_COLOR
      : '#0ff';
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    // Círculo pulsante
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    if (this.kind === 'shield') {
      // Hexágono de escudo
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * 5;
        const py = Math.sin(a) * 5;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (this.kind === 'triple') {
      // Tres puntos "∴" = triple disparo
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -4, 1.8, 0, Math.PI * 2);
      ctx.arc(-3.5, 3, 1.8, 0, Math.PI * 2);
      ctx.arc(3.5, 3, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Doble chevrón ">>"
      ctx.beginPath();
      ctx.moveTo(-4, -5);
      ctx.lineTo(0, 0);
      ctx.lineTo(-4, 5);
      ctx.moveTo(1, -5);
      ctx.lineTo(5, 0);
      ctx.lineTo(1, 5);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let fugazTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnFugaz() {
  // Aparece en un borde aleatorio para cruzar la pantalla
  const edge = randInt(0, 3);
  let x, y;
  if (edge === 0)      { x = rand(0, W); y = 0; }
  else if (edge === 1) { x = W; y = rand(0, H); }
  else if (edge === 2) { x = rand(0, W); y = H; }
  else                 { x = 0; y = rand(0, H); }
  asteroids.push(new Asteroid(x, y, 1, { fugaz: true }));
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  fugazTimer = 8;
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  fugazTimer = FUGAZ_INTERVAL;
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  // Cambiar skin de la nave
  if (pressed('KeyC')) cicloSkin();

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);

  // Aparición periódica de la estrella fugaz
  fugazTimer -= dt;
  if (fugazTimer <= 0) {
    fugazTimer = FUGAZ_INTERVAL + rand(-3, 3);
    const fugaces = asteroids.filter(a => a.fugaz && !a.dead).length;
    if (fugaces < FUGAZ_MAX) spawnFugaz();
  }

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        if (a.fugaz) {
          // La fugaz da más puntos y se parte en 2 asteroides normales
          // (sin soltar power-up directamente)
          score += FUGAZ_POINTS;
          explode(a.x, a.y, 10);
          newAsteroids.push(...a.split());
        } else {
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (Math.random() < DROP_CHANCE) powerups.push(new PowerUp(a.x, a.y, 'speed'));
          if (Math.random() < SHIELD_DROP_CHANCE) powerups.push(new PowerUp(a.x, a.y, 'shield'));
          if (Math.random() < TRIPLE_DROP_CHANCE) powerups.push(new PowerUp(a.x, a.y, 'triple'));
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs power-up: velocidad, triple disparo o escudo según kind
  if (!ship.dead) {
    for (const p of powerups) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        if (p.kind === 'shield') ship.shield = SHIELD_DURATION;
        else if (p.kind === 'triple') ship.tripleShot = TRIPLE_DURATION;
        else ship.speedBoost = BOOST_DURATION;
        explode(ship.x, ship.y, 4);
      }
    }
    powerups = powerups.filter(p => !p.dead);
  }

  // Nave vs asteroide
  // Con escudo: el asteroide se destruye (con puntos y división) sin matar la nave.
  // Punto de extensión: futuros proyectiles enemigos usarán ship.isProtected() igual.
  if (ship.invincible <= 0 && !ship.dead) {
    const shielded = ship.isProtected();
    const shieldHits = [];
    for (const a of asteroids) {
      if (!a.dead && dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (shielded) {
          shieldHits.push(a);
        } else {
          killShip();
          break;
        }
      }
    }
    if (shielded && shieldHits.length > 0) {
      for (const a of shieldHits) {
        a.dead = true;
        score += a.fugaz ? FUGAZ_POINTS : POINTS[a.size];
        explode(a.x, a.y, a.fugaz ? 10 : a.size * 5);
        newAsteroids.push(...a.split());
        if (!a.fugaz) {
          if (Math.random() < DROP_CHANCE) powerups.push(new PowerUp(a.x, a.y, 'speed'));
          if (Math.random() < SHIELD_DROP_CHANCE) powerups.push(new PowerUp(a.x, a.y, 'shield'));
          if (Math.random() < TRIPLE_DROP_CHANCE) powerups.push(new PowerUp(a.x, a.y, 'triple'));
        }
      }
      asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
      explode(ship.x, ship.y, 4);
    }
  }

  // Nivel completado (las fugaces no bloquean el avance)
  if (!asteroids.some(a => !a.fugaz)) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = color || '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18, SKINS[currentSkin].color);

  // Indicador de skin activa
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '11px monospace';
  ctx.fillText(`NAVE: ${SKINS[currentSkin].nombre}  (C PARA CAMBIAR)`, 14, H - 12);
  ctx.font = '15px monospace';

  // Barras de efectos activos: pila dinámica (solo activos, en orden)
  const effects = [];
  if (ship && ship.speedBoost > 0) effects.push({
    label: `VELOCIDAD x2  ${Math.max(0, ship.speedBoost).toFixed(1)}s`,
    frac: Math.min(1, Math.max(0, ship.speedBoost / BOOST_DURATION)),
    color: '#0ff',
    bg: 'rgba(0, 255, 255, 0.15)',
  });
  if (ship && ship.tripleShot > 0) effects.push({
    label: `TRIPLE x3  ${Math.max(0, ship.tripleShot).toFixed(1)}s`,
    frac: Math.min(1, Math.max(0, ship.tripleShot / TRIPLE_DURATION)),
    color: TRIPLE_COLOR,
    bg: 'rgba(255, 0, 255, 0.15)',
  });
  if (ship && ship.shield > 0) effects.push({
    label: `ESCUDO  ${Math.max(0, ship.shield).toFixed(1)}s`,
    frac: Math.min(1, Math.max(0, ship.shield / SHIELD_DURATION)),
    color: SHIELD_COLOR,
    bg: 'rgba(77, 166, 255, 0.15)',
  });
  effects.forEach((ef, i) => {
    const LABEL_Y = 46 + i * 26;
    const BAR_Y = LABEL_Y + 6;
    const BAR_W = 120;
    const BAR_H = 6;
    const BAR_X = W / 2 - BAR_W / 2;
    ctx.fillStyle = ef.color;
    ctx.fillText(ef.label, W / 2, LABEL_Y);
    // Fondo
    ctx.fillStyle = ef.bg;
    ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);
    // Relleno (se vacía de derecha a izquierda)
    ctx.fillStyle = ef.color;
    ctx.fillRect(BAR_X, BAR_Y, BAR_W * ef.frac, BAR_H);
    // Borde
    ctx.strokeStyle = ef.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(BAR_X + 0.5, BAR_Y + 0.5, BAR_W - 1, BAR_H - 1);
    ctx.fillStyle = '#fff';
  });

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

cargarSkin();
initGame();
requestAnimationFrame(loop);
