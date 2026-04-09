const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const overlayStartBtn = document.getElementById("overlayStartBtn");
const overlay = document.getElementById("overlay");
const toast = document.getElementById("toast");

const levelNameEl = document.getElementById("levelName");
const budgetValueEl = document.getElementById("budgetValue");
const stressValueEl = document.getElementById("stressValue");
const coinsValueEl = document.getElementById("coinsValue");
const livesValueEl = document.getElementById("livesValue");
const budgetBar = document.getElementById("budgetBar");
const stressBar = document.getElementById("stressBar");
const budgetText = document.getElementById("budgetText");
const stressText = document.getElementById("stressText");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRAVITY = 0.62;
const WORLD_WIDTH = 2600;

const keys = {};
let animationFrame = null;
let running = false;
let cameraX = 0;
let levelIndex = 0;

const gameState = {
  budget: 100,
  stress: 0,
  coins: 0,
  lives: 3,
  gameWon: false
};

const levels = [
  {
    name: "Pre-Approval Plains",
    bgTop: "#7dd3fc",
    bgBottom: "#bfdbfe",
    groundColor: "#65a30d",
    platforms: [
      { x: 0, y: 460, w: 2600, h: 60, type: "ground" },
      { x: 320, y: 390, w: 160, h: 20 },
      { x: 580, y: 340, w: 170, h: 20 },
      { x: 920, y: 300, w: 200, h: 20 },
      { x: 1280, y: 360, w: 140, h: 20 },
      { x: 1610, y: 325, w: 190, h: 20 },
      { x: 1970, y: 285, w: 160, h: 20 }
    ],
    collectibles: [
      { x: 360, y: 350, kind: "coin", text: "Document checklist" },
      { x: 620, y: 300, kind: "coin", text: "Payment math" },
      { x: 1000, y: 260, kind: "coin", text: "Rate shopping" },
      { x: 1325, y: 320, kind: "power", text: "Trusted lender boost" },
      { x: 1660, y: 285, kind: "coin", text: "Credit awareness" },
      { x: 2050, y: 245, kind: "coin", text: "Budget discipline" }
    ],
    hazards: [
      { x: 520, y: 434, w: 55, h: 26, label: "Bad Advice", damage: 9, stress: 12 },
      { x: 1180, y: 434, w: 62, h: 26, label: "Shiny Payment Trap", damage: 12, stress: 10 },
      { x: 1820, y: 434, w: 58, h: 26, label: "Sketchy Lender", damage: 10, stress: 12 }
    ],
    finish: { x: 2400, y: 380, w: 28, h: 80 }
  },
  {
    name: "Showing Sprint",
    bgTop: "#93c5fd",
    bgBottom: "#dbeafe",
    groundColor: "#16a34a",
    platforms: [
      { x: 0, y: 460, w: 2600, h: 60, type: "ground" },
      { x: 260, y: 375, w: 150, h: 20 },
      { x: 540, y: 325, w: 180, h: 20 },
      { x: 860, y: 360, w: 160, h: 20 },
      { x: 1150, y: 295, w: 180, h: 20 },
      { x: 1495, y: 245, w: 180, h: 20 },
      { x: 1850, y: 340, w: 170, h: 20 }
    ],
    collectibles: [
      { x: 290, y: 335, kind: "coin", text: "Layout check" },
      { x: 610, y: 285, kind: "coin", text: "Neighborhood fit" },
      { x: 900, y: 320, kind: "power", text: "Savvy agent" },
      { x: 1210, y: 255, kind: "coin", text: "Roof age question" },
      { x: 1550, y: 205, kind: "coin", text: "Water signs spotted" },
      { x: 1910, y: 300, kind: "coin", text: "Traffic reality" }
    ],
    hazards: [
      { x: 455, y: 434, w: 64, h: 26, label: "Lipstick Flip", damage: 12, stress: 10 },
      { x: 1080, y: 434, w: 64, h: 26, label: "Overpriced Listing", damage: 14, stress: 8 },
      { x: 1730, y: 434, w: 66, h: 26, label: "Main Road Surprise", damage: 10, stress: 12 }
    ],
    finish: { x: 2410, y: 380, w: 28, h: 80 }
  },
  {
    name: "Inspection Dungeon",
    bgTop: "#94a3b8",
    bgBottom: "#cbd5e1",
    groundColor: "#475569",
    platforms: [
      { x: 0, y: 460, w: 2600, h: 60, type: "ground" },
      { x: 230, y: 390, w: 155, h: 20 },
      { x: 540, y: 330, w: 160, h: 20 },
      { x: 825, y: 280, w: 165, h: 20 },
      { x: 1180, y: 330, w: 180, h: 20 },
      { x: 1540, y: 275, w: 180, h: 20 },
      { x: 1910, y: 220, w: 180, h: 20 }
    ],
    collectibles: [
      { x: 280, y: 350, kind: "coin", text: "Scope sewer line" },
      { x: 600, y: 290, kind: "coin", text: "Read the report" },
      { x: 900, y: 240, kind: "power", text: "Repair credit won" },
      { x: 1250, y: 290, kind: "coin", text: "HVAC age check" },
      { x: 1610, y: 235, kind: "coin", text: "Panel concerns flagged" },
      { x: 1970, y: 180, kind: "coin", text: "Walkthrough discipline" }
    ],
    hazards: [
      { x: 440, y: 434, w: 58, h: 26, label: "Sewer Monster", damage: 18, stress: 12 },
      { x: 1050, y: 434, w: 58, h: 26, label: "Knob & Tube Ghost", damage: 16, stress: 16 },
      { x: 1770, y: 434, w: 60, h: 26, label: "Foundation Crack", damage: 20, stress: 12 },
      { x: 2240, y: 434, w: 62, h: 26, label: "Wire Fraud Phantom", damage: 24, stress: 20 }
    ],
    finish: { x: 2440, y: 380, w: 28, h: 80 }
  }
];

