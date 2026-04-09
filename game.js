
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayStartBtn = document.getElementById("overlayStartBtn");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const toast = document.getElementById("toast");

const missionText = document.getElementById("missionText");
const budgetTextValue = document.getElementById("budgetTextValue");
const stressTextValue = document.getElementById("stressTextValue");
const livesTextValue = document.getElementById("livesTextValue");
const agentTextValue = document.getElementById("agentTextValue");
const bossTextValue = document.getElementById("bossTextValue");
const budgetBar = document.getElementById("budgetBar");
const stressBar = document.getElementById("stressBar");
const bossBar = document.getElementById("bossBar");
const budgetBarLabel = document.getElementById("budgetBarLabel");
const stressBarLabel = document.getElementById("stressBarLabel");
const bossBarLabel = document.getElementById("bossBarLabel");

const W = canvas.width;
const H = canvas.height;
const GROUND_Y = 610;
const WORLD_W = 9800;
const GRAVITY = 0.85;

let running = false;
let animationFrame = null;
let cameraX = 0;
let gameTime = 0;
let spawnTimer = 0;
let bossTriggered = false;
let bossDefeated = false;
let georgeSpawned = false;
let georgeTimer = 0;
let screenShake = 0;

const keys = {};
const touchState = { left:false, right:false, jump:false, shoot:false };

const game = {
  budget: 100,
  stress: 0,
  lives: 3,
  mission: "Showing District",
  agentActive: false,
  bullets: [],
  enemyBullets: [],
  enemies: [],
  particles: [],
  pickups: [],
  boss: null,
  waveText: "Advance"
};

const player = {
  x: 120,
  y: GROUND_Y - 84,
  w: 42,
  h: 74,
  vx: 0,
  vy: 0,
  speed: 4.8,
  jumpPower: -16.5,
  onGround: false,
  facing: 1,
  fireCooldown: 0,
  flashUntil: 0,
  hpBlink: false
};

function clamp(n, min, max){ return Math.min(max, Math.max(min, n)); }
function rand(min, max){ return Math.random() * (max - min) + min; }
function now(){ return performance.now(); }

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("visible");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("visible"), 1700);
}

function resetGame() {
  running = false;
  cancelAnimationFrame(animationFrame);
  cameraX = 0;
  gameTime = 0;
  spawnTimer = 0;
  bossTriggered = false;
  bossDefeated = false;
  georgeSpawned = false;
  georgeTimer = 0;
  screenShake = 0;

  game.budget = 100;
  game.stress = 0;
  game.lives = 3;
  game.mission = "Showing District";
  game.agentActive = false;
  game.bullets = [];
  game.enemyBullets = [];
  game.enemies = [];
  game.particles = [];
  game.pickups = [];
  game.boss = null;
  game.waveText = "Advance";

  player.x = 120;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.facing = 1;
  player.fireCooldown = 0;
  player.flashUntil = 0;

  overlay.classList.add("visible");
  updateHud();
  render();
}

function startGame() {
  overlay.classList.remove("visible");
  resetMissionRuntime();
  if (!running) {
    running = true;
    loop();
  }
}

function resetMissionRuntime() {
  cameraX = 0;
  gameTime = 0;
  spawnTimer = 0;
  bossTriggered = false;
  bossDefeated = false;
  georgeSpawned = false;
  georgeTimer = 0;
  screenShake = 0;

  game.bullets = [];
  game.enemyBullets = [];
  game.enemies = [];
  game.particles = [];
  game.pickups = [];
  game.boss = null;

  player.x = 120;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.fireCooldown = 0;
  player.flashUntil = 0;

  game.budget = 100;
  game.stress = 0;
  game.lives = 3;
  game.agentActive = false;
  game.mission = "Showing District";
  game.waveText = "Advance";

  missionText.textContent = game.mission;
  updateHud();
}

function damagePlayer(budgetLoss, stressGain, message) {
  const t = now();
  if (t < player.flashUntil) return;

  player.flashUntil = t + 900;
  game.budget = clamp(game.budget - budgetLoss, 0, 100);
  game.stress = clamp(game.stress + stressGain, 0, 100);
  game.lives = Math.max(0, game.lives - 1);
  screenShake = Math.max(screenShake, 10);
  createBurst(player.x + player.w / 2, player.y + player.h / 2, 16, "#ef4444");

  showToast(message);
  updateHud();

  if (game.lives <= 0 || game.budget <= 0 || game.stress >= 100) {
    loseGame("Deal collapsed under pressure.");
  }
}

