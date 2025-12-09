// Asteroids game with "press any key to start" overlay logic.
// Assumes the HTML elements from your snippet exist.

const canvas = document.getElementById('asteroids-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('start-overlay-asteroids');
const gameOverEl = document.getElementById('game-over-ast');
const restartBtn = document.getElementById('restart-ast');

let keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function rand(min,max){ return Math.random()*(max-min)+min; }
function wrapPos(p){
  if(p.x<0) p.x+=W; if(p.x>W) p.x-=W;
  if(p.y<0) p.y+=H; if(p.y>H) p.y-=H;
}

const WRAP_OFFSETS = [
  [0,0], [-W,0], [W,0], [0,-H], [0,H],
  [-W,-H], [W,-H], [-W,H], [W,H]
];
/* ---------- Game classes (Ship, Bullet, Asteroid) ---------- */

class Ship {
  constructor(){
    this.reset();
  }
  reset(){
    this.pos = {x: W/2, y: H/2};
    this.vel = {x:0,y:0};
    this.angle = -Math.PI/2;
    this.radius = 10;
    this.respawnInvul = 0;
  }
  update(dt){
    if(keys['ArrowLeft']) this.angle -= 4*dt;
    if(keys['ArrowRight']) this.angle += 4*dt;
    if(keys['ArrowUp']){
      const thrust = 200*dt;
      this.vel.x += Math.cos(this.angle)*thrust;
      this.vel.y += Math.sin(this.angle)*thrust;
    }
    this.vel.x *= Math.pow(0.99, dt*60);
    this.vel.y *= Math.pow(0.99, dt*60);
    this.pos.x += this.vel.x*dt;
    this.pos.y += this.vel.y*dt;
    wrapPos(this.pos);
    if(this.respawnInvul>0) this.respawnInvul -= dt;
  }
  draw(){
    for(const o of WRAP_OFFSETS){
      ctx.save();
      ctx.translate(this.pos.x + o[0], this.pos.y + o[1]);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(15,0); ctx.lineTo(-10,8); ctx.lineTo(-6,0); ctx.lineTo(-10,-8); ctx.closePath();
      ctx.strokeStyle = 'white'; ctx.stroke();
      // draw thrust flame if thrusting
      if(keys['ArrowUp']){
        ctx.beginPath();
        ctx.moveTo(-6,0);
        ctx.lineTo(-14,5);
        ctx.lineTo(-14,-5);
        ctx.closePath();
        ctx.strokeStyle = 'orange';
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

class Bullet {
  constructor(x,y,angle){
    this.pos={x,y}; this.vel={x:Math.cos(angle)*500, y:Math.sin(angle)*500};
    this.life=1.0; this.radius=2;
  }
  update(dt){ this.pos.x+=this.vel.x*dt; this.pos.y+=this.vel.y*dt; wrapPos(this.pos); this.life-=dt; }
  draw(){
    ctx.fillStyle='white';
    for(const o of WRAP_OFFSETS){
      ctx.beginPath(); ctx.arc(this.pos.x + o[0], this.pos.y + o[1], this.radius,0,Math.PI*2); ctx.fill();
    }
  }
}

class Asteroid {
  constructor(x,y,size){
    this.pos={x,y}; this.size=size;
    const speed = 20 + (4-size)*15 + rand(-5,5);
    const ang = rand(0,Math.PI*2);
    this.vel={x:Math.cos(ang)*speed, y:Math.sin(ang)*speed};
    this.radius = [0,15,30,50][size];
    this.rotation = rand(-0.12,0.12);
    this.angle = rand(0,Math.PI*2);
    this.verts = [];
    for(let i=0;i<8;i++) this.verts.push(0.8 + rand(0,0.4));
  }
  update(dt){ this.pos.x+=this.vel.x*dt; this.pos.y+=this.vel.y*dt; this.angle+=this.rotation*dt; wrapPos(this.pos); }
  draw(){
    const r = this.radius;
    for(const o of WRAP_OFFSETS){
      ctx.save(); ctx.translate(this.pos.x + o[0], this.pos.y + o[1]); ctx.rotate(this.angle);
      ctx.strokeStyle='white'; ctx.lineWidth=1.2; ctx.lineJoin='round'; ctx.beginPath();
      ctx.moveTo(r*this.verts[0],0);
      for(let i=1;i<8;i++){ const a = i/8*Math.PI*2; ctx.lineTo(Math.cos(a)*r*this.verts[i], Math.sin(a)*r*this.verts[i]); }
      ctx.closePath(); ctx.stroke(); ctx.restore();
    }
  }
}

/* ---------- Game state ---------- */

let ship = new Ship();
let bullets = [];
let asteroids = [];
let score = 0, lives = 3, level = 1;
let lastShot = 0;

let running = false;        // <-- game is frozen until user presses any key
let loopId = null;
let lastTime = 0;

/* ---------- Utility & game functions ---------- */

function spawnLevel(n){
  asteroids = [];
  for(let i=0;i<n;i++){
    let x = Math.random()*W, y = Math.random()*H;
    if(Math.hypot(x-ship.pos.x,y-ship.pos.y) < 100){ x = (x+200)%W; y=(y+200)%H; }
    asteroids.push(new Asteroid(x,y,3));
  }
}

function splitAsteroid(a){
  if(a.size>1){
    for(let i=0;i<2;i++){
      const child = new Asteroid(a.pos.x + rand(-10,10), a.pos.y + rand(-10,10), a.size-1);
      asteroids.push(child);
    }
  }
}

function circleColl(a,b){ return Math.hypot(a.pos.x-b.pos.x, a.pos.y-b.pos.y) < (a.radius + b.radius); }

function resetGame(){
  score = 0; lives = 3; level = 1;
  bullets = [];
  ship = new Ship();
  spawnLevel(4);
  gameOverEl.hidden = true;
  updateUI();
}

/* ---------- Input: start on any key ---------- */

// Start the game when the user presses any key while overlay is visible.
// We listen once and then remove the listener to avoid multiple starts.
function startOnAnyKeyOnce(e){
  // Start immediately
  overlay.classList.add('hidden');
  running = true;
  lastTime = performance.now();
  // begin the loop
  loopId = requestAnimationFrame(gameLoop);
  // remove this listener
  window.removeEventListener('keydown', startOnAnyKeyOnce);
}

// Show overlay and attach the one-time listener
function showStartOverlay(){
  overlay.classList.remove('hidden');
  running = false;
  // ensure any running loop is stopped
  if(loopId) cancelAnimationFrame(loopId);
  window.addEventListener('keydown', startOnAnyKeyOnce);
}

/* ---------- Restart button ---------- */

restartBtn.addEventListener('click', () => {
  resetGame();
  showStartOverlay();
});

/* ---------- UI update ---------- */

function updateUI(){
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  levelEl.textContent = level;
}

/* ---------- Main game loop ---------- */

function gameLoop(now){
  if(!running) return; // safety: do nothing if not running

  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  // firing
  if(keys['Space'] && now - lastShot > 200){
    bullets.push(new Bullet(ship.pos.x + Math.cos(ship.angle)*15, ship.pos.y + Math.sin(ship.angle)*15, ship.angle));
    lastShot = now;
  }

  ship.update(dt);
  bullets.forEach(b=>b.update(dt));
  bullets = bullets.filter(b=>b.life>0);
  asteroids.forEach(a=>a.update(dt));

  // bullet-asteroid collisions
  for(let i=bullets.length-1;i>=0;i--){
    for(let j=asteroids.length-1;j>=0;j--){
      if(circleColl(bullets[i], asteroids[j])){
        const size = asteroids[j].size;
        score += (4-size)*20;
        splitAsteroid(asteroids[j]);
        asteroids.splice(j,1);
        bullets.splice(i,1);
        break;
      }
    }
  }

  // ship-asteroid collisions
  if(ship.respawnInvul<=0){
    for(let a of asteroids){
      if(Math.hypot(a.pos.x-ship.pos.x, a.pos.y-ship.pos.y) < a.radius + ship.radius){
        lives--;
        ship = new Ship();
        ship.respawnInvul = 2.0;
        break;
      }
    }
  }

  // level complete
  if(asteroids.length===0){
    level++;
    spawnLevel(3+level);
  }

  updateUI();

  // game over
  if(lives<=0){
    gameOverEl.hidden = false;
    running = false;
    overlay.classList.remove('hidden');
    return;
  }

  // draw
  ctx.clearRect(0,0,W,H);
  ship.draw();
  bullets.forEach(b=>b.draw());
  asteroids.forEach(a=>a.draw());

  loopId = requestAnimationFrame(gameLoop);
}

/* ---------- Initialization ---------- */

// Prepare initial UI and show overlay (game frozen)
resetGame();
showStartOverlay();

// Also allow clicking overlay to start (optional)
overlay.addEventListener('click', () => {
  if(!running){
    overlay.classList.add('hidden');
    running = true;
    lastTime = performance.now();
    loopId = requestAnimationFrame(gameLoop);
    window.removeEventListener('keydown', startOnAnyKeyOnce);
  }
});