const player = {
  x: 80,
  y: 370,
  w: 34,
  h: 46,
  vx: 0,
  vy: 0,
  speed: 4.4,
  jump: -12.2,
  onGround: false,
  invulnerableUntil: 0,
  facing: 1
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("visible"), 1600);
}

function resetPlayerPosition() {
  player.x = 80;
  player.y = 370;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  cameraX = 0;
}

function freshLevelData(index) {
  return JSON.parse(JSON.stringify(levels[index]));
}

let currentLevel = freshLevelData(0);

function resetGame(full = true) {
  if (full) {
    gameState.budget = 100;
    gameState.stress = 0;
    gameState.coins = 0;
    gameState.lives = 3;
    gameState.gameWon = false;
    levelIndex = 0;
  }
  currentLevel = freshLevelData(levelIndex);
  resetPlayerPosition();
  updateHud();
}

function updateHud() {
  const level = levels[levelIndex];
  levelNameEl.textContent = level.name;
  budgetValueEl.textContent = Math.round(gameState.budget);
  stressValueEl.textContent = Math.round(gameState.stress);
  coinsValueEl.textContent = gameState.coins;
  livesValueEl.textContent = gameState.lives;

  budgetBar.style.width = `${clamp(gameState.budget, 0, 100)}%`;
  stressBar.style.width = `${clamp(gameState.stress, 0, 100)}%`;
  budgetText.textContent = `${Math.round(gameState.budget)} / 100`;
  stressText.textContent = `${Math.round(gameState.stress)} / 100`;
}

function loseLife(reason) {
  gameState.lives -= 1;
  gameState.budget = clamp(gameState.budget - 8, 0, 100);
  gameState.stress = clamp(gameState.stress + 12, 0, 100);
  updateHud();

  if (gameState.lives <= 0 || gameState.budget <= 0 || gameState.stress >= 100) {
    endGame(false, reason || "The deal fell apart.");
    return;
  }

  showToast(reason || "You took a hit.");
  resetPlayerPosition();
}