function addBudget(v){
  game.budget = clamp(game.budget + v, 0, 100);
  updateHud();
}
function addStress(v){
  game.stress = clamp(game.stress + v, 0, 100);
  updateHud();
}

function shoot() {
  if (player.fireCooldown > 0 || !running) return;
  player.fireCooldown = game.agentActive ? 9 : 13;

  const bullet = {
    x: player.facing === 1 ? player.x + player.w : player.x - 14,
    y: player.y + 30,
    w: game.agentActive ? 18 : 14,
    h: game.agentActive ? 6 : 5,
    vx: player.facing === 1 ? (game.agentActive ? 15 : 11) : (game.agentActive ? -15 : -11),
    damage: game.agentActive ? 18 : 9,
    color: game.agentActive ? "#22c55e" : "#facc15"
  };
  game.bullets.push(bullet);
}

function spawnEnemy(type) {
  const baseX = cameraX + W + rand(100, 360);

  if (type === "flip") {
    game.enemies.push({
      kind: "flip",
      x: baseX,
      y: GROUND_Y - 62,
      w: 56,
      h: 62,
      vx: -3.8,
      health: 22,
      shootCooldown: 0
    });
  } else if (type === "overpriced") {
    game.enemies.push({
      kind: "overpriced",
      x: baseX,
      y: GROUND_Y - 82,
      w: 70,
      h: 82,
      vx: -2.0,
      health: 42,
      shootCooldown: 0
    });
  } else if (type === "drone") {
    game.enemies.push({
      kind: "drone",
      x: baseX,
      y: rand(250, 420),
      w: 54,
      h: 34,
      vx: -3.2,
      health: 24,
      shootCooldown: rand(50, 110)
    });
  } else if (type === "fraudOrb") {
    game.enemies.push({
      kind: "fraudOrb",
      x: baseX,
      y: rand(220, 360),
      w: 44,
      h: 44,
      vx: -2.7,
      health: 28,
      shootCooldown: rand(35, 70)
    });
  }
}

function maybeSpawnEnemies() {
  if (bossTriggered) return;

  spawnTimer -= 1;
  if (spawnTimer > 0) return;

  const progress = player.x / (WORLD_W - 1);
  if (progress < 0.22) {
    spawnEnemy(Math.random() < 0.7 ? "flip" : "overpriced");
    spawnTimer = 48;
  } else if (progress < 0.48) {
    spawnEnemy(Math.random() < 0.5 ? "overpriced" : "drone");
    spawnTimer = 42;
  } else if (progress < 0.72) {
    const r = Math.random();
    spawnEnemy(r < 0.34 ? "flip" : r < 0.68 ? "drone" : "fraudOrb");
    spawnTimer = 36;
  } else {
    const r = Math.random();
    spawnEnemy(r < 0.25 ? "flip" : r < 0.5 ? "overpriced" : r < 0.78 ? "drone" : "fraudOrb");
    spawnTimer = 30;
  }
}

function maybeSpawnGeorge() {
  if (georgeSpawned || game.agentActive) return;
  if (player.x > WORLD_W * 0.70) {
    georgeSpawned = true;
    georgeTimer = 360;
    game.pickups.push({
      kind: "george",
      x: player.x + 380,
      y: GROUND_Y - 110,
      w: 46,
      h: 90,
      vx: -1.2
    });
    showToast("Backup inbound. George is dropping in.");
  }
}

function maybeSpawnBoss() {
  if (bossTriggered) return;
  if (player.x > WORLD_W * 0.90) {
    bossTriggered = true;
    game.mission = "Closing Front";
    missionText.textContent = game.mission;
    showToast("Boss deployed: Closing Machine.");
    game.boss = {
      x: WORLD_W - 560,
      y: GROUND_Y - 230,
      w: 220,
      h: 230,
      vx: -0.8,
      health: 100,
      maxHealth: 100,
      attackTimer: 100,
      phase: 1
    };
    game.waveText = "Boss Fight";
    updateHud();
  }
}