function endGame(won, message) {
  running = false;
  cancelAnimationFrame(animationFrame);
  overlay.classList.add("visible");

  const card = overlay.querySelector(".overlay-card");
  if (won) {
    card.innerHTML = `
      <h2>Deal closed. Keys in hand.</h2>
      <p>${message}</p>
      <p><strong>Coins:</strong> ${gameState.coins} &nbsp; <strong>Budget:</strong> ${Math.round(gameState.budget)} &nbsp; <strong>Stress:</strong> ${Math.round(gameState.stress)}</p>
      <div class="overlay-buttons">
        <button id="playAgainBtn" class="btn">Play Again</button>
      </div>
    `;
    document.getElementById("playAgainBtn").addEventListener("click", () => {
      overlay.innerHTML = `
        <div class="overlay-card">
          <h2>Ready to buy without getting wrecked?</h2>
          <p>Collect smart choices. Avoid real-estate traps. Reach the closing sign with enough budget and low enough stress to survive the deal.</p>
          <div class="overlay-buttons">
            <button id="overlayStartBtn" class="btn">Play</button>
          </div>
        </div>
      `;
      overlay.querySelector("#overlayStartBtn").addEventListener("click", startGame);
      startGame();
    });
  } else {
    card.innerHTML = `
      <h2>Contract busted.</h2>
      <p>${message}</p>
      <p>You ran out of leverage before closing. Reset and try a smarter route.</p>
      <div class="overlay-buttons">
        <button id="tryAgainBtn" class="btn">Try Again</button>
      </div>
    `;
    document.getElementById("tryAgainBtn").addEventListener("click", () => {
      overlay.innerHTML = `
        <div class="overlay-card">
          <h2>Ready to buy without getting wrecked?</h2>
          <p>Collect smart choices. Avoid real-estate traps. Reach the closing sign with enough budget and low enough stress to survive the deal.</p>
          <div class="overlay-buttons">
            <button id="overlayStartBtn" class="btn">Play</button>
          </div>
        </div>
      `;
      overlay.querySelector("#overlayStartBtn").addEventListener("click", startGame);
      startGame();
    });
  }
}

function nextLevel() {
  if (levelIndex < levels.length - 1) {
    levelIndex += 1;
    currentLevel = freshLevelData(levelIndex);
    resetPlayerPosition();
    updateHud();
    showToast(`Level cleared: ${levels[levelIndex - 1].name}`);
  } else {
    gameState.gameWon = true;
    updateHud();
    endGame(
      true,
      "You survived pre-approval, showings, inspections, and closing without getting wrecked by the process. This is a solid browser MVP you can expand into a bigger branded experience."
    );
  }
}

function startGame() {
  overlay.classList.remove("visible");
  resetGame(true);
  if (!running) {
    running = true;
    loop();
  }
}

function handleInput() {
  player.vx = 0;

  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
    player.vx = -player.speed;
    player.facing = -1;
  }
  if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
    player.vx = player.speed;
    player.facing = 1;
  }

  const jumpPressed = keys[" "] || keys["ArrowUp"] || keys["w"] || keys["W"];
  if (jumpPressed && player.onGround) {
    player.vy = player.jump;
    player.onGround = false;
  }
}

function update() {
  handleInput();

  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;
  player.onGround = false;

  for (const platform of currentLevel.platforms) {
    if (rectsOverlap(player, platform)) {
      const prevBottom = player.y - player.vy + player.h;
      const prevTop = player.y - player.vy;
      const prevRight = player.x - player.vx + player.w;
      const prevLeft = player.x - player.vx;

      if (prevBottom <= platform.y) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (prevTop >= platform.y + platform.h) {
        player.y = platform.y + platform.h;
        player.vy = 0;
      } else if (prevRight <= platform.x) {
        player.x = platform.x - player.w;
      } else if (prevLeft >= platform.x + platform.w) {
        player.x = platform.x + platform.w;
      }
    }
  }

  if (player.y > HEIGHT + 120) {
    loseLife("You missed the jump and lost leverage.");
  }

  player.x = clamp(player.x, 0, WORLD_WIDTH - player.w);

  currentLevel.collectibles.forEach((item) => {
    if (item.collected) return;
    const r = { x: item.x, y: item.y, w: 18, h: 18 };
    if (rectsOverlap(player, r)) {
      item.collected = true;
      if (item.kind === "coin") {
        gameState.coins += 1;
        gameState.budget = clamp(gameState.budget + 2, 0, 100);
        gameState.stress = clamp(gameState.stress - 2, 0, 100);
      } else {
        gameState.budget = clamp(gameState.budget + 10, 0, 100);
        gameState.stress = clamp(gameState.stress - 10, 0, 100);
      }
      updateHud();
      showToast(item.text);
    }
  });

  const now = performance.now();
  currentLevel.hazards.forEach((hz) => {
    const r = { x: hz.x, y: hz.y, w: hz.w, h: hz.h };
    if (rectsOverlap(player, r) && now > player.invulnerableUntil) {
      player.invulnerableUntil = now + 1200;
      gameState.budget = clamp(gameState.budget - hz.damage, 0, 100);
      gameState.stress = clamp(gameState.stress + hz.stress, 0, 100);
      updateHud();
      loseLife(`${hz.label} hit you.`);
    }
  });

  const finish = currentLevel.finish;
  if (rectsOverlap(player, finish)) {
    nextLevel();
  }

  cameraX = clamp(player.x - WIDTH * 0.35, 0, WORLD_WIDTH - WIDTH);
}

function drawBackground() {
  const level = levels[levelIndex];
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, level.bgTop);
  grad.addColorStop(1, level.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 10; i++) {
    const hillX = ((i * 290) - (cameraX * 0.25)) % (WORLD_WIDTH + 400) - 200;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.ellipse(hillX, 420, 180, 80, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  for (let i = 0; i < 7; i++) {
    const cloudX = ((i * 380) - (cameraX * 0.16)) % (WORLD_WIDTH + 300) - 120;
    drawCloud(cloudX, 90 + (i % 3) * 35);
  }
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.arc(x + 25, y - 8, 28, 0, Math.PI * 2);
  ctx.arc(x + 55, y, 22, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatforms() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  const level = levels[levelIndex];
  currentLevel.platforms.forEach((p) => {
    ctx.fillStyle = p.type === "ground" ? level.groundColor : "#8b5cf6";
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(p.x, p.y, p.w, 4);
  });

  ctx.restore();
}

function drawCollectibles() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  currentLevel.collectibles.forEach((item) => {
    if (item.collected) return;

    if (item.kind === "coin") {
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(item.x + 9, item.y + 9, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7c5b00";
      ctx.font = "bold 11px Arial";
      ctx.fillText("$", item.x + 5, item.y + 13);
    } else {
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(item.x, item.y, 18, 18);
      ctx.fillStyle = "#052e16";
      ctx.font = "bold 12px Arial";
      ctx.fillText("+", item.x + 5, item.y + 13);
    }
  });

  ctx.restore();
}

function drawHazards() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  currentLevel.hazards.forEach((hz) => {
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(hz.x, hz.y, hz.w, hz.h);
    ctx.fillStyle = "#fee2e2";
    ctx.font = "bold 10px Arial";
    ctx.fillText("!", hz.x + hz.w / 2 - 3, hz.y + 16);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 11px Arial";
    ctx.fillText(hz.label, hz.x - 8, hz.y - 8);
  });

  ctx.restore();
}

function drawFinish() {
  const f = currentLevel.finish;
  ctx.save();
  ctx.translate(-cameraX, 0);

  ctx.fillStyle = "#6d28d9";
  ctx.fillRect(f.x, f.y, 5, f.h);

  ctx.fillStyle = "#a78bfa";
  ctx.beginPath();
  ctx.moveTo(f.x + 5, f.y);
  ctx.lineTo(f.x + 55, f.y + 16);
  ctx.lineTo(f.x + 5, f.y + 32);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px Arial";
  ctx.fillText("CLOSE", f.x + 12, f.y + 20);

  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  const flashing = performance.now() < player.invulnerableUntil && Math.floor(performance.now() / 80) % 2 === 0;
  if (flashing) ctx.globalAlpha = 0.45;

  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(player.x, player.y + 10, player.w, player.h - 10);

  ctx.fillStyle = "#f1c27d";
  ctx.beginPath();
  ctx.arc(player.x + player.w / 2, player.y + 10, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(player.x + 8, player.y + 24, 8, 18);
  ctx.fillRect(player.x + 18, player.y + 24, 8, 18);

  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(player.x + (player.facing === 1 ? 22 : 4), player.y + 2, 8, 5);

  ctx.restore();
}

function drawLevelLabel() {
  ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
  ctx.fillRect(20, 18, 310, 42);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Arial";
  ctx.fillText(levels[levelIndex].name, 34, 45);
}

function render() {
  drawBackground();
  drawPlatforms();
  drawCollectibles();
  drawHazards();
  drawFinish();
  drawPlayer();
  drawLevelLabel();
}

function loop() {
  update();
  render();
  if (running) {
    animationFrame = requestAnimationFrame(loop);
  }
}

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

startBtn.addEventListener("click", startGame);
overlayStartBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", () => {
  overlay.classList.remove("visible");
  resetGame(true);
  if (!running) {
    running = true;
    loop();
  }
});

resetGame(true);
render();