function updatePlayer() {
  player.vx = 0;
  const left = keys["ArrowLeft"] || keys["a"] || keys["A"] || touchState.left;
  const right = keys["ArrowRight"] || keys["d"] || keys["D"] || touchState.right;
  const jump = keys["ArrowUp"] || keys["w"] || keys["W"] || keys[" "] || touchState.jump;
  const fire = keys["j"] || keys["J"] || keys["f"] || keys["F"] || touchState.shoot;

  if (left) {
    player.vx = -player.speed;
    player.facing = -1;
  }
  if (right) {
    player.vx = player.speed;
    player.facing = 1;
  }
  if (jump && player.onGround) {
    player.vy = player.jumpPower;
    player.onGround = false;
  }
  if (fire) shoot();

  player.x += player.vx;
  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y + player.h >= GROUND_Y) {
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  player.x = clamp(player.x, 0, WORLD_W - player.w - 20);

  if (player.fireCooldown > 0) player.fireCooldown -= 1;
}

function updateBullets() {
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    const b = game.bullets[i];
    b.x += b.vx;
    if (b.x < -100 || b.x > WORLD_W + 100) {
      game.bullets.splice(i, 1);
    }
  }

  for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
    const b = game.enemyBullets[i];
    b.x += b.vx;
    b.y += b.vy;

    if (b.kind === "orb") {
      b.vy += 0.05;
    }

    if (b.x < -100 || b.x > WORLD_W + 100 || b.y > H + 200 || b.y < -200) {
      game.enemyBullets.splice(i, 1);
      continue;
    }

    if (rectsOverlap(player, b)) {
      damagePlayer(b.damage, b.stress, b.label);
      game.enemyBullets.splice(i, 1);
    }
  }
}

function updateEnemies() {
  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const e = game.enemies[i];
    e.x += e.vx;

    if (e.kind === "flip" || e.kind === "overpriced") {
      e.y = GROUND_Y - e.h;
    }

    if (e.kind === "drone") {
      e.y += Math.sin((gameTime + e.x) * 0.05) * 1.1;
      e.shootCooldown -= 1;
      if (e.shootCooldown <= 0) {
        e.shootCooldown = rand(80, 130);
        game.enemyBullets.push({
          x: e.x,
          y: e.y + e.h / 2,
          w: 12,
          h: 6,
          vx: -7,
          vy: 0,
          damage: 8,
          stress: 10,
          label: "Appraisal drone tagged you."
        });
      }
    }

    if (e.kind === "fraudOrb") {
      e.shootCooldown -= 1;
      if (e.shootCooldown <= 0) {
        e.shootCooldown = rand(55, 95);
        game.enemyBullets.push({
          kind: "orb",
          x: e.x + 8,
          y: e.y + e.h / 2,
          w: 14,
          h: 14,
          vx: -6.5,
          vy: rand(-1.8, 0.5),
          damage: 10,
          stress: 12,
          label: "Wire fraud fire got through."
        });
      }
    }

    if (e.x + e.w < cameraX - 120) {
      game.enemies.splice(i, 1);
      continue;
    }

    if (rectsOverlap(player, e)) {
      damagePlayer(e.kind === "overpriced" ? 15 : 10, e.kind === "fraudOrb" ? 16 : 10, `${enemyName(e.kind)} hit you.`);
      game.enemies.splice(i, 1);
      continue;
    }

    for (let j = game.bullets.length - 1; j >= 0; j--) {
      const b = game.bullets[j];
      if (rectsOverlap(b, e)) {
        e.health -= b.damage;
        createBurst(b.x, b.y, 6, b.color);
        game.bullets.splice(j, 1);
        if (e.health <= 0) {
          createBurst(e.x + e.w / 2, e.y + e.h / 2, 14, "#f59e0b");
          addBudget(2);
          addStress(-2);
          if (Math.random() < 0.15) {
            game.pickups.push({
              kind: "medal",
              x: e.x,
              y: e.y,
              w: 18,
              h: 18,
              vx: -1.5
            });
          }
          game.enemies.splice(i, 1);
        }
        break;
      }
    }
  }
}

function updatePickups() {
  for (let i = game.pickups.length - 1; i >= 0; i--) {
    const p = game.pickups[i];
    p.x += p.vx || 0;

    if (p.kind === "george") {
      if (p.y + p.h < GROUND_Y) {
        p.y += 2.1;
      } else {
        p.y = GROUND_Y - p.h;
      }
    }

    if (rectsOverlap(player, p)) {
      if (p.kind === "medal") {
        addBudget(4);
        addStress(-4);
        showToast("Leverage picked up.");
      } else if (p.kind === "george") {
        game.agentActive = true;
        addBudget(12);
        addStress(-18);
        showToast("George activated: assist mode online.");
      }
      game.pickups.splice(i, 1);
    }
  }
}

function updateBoss() {
  const boss = game.boss;
  if (!boss) return;

  boss.x += boss.vx;
  if (boss.x < WORLD_W - 860) boss.vx = 0;

  boss.attackTimer -= 1;
  if (boss.attackTimer <= 0) {
    if (boss.health > 55) {
      boss.attackTimer = 80;
      for (let i = 0; i < 3; i++) {
        game.enemyBullets.push({
          x: boss.x + 20,
          y: boss.y + 80 + i * 35,
          w: 16,
          h: 8,
          vx: -7.5,
          vy: i === 0 ? -1 : i === 2 ? 1 : 0,
          damage: 11,
          stress: 12,
          label: "Closing cannon clipped you."
        });
      }
    } else {
      boss.attackTimer = 62;
      for (let i = 0; i < 5; i++) {
        game.enemyBullets.push({
          kind: "orb",
          x: boss.x + 30,
          y: boss.y + 80 + i * 24,
          w: 14,
          h: 14,
          vx: -7.5,
          vy: -2 + i * 0.9,
          damage: 12,
          stress: 14,
          label: "Wire fraud barrage hit you."
        });
      }
      if (boss.phase === 1) {
        boss.phase = 2;
        showToast("Boss phase 2: fraud barrage.");
      }
    }
  }

  if (rectsOverlap(player, boss)) {
    damagePlayer(18, 18, "The closing machine crushed your leverage.");
  }

  for (let i = game.bullets.length - 1; i >= 0; i--) {
    const b = game.bullets[i];
    if (rectsOverlap(b, boss)) {
      const actualDamage = game.agentActive ? b.damage : Math.max(1, Math.floor(b.damage * 0.12));
      boss.health = clamp(boss.health - actualDamage, 0, boss.maxHealth);
      createBurst(b.x, b.y, 10, game.agentActive ? "#22c55e" : "#f59e0b");
      game.bullets.splice(i, 1);
      if (!game.agentActive) {
        showToast("You need George to crack the boss armor.");
      }
      if (boss.health <= 0) {
        bossDefeated = true;
        createBurst(boss.x + boss.w / 2, boss.y + boss.h / 2, 40, "#a855f7");
        game.boss = null;
        winGame();
        return;
      }
    }
  }
}

function updateParticles() {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    p.vy += 0.04;
    if (p.life <= 0) game.particles.splice(i, 1);
  }
}

function createBurst(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    game.particles.push({
      x, y,
      vx: rand(-3.4, 3.4),
      vy: rand(-3.5, 2.2),
      life: rand(20, 40),
      color
    });
  }
}

function enemyName(kind) {
  switch (kind) {
    case "flip": return "Lipstick flip";
    case "overpriced": return "Overpriced listing";
    case "drone": return "Appraisal drone";
    case "fraudOrb": return "Wire fraud orb";
    default: return "Hazard";
  }
}

function updateHud() {
  budgetTextValue.textContent = Math.round(game.budget);
  stressTextValue.textContent = Math.round(game.stress);
  livesTextValue.textContent = game.lives;
  agentTextValue.textContent = game.agentActive ? "Online" : "Offline";
  bossTextValue.textContent = game.boss ? `${Math.round(game.boss.health)}% armor` : (bossTriggered ? "Destroyed" : "Not deployed");

  budgetBar.style.width = `${game.budget}%`;
  stressBar.style.width = `${game.stress}%`;
  budgetBarLabel.textContent = `${Math.round(game.budget)} / 100`;
  stressBarLabel.textContent = `${Math.round(game.stress)} / 100`;

  if (game.boss) {
    const pct = (game.boss.health / game.boss.maxHealth) * 100;
    bossBar.style.width = `${pct}%`;
    bossBarLabel.textContent = `${Math.round(game.boss.health)} / ${game.boss.maxHealth}`;
  } else {
    bossBar.style.width = bossTriggered || bossDefeated ? "0%" : "0%";
    bossBarLabel.textContent = bossTriggered && !bossDefeated ? "0 / 100" : "0 / 100";
  }
}

function loseGame(message) {
  running = false;
  cancelAnimationFrame(animationFrame);
  overlay.classList.add("visible");
  overlay.querySelector(".overlay-card").innerHTML = `
    <div class="eyebrow">MISSION FAILED</div>
    <h2>Deal blown up.</h2>
    <p>${message}</p>
    <p>You ran out of budget, took on too much stress, or lost all your lives before closing.</p>
    <div class="overlay-actions">
      <button id="retryBtn" class="btn">Retry Mission</button>
    </div>
  `;
  document.getElementById("retryBtn").addEventListener("click", () => {
    restoreStartOverlay();
    startGame();
  });
}

function winGame() {
  running = false;
  cancelAnimationFrame(animationFrame);
  overlay.classList.add("visible");
  overlay.querySelector(".overlay-card").innerHTML = `
    <div class="eyebrow">MISSION COMPLETE</div>
    <h2>Closing secured.</h2>
    <p>You survived the housing warzone and beat the closing machine.</p>
    <p><strong>Budget:</strong> ${Math.round(game.budget)} &nbsp; <strong>Stress:</strong> ${Math.round(game.stress)} &nbsp; <strong>Agent Assist:</strong> ${game.agentActive ? "Activated" : "Missing"}</p>
    <div class="overlay-actions">
      <button id="replayBtn" class="btn">Replay</button>
    </div>
  `;
  document.getElementById("replayBtn").addEventListener("click", () => {
    restoreStartOverlay();
    startGame();
  });
}

function restoreStartOverlay() {
  overlay.innerHTML = `
    <div class="overlay-card">
      <div class="eyebrow">MISSION START</div>
      <h2>THE HOME BATTLE: BUYER BEWARE</h2>
      <p>
        This is a fresh run-and-gun build inspired by arcade side-scrollers.
        Fight your way through a chaotic housing market. George is the required
        power-up. Get him, or the deal dies at the boss.
      </p>
      <div class="overlay-actions">
        <button id="overlayStartBtn" class="btn">Deploy</button>
      </div>
    </div>
  `;
  overlay.querySelector("#overlayStartBtn").addEventListener("click", startGame);
}

function update() {
  gameTime += 1;
  updatePlayer();
  maybeSpawnEnemies();
  maybeSpawnGeorge();
  maybeSpawnBoss();
  updateBullets();
  updateEnemies();
  updatePickups();
  updateBoss();
  updateParticles();

  cameraX = clamp(player.x - W * 0.28, 0, WORLD_W - W);
  if (screenShake > 0) screenShake *= 0.88;

  updateHud();
}

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(0.4, "#1e3a8a");
  grad.addColorStop(1, "#111827");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawParallax() {
  // Far skyline
  for (let i = 0; i < 20; i++) {
    const x = (i * 260) - (cameraX * 0.18 % 260) - 100;
    const h = 120 + (i % 5) * 35;
    ctx.fillStyle = "rgba(148,163,184,0.22)";
    ctx.fillRect(x, GROUND_Y - h - 120, 120, h);
  }

  // Mid buildings
  for (let i = 0; i < 18; i++) {
    const x = (i * 320) - (cameraX * 0.35 % 320) - 180;
    const h = 170 + (i % 4) * 45;
    ctx.fillStyle = "rgba(30,41,59,0.82)";
    ctx.fillRect(x, GROUND_Y - h - 40, 180, h);

    ctx.fillStyle = "rgba(250,204,21,0.15)";
    for (let wx = x + 14; wx < x + 160; wx += 28) {
      for (let wy = GROUND_Y - h - 26; wy < GROUND_Y - 58; wy += 26) {
        ctx.fillRect(wx, wy, 12, 12);
      }
    }
  }
}

function drawRoad() {
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, GROUND_Y + 44, W, 16);

  ctx.fillStyle = "#f8fafc";
  for (let x = -((cameraX * 1.2) % 120); x < W + 120; x += 120) {
    ctx.fillRect(x + 22, GROUND_Y + 50, 58, 4);
  }

  ctx.fillStyle = "#334155";
  ctx.fillRect(0, GROUND_Y - 16, W, 16);
}

function drawProps() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  for (let i = 0; i < WORLD_W; i += 740) {
    const signX = i + 220;
    ctx.fillStyle = "#475569";
    ctx.fillRect(signX, GROUND_Y - 120, 12, 120);
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(signX + 10, GROUND_Y - 118, 110, 54);
    ctx.fillStyle = "#111";
    ctx.font = "bold 18px Arial";
    ctx.fillText(i < WORLD_W * 0.33 ? "SHOWINGS" : i < WORLD_W * 0.66 ? "OFFERS" : "CLOSING", signX + 18, GROUND_Y - 86);
  }

  ctx.restore();
}

function drawPlayer() {
  const flashing = now() < player.flashUntil && Math.floor(now() / 80) % 2 === 0;
  if (flashing) return;

  ctx.save();
  ctx.translate(-cameraX, 0);

  // body
  ctx.fillStyle = "#2563eb";
  ctx.fillRect(player.x + 8, player.y + 18, 26, 34);
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(player.x + 5, player.y + 52, 12, 22);
  ctx.fillRect(player.x + 25, player.y + 52, 12, 22);

  // head
  ctx.fillStyle = "#f2c38b";
  ctx.beginPath();
  ctx.arc(player.x + 20, player.y + 13, 13, 0, Math.PI * 2);
  ctx.fill();

  // helmet
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(player.x + 8, player.y + 1, 24, 8);

  // weapon
  ctx.fillStyle = game.agentActive ? "#22c55e" : "#facc15";
  if (player.facing === 1) {
    ctx.fillRect(player.x + 30, player.y + 30, 24, 6);
  } else {
    ctx.fillRect(player.x - 12, player.y + 30, 24, 6);
  }

  ctx.restore();
}

function drawEnemies() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  for (const e of game.enemies) {
    if (e.kind === "flip") {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(e.x, e.y + 18, e.w, e.h - 18);
      ctx.fillStyle = "#fecaca";
      ctx.fillRect(e.x + 10, e.y, e.w - 20, 20);
      ctx.fillStyle = "#111";
      ctx.fillRect(e.x + 16, e.y + 8, 24, 4);
    } else if (e.kind === "overpriced") {
      ctx.fillStyle = "#f97316";
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.fillStyle = "#7c2d12";
      ctx.fillRect(e.x + 10, e.y + 12, e.w - 20, 10);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.fillText("$$$", e.x + 18, e.y + 50);
    } else if (e.kind === "drone") {
      ctx.fillStyle = "#60a5fa";
      ctx.fillRect(e.x, e.y + 10, e.w, 18);
      ctx.fillStyle = "#bfdbfe";
      ctx.beginPath();
      ctx.arc(e.x + 14, e.y + 10, 10, Math.PI, 0);
      ctx.arc(e.x + 40, e.y + 10, 10, Math.PI, 0);
      ctx.fill();
    } else if (e.kind === "fraudOrb") {
      ctx.fillStyle = "#a855f7";
      ctx.beginPath();
      ctx.arc(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.fillText("@", e.x + 14, e.y + 28);
    }
  }

  ctx.restore();
}

function drawBullets() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  for (const b of game.bullets) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }

  for (const b of game.enemyBullets) {
    ctx.fillStyle = b.kind === "orb" ? "#ec4899" : "#ef4444";
    if (b.kind === "orb") {
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  }

  ctx.restore();
}

function drawPickups() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  for (const p of game.pickups) {
    if (p.kind === "medal") {
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(p.x + 9, p.y + 9, 9, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "george") {
      // Stylized George power-up sprite
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(p.x + 8, p.y + 26, 28, 40);
      ctx.fillStyle = "#f2c38b";
      ctx.beginPath();
      ctx.arc(p.x + 22, p.y + 14, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.fillRect(p.x + 14, p.y + 10, 16, 4); // shades
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(p.x + 8, p.y + 68, 12, 20);
      ctx.fillRect(p.x + 24, p.y + 68, 12, 20);

      ctx.fillStyle = "#dcfce7";
      ctx.font = "bold 14px Arial";
      ctx.fillText("GEORGE", p.x - 10, p.y - 8);
    }
  }

  ctx.restore();
}

function drawBoss() {
  if (!game.boss) return;
  const b = game.boss;

  ctx.save();
  ctx.translate(-cameraX, 0);

  ctx.fillStyle = "#6d28d9";
  ctx.fillRect(b.x, b.y + 30, b.w, b.h - 30);
  ctx.fillStyle = "#a855f7";
  ctx.fillRect(b.x + 16, b.y, b.w - 32, 46);
  ctx.fillStyle = "#111";
  ctx.fillRect(b.x + 50, b.y + 70, 50, 16);
  ctx.fillRect(b.x + 122, b.y + 70, 50, 16);

  ctx.fillStyle = "#ef4444";
  ctx.fillRect(b.x - 36, b.y + 80, 42, 18);
  ctx.fillRect(b.x - 36, b.y + 140, 42, 18);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px Arial";
  ctx.fillText("CLOSING", b.x + 56, b.y + 28);
  ctx.fillText("MACHINE", b.x + 50, b.y + 50);

  ctx.restore();
}

function drawParticles() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  for (const p of game.particles) {
    ctx.globalAlpha = clamp(p.life / 40, 0.1, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawForegroundUi() {
  // wave text
  ctx.fillStyle = "rgba(15,23,42,.72)";
  ctx.fillRect(20, 18, 240, 42);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px Arial";
  ctx.fillText(game.waveText, 34, 46);

  if (game.agentActive) {
    ctx.fillStyle = "rgba(34,197,94,.16)";
    ctx.fillRect(W - 260, 18, 220, 42);
    ctx.fillStyle = "#dcfce7";
    ctx.font = "bold 20px Arial";
    ctx.fillText("GEORGE ONLINE", W - 238, 46);
  }

  if (!game.agentActive && georgeSpawned && !bossDefeated) {
    ctx.fillStyle = "rgba(245,158,11,.16)";
    ctx.fillRect(W - 360, 18, 320, 42);
    ctx.fillStyle = "#fde68a";
    ctx.font = "bold 18px Arial";
    ctx.fillText("PICK UP GEORGE TO WIN", W - 340, 46);
  }
}

function render() {
  ctx.save();
  if (screenShake > 0) {
    ctx.translate(rand(-screenShake, screenShake), rand(-screenShake, screenShake));
  }

  drawSky();
  drawParallax();
  drawRoad();
  drawProps();
  drawPickups();
  drawBullets();
  drawEnemies();
  drawBoss();
  drawParticles();
  drawPlayer();
  drawForegroundUi();

  ctx.restore();
}

function loop() {
  if (!running) return;
  update();
  render();
  animationFrame = requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) {
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

startBtn.addEventListener("click", startGame);
overlayStartBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", () => {
  restoreStartOverlay();
  resetGame();
});

restoreStartOverlay();
resetGame();


function bindTouchButton(id, stateKey, hold = true) {
  const el = document.getElementById(id);
  if (!el) return;

  const press = (e) => {
    e.preventDefault();
    touchState[stateKey] = true;
    if (!hold) {
      setTimeout(() => { touchState[stateKey] = false; }, 90);
    }
  };

  const release = (e) => {
    if (e) e.preventDefault();
    touchState[stateKey] = false;
  };

  el.addEventListener("touchstart", press, { passive: false });
  el.addEventListener("touchend", release, { passive: false });
  el.addEventListener("touchcancel", release, { passive: false });

  // fallback for pointer/mouse taps on tablets
  el.addEventListener("pointerdown", press);
  el.addEventListener("pointerup", release);
  el.addEventListener("pointerleave", release);
}

bindTouchButton("touchLeft", "left", true);
bindTouchButton("touchRight", "right", true);
bindTouchButton("touchJump", "jump", false);
bindTouchButton("touchShoot", "shoot", true);
