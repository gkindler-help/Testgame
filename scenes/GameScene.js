import Player from '../Player.js';
import GeorgeAgent from '../GeorgeAgent.js';
import Boss from '../Boss.js';
import Enemy from '../Enemy.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.worldWidth = 5200;
    this.worldHeight = 960;
    this.groundY = 810;
    this.gameEnded = false;
    this.shootHeld = false;
    this.callAgentCooldown = false;
    this.changeGunCooldown = false;
  }

  preload() {
    this.load.plugin(
      'rexvirtualjoystickplugin',
      'https://cdn.jsdelivr.net/npm/phaser3-rex-plugins/dist/rexvirtualjoystickplugin.min.js',
      true
    );
  }

  create() {
    this.tryFullscreenOnFirstTouch();
    this.makePlaceholderTextures();
    this.setupWorld();
    this.setupBackground();
    this.setupPlatforms();
    this.setupEntities();
    this.setupCollectibles();
    this.setupCamera();
    this.setupControls();
    this.setupButtons();
    this.setupHUD();
    this.spawnBoss();
    this.setupCollisions();
    this.showIntroBanner();
    this.orientationPaused = false;
  }

  makePlaceholderTextures() {
    const g = this.add.graphics();

    g.clear();
    g.fillStyle(0x2b2d42, 1); g.fillRect(12, 10, 24, 36);
    g.fillStyle(0xffd6a5, 1); g.fillRect(14, 0, 20, 14);
    g.fillStyle(0x3a86ff, 1); g.fillRect(8, 18, 6, 18); g.fillRect(34, 18, 6, 18);
    g.fillStyle(0x4cc9f0, 1); g.fillRect(6, 16, 8, 16);
    g.fillStyle(0x222222, 1); g.fillRect(14, 46, 8, 12); g.fillRect(26, 46, 8, 12);
    g.fillStyle(0x555555, 1); g.fillRect(38, 22, 16, 4);
    g.generateTexture('player', 64, 64);

    g.clear();
    g.fillStyle(0x3d405b, 1); g.fillRect(10, 10, 28, 38);
    g.fillStyle(0xf2cc8f, 1); g.fillRect(12, 0, 24, 14);
    g.fillStyle(0x81b29a, 1); g.fillRect(2, 18, 10, 24);
    g.fillStyle(0x6d597a, 1); g.fillRect(36, 22, 20, 8);
    g.fillStyle(0x222222, 1); g.fillRect(12, 48, 8, 12); g.fillRect(26, 48, 8, 12);
    g.generateTexture('george', 64, 64);

    g.clear();
    g.fillStyle(0xb5179e, 1); g.fillRect(10, 16, 30, 32);
    g.fillStyle(0xf1c0e8, 1); g.fillRect(14, 2, 22, 16);
    g.fillStyle(0x222222, 1); g.fillRect(14, 48, 8, 10); g.fillRect(28, 48, 8, 10);
    g.generateTexture('enemy-basic', 56, 64);

    g.clear();
    g.fillStyle(0x2a9d8f, 1); g.fillRect(8, 20, 32, 24);
    g.fillStyle(0xb7efc5, 1); g.fillRect(12, 6, 24, 18);
    g.fillStyle(0x1d3557, 1); g.fillRect(12, 44, 8, 12); g.fillRect(28, 44, 8, 12);
    g.generateTexture('enemy-small', 56, 64);

    g.clear();
    g.fillStyle(0x5c677d, 1); g.fillRect(18, 24, 92, 72);
    g.fillStyle(0xffadad, 1); g.fillRect(34, 0, 60, 30);
    g.fillStyle(0x6c757d, 1); g.fillRect(0, 34, 26, 18); g.fillRect(110, 34, 26, 18);
    g.fillStyle(0x222222, 1); g.fillRect(34, 96, 18, 20); g.fillRect(74, 96, 18, 20);
    g.generateTexture('boss', 136, 120);

    g.clear(); g.fillStyle(0xffd166, 1); g.fillRect(0, 0, 18, 6); g.generateTexture('bullet-player', 18, 6);
    g.clear(); g.fillStyle(0xf94144, 1); g.fillRect(0, 0, 22, 8); g.generateTexture('bullet-george', 22, 8);
    g.clear(); g.fillStyle(0x90e0ef, 1); g.fillRect(0, 0, 14, 6); g.generateTexture('bullet-enemy', 14, 6);
    g.clear(); g.fillStyle(0xff7b00, 1); g.fillRect(0, 0, 20, 10); g.generateTexture('bullet-flame', 20, 10);

    g.clear(); g.fillStyle(0x2ec4b6, 1); g.fillCircle(16, 16, 14); g.fillStyle(0xffffff, 1); g.fillRect(13, 6, 6, 20); g.fillRect(6, 13, 20, 6); g.generateTexture('budget-boost', 32, 32);
    g.clear(); g.fillStyle(0xffbe0b, 1); g.fillRect(8, 6, 16, 22); g.fillStyle(0xffffff, 1); g.fillRect(11, 10, 10, 4); g.generateTexture('stress-relief', 32, 32);
    g.clear(); g.fillStyle(0xfb5607, 1); g.fillRect(8, 4, 16, 24); g.fillStyle(0xffffff, 1); g.fillRect(10, 8, 12, 6); g.generateTexture('life-boost', 32, 32);

    g.clear();
    g.fillStyle(0xc0e8ff, 1); g.fillRect(0, 0, 256, 256);
    g.fillStyle(0xffffff, 0.7); g.fillCircle(40, 50, 20); g.fillCircle(60, 48, 18); g.fillCircle(80, 52, 20);
    g.fillCircle(160, 80, 18); g.fillCircle(182, 80, 20); g.fillCircle(205, 84, 16);
    g.generateTexture('sky-panel', 256, 256);

    g.clear();
    g.fillStyle(0x8ecf7a, 1); g.fillRect(0, 80, 256, 176);
    g.fillStyle(0x6ab04c, 1);
    for (let i = 0; i < 8; i++) g.fillTriangle(i * 34, 100, i * 34 + 16, 70, i * 34 + 32, 100);
    g.generateTexture('hill-strip', 256, 256);

    g.clear();
    g.fillStyle(0xf4a261, 1); g.fillRect(20, 90, 90, 60);
    g.fillStyle(0xe76f51, 1); g.fillTriangle(10, 90, 65, 40, 120, 90);
    g.fillStyle(0xffffff, 1); g.fillRect(55, 115, 20, 35); g.fillRect(28, 110, 16, 16); g.fillRect(85, 110, 16, 16);
    g.fillRect(145, 100, 70, 50);
    g.fillStyle(0xd62828, 1); g.fillTriangle(135, 100, 180, 65, 225, 100);
    g.fillStyle(0x2d6a4f, 1); g.fillRect(188, 118, 16, 32);
    g.fillStyle(0xffffff, 1); g.fillRect(155, 112, 14, 14); g.fillRect(195, 112, 14, 14);
    g.generateTexture('suburb-strip', 256, 180);

    g.clear();
    g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 26, 16);
    g.fillStyle(0xd90429, 1); g.fillRect(0, 0, 26, 4);
    g.fillStyle(0x2b2d42, 1); g.fillRect(11, 16, 4, 20);
    g.generateTexture('for-sale-sign', 26, 36);

    g.destroy();
  }

  setupWorld() {
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBackgroundColor('#8ed2ff');
  }

  setupBackground() {
    for (let x = 0; x < this.worldWidth; x += 256) this.add.image(x, 128, 'sky-panel').setOrigin(0, 0).setScrollFactor(0.15);
    for (let x = 0; x < this.worldWidth; x += 256) this.add.image(x, 400, 'hill-strip').setOrigin(0, 0).setScrollFactor(0.35);
    for (let x = 0; x < this.worldWidth; x += 256) this.add.image(x, 490, 'suburb-strip').setOrigin(0, 0).setScrollFactor(0.55);
    for (let x = 250; x < this.worldWidth; x += 480) this.add.image(x, this.groundY - 18, 'for-sale-sign').setOrigin(0.5, 1);

    const ground = this.add.graphics();
    ground.fillStyle(0x6a994e, 1); ground.fillRect(0, this.groundY, this.worldWidth, this.worldHeight - this.groundY);
    ground.fillStyle(0x4f772d, 1); ground.fillRect(0, this.groundY, this.worldWidth, 18);
  }

  setupPlatforms() {
    this.platforms = this.physics.add.staticGroup();
    for (let x = 0; x < this.worldWidth; x += 256) {
      const plat = this.add.rectangle(x + 128, this.groundY + 30, 256, 60, 0x5a4a42);
      this.physics.add.existing(plat, true);
      this.platforms.add(plat);
    }

    [
      { x: 650, y: 650, w: 180 }, { x: 980, y: 560, w: 200 }, { x: 1420, y: 610, w: 180 },
      { x: 1850, y: 540, w: 220 }, { x: 2390, y: 640, w: 200 }, { x: 2850, y: 570, w: 200 },
      { x: 3360, y: 610, w: 180 }, { x: 3890, y: 550, w: 230 }
    ].forEach((ledge) => {
      const plat = this.add.rectangle(ledge.x, ledge.y, ledge.w, 24, 0x7f5539);
      this.physics.add.existing(plat, true);
      this.platforms.add(plat);
    });
  }

  setupEntities() {
    this.playerBullets = this.physics.add.group({ allowGravity: false, immovable: true });
    this.georgeBullets = this.physics.add.group({ allowGravity: false, immovable: true });
    this.enemyBullets = this.physics.add.group({ allowGravity: false, immovable: true });
    this.enemyGroup = this.physics.add.group();
    this.collectibles = this.physics.add.group();

    this.player = new Player(this, 140, this.groundY - 70);
    this.player.setCollideWorldBounds(true);

    this.george = new GeorgeAgent(this, -300, this.groundY - 70);
    this.george.setActive(false).setVisible(false);
    this.george.activePartner = false;

    [
      { x: 650, y: 590, type: 'listing' }, { x: 1080, y: 500, type: 'goblin' }, { x: 1350, y: 740, type: 'gremlin' },
      { x: 1700, y: 740, type: 'listing' }, { x: 2050, y: 480, type: 'goblin' }, { x: 2320, y: 740, type: 'gremlin' },
      { x: 2680, y: 740, type: 'listing' }, { x: 3120, y: 500, type: 'goblin' }, { x: 3520, y: 740, type: 'gremlin' },
      { x: 3990, y: 500, type: 'listing' }, { x: 4320, y: 740, type: 'gremlin' }
    ].forEach((data) => this.enemyGroup.add(new Enemy(this, data.x, data.y, data.type)));

    this.budget = 100;
    this.stress = 100;
    this.lives = 3;
  }

  setupCollectibles() {
    [
      { x: 720, y: 590, key: 'budget-boost', type: 'budget' },
      { x: 1000, y: 500, key: 'stress-relief', type: 'stress' },
      { x: 1510, y: 560, key: 'budget-boost', type: 'budget' },
      { x: 2120, y: 430, key: 'stress-relief', type: 'stress' },
      { x: 2490, y: 590, key: 'life-boost', type: 'life' },
      { x: 3400, y: 560, key: 'budget-boost', type: 'budget' },
      { x: 3920, y: 500, key: 'stress-relief', type: 'stress' }
    ].forEach((item) => {
      const sprite = this.collectibles.create(item.x, item.y, item.key);
      sprite.body.allowGravity = false;
      sprite.collectType = item.type;
      this.tweens.add({ targets: sprite, y: sprite.y - 8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(180, 90);
  }

  setupControls() {
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP, down: Phaser.Input.Keyboard.KeyCodes.DOWN, left: Phaser.Input.Keyboard.KeyCodes.LEFT, right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W, a: Phaser.Input.Keyboard.KeyCodes.A, s: Phaser.Input.Keyboard.KeyCodes.S, d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE, ctrl: Phaser.Input.Keyboard.KeyCodes.CTRL, j: Phaser.Input.Keyboard.KeyCodes.J,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT, g: Phaser.Input.Keyboard.KeyCodes.G
    });

    this.buildJoystick();
    this.scale.on('resize', this.repositionTouchUI, this);

    this.input.keyboard.on('keydown-SHIFT', () => {
      this.player.cycleGun();
      this.flashGunLabel();
    });

    this.input.keyboard.on('keydown-G', () => {
      this.activateGeorge();
    });
  }

  buildJoystick() {
    const { width, height } = this.scale;
    const x = Math.max(120, width * 0.17);
    const y = height - Math.max(120, height * 0.16);

    this.joystickMode = 'fallback';
    this.joystickData = { x: 0, y: 0, force: 0, forceX: 0, forceY: 0, activePointer: null, radius: 75 };

    try {
      const plugin = this.plugins.get('rexvirtualjoystickplugin');
      if (plugin && plugin.add) {
        this.joystick = plugin.add(this, {
          x, y, radius: 75, fixed: true, dir: '8dir', forceMin: 8,
          base: this.add.circle(0, 0, 72, 0x0b132b, 0.35).setStrokeStyle(4, 0xffffff, 0.35).setScrollFactor(0),
          thumb: this.add.circle(0, 0, 34, 0x3a86ff, 0.9).setStrokeStyle(4, 0xffffff, 0.5).setScrollFactor(0)
        });
        this.joystickMode = 'rex';
        return;
      }
    } catch (e) {}

    this.joyBase = this.add.circle(x, y, 72, 0x0b132b, 0.35).setStrokeStyle(4, 0xffffff, 0.35).setScrollFactor(0).setDepth(1000);
    this.joyThumb = this.add.circle(x, y, 34, 0x3a86ff, 0.9).setStrokeStyle(4, 0xffffff, 0.5).setScrollFactor(0).setDepth(1001);

    const leftZone = this.add.zone(0, 0, this.scale.width * 0.45, this.scale.height).setOrigin(0, 0).setScrollFactor(0).setDepth(999).setInteractive();
    leftZone.on('pointerdown', (pointer) => this.startFallbackJoystick(pointer));
    leftZone.on('pointermove', (pointer) => this.moveFallbackJoystick(pointer));
    leftZone.on('pointerup', (pointer) => this.endFallbackJoystick(pointer));
    leftZone.on('pointerout', (pointer) => this.endFallbackJoystick(pointer));
    this.leftZone = leftZone;

    this.input.on('pointerup', (pointer) => this.endFallbackJoystick(pointer));
  }

  startFallbackJoystick(pointer) {
    if (pointer.x > this.scale.width * 0.5) return;
    this.joystickData.activePointer = pointer.id;
    this.joystickData.centerX = Math.max(90, Math.min(pointer.x, this.scale.width * 0.38));
    this.joystickData.centerY = Math.max(90, Math.min(pointer.y, this.scale.height - 90));
    this.joyBase.setPosition(this.joystickData.centerX, this.joystickData.centerY);
    this.joyThumb.setPosition(this.joystickData.centerX, this.joystickData.centerY);
    this.moveFallbackJoystick(pointer);
  }

  moveFallbackJoystick(pointer) {
    if (!this.joystickData || this.joystickData.activePointer !== pointer.id) return;
    const dx = pointer.x - this.joystickData.centerX;
    const dy = pointer.y - this.joystickData.centerY;
    const radius = this.joystickData.radius;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const clamped = Math.min(dist, radius);
    const nx = dx / dist;
    const ny = dy / dist;

    this.joystickData.force = clamped;
    this.joystickData.forceX = nx * clamped;
    this.joystickData.forceY = ny * clamped;
    this.joystickData.x = nx;
    this.joystickData.y = ny;

    this.joyThumb.setPosition(
      this.joystickData.centerX + nx * clamped,
      this.joystickData.centerY + ny * clamped
    );
  }

  endFallbackJoystick(pointer) {
    if (!this.joystickData || this.joystickData.activePointer !== pointer.id) return;
    this.joystickData.activePointer = null;
    this.joystickData.force = 0;
    this.joystickData.forceX = 0;
    this.joystickData.forceY = 0;
    this.joystickData.x = 0;
    this.joystickData.y = 0;
    this.joyThumb.setPosition(this.joyBase.x, this.joyBase.y);
  }

  setupButtons() {
    this.touchButtons = [];
    const { width, height } = this.scale;
    const buttonW = Math.max(120, width * 0.15);
    const buttonH = Math.max(78, height * 0.11);
    const rightX = width - buttonW * 0.72;
    const topY = height - buttonH * 3.1;
    const gap = buttonH + 14;

    this.btnJump = this.createTouchButton(rightX, topY, buttonW, buttonH, 'JUMP', 0x2a9d8f);
    this.btnShoot = this.createTouchButton(rightX, topY + gap, buttonW, buttonH, 'SHOOT', 0xe63946);
    this.btnGun = this.createTouchButton(rightX, topY + gap * 2, buttonW, buttonH, 'CHANGE\nGUN', 0x457b9d);
    this.btnAgent = this.createTouchButton(rightX, topY + gap * 3, buttonW, buttonH, 'CALL\nAGENT', 0xf4a261);

    this.btnJump.on('pointerdown', () => { this.player.tryJump(); this.pressButtonVisual(this.btnJump, true); });
    this.btnJump.on('pointerup', () => this.pressButtonVisual(this.btnJump, false));
    this.btnJump.on('pointerout', () => this.pressButtonVisual(this.btnJump, false));

    this.btnShoot.on('pointerdown', () => { this.shootHeld = true; this.playerShoot(); this.pressButtonVisual(this.btnShoot, true); });
    this.btnShoot.on('pointerup', () => { this.shootHeld = false; this.pressButtonVisual(this.btnShoot, false); });
    this.btnShoot.on('pointerout', () => { this.shootHeld = false; this.pressButtonVisual(this.btnShoot, false); });

    this.btnGun.on('pointerdown', () => {
      if (this.changeGunCooldown) return;
      this.changeGunCooldown = true;
      this.player.cycleGun();
      this.flashGunLabel();
      this.pressButtonVisual(this.btnGun, true);
      this.time.delayedCall(180, () => { this.changeGunCooldown = false; this.pressButtonVisual(this.btnGun, false); });
    });

    this.btnAgent.on('pointerdown', () => {
      this.pressButtonVisual(this.btnAgent, true);
      this.activateGeorge();
      this.time.delayedCall(180, () => this.pressButtonVisual(this.btnAgent, false));
    });
  }

  createTouchButton(x, y, w, h, label, color) {
    const container = this.add.container(x, y).setScrollFactor(0).setDepth(1000);
    const bg = this.add.rectangle(0, 0, w, h, color, 0.9).setStrokeStyle(4, 0xffffff, 0.4).setOrigin(0.5);
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: `${Math.max(22, Math.floor(h * 0.27))}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    container.add([bg, txt]);
    container.setSize(w, h);
    container.bg = bg;
    container.txt = txt;

    const zone = this.add.zone(x, y, w, h).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setInteractive();
    container.zone = zone;
    container.on = (...args) => zone.on(...args);
    this.touchButtons.push(container);
    return container;
  }

  pressButtonVisual(container, pressed) {
    if (!container || !container.bg) return;
    container.bg.setScale(pressed ? 0.94 : 1);
    container.txt.setScale(pressed ? 0.96 : 1);
    container.bg.setAlpha(pressed ? 1 : 0.9);
  }

  repositionTouchUI(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    if (this.joystickMode === 'rex' && this.joystick && this.joystick.setPosition) {
      this.joystick.setPosition(Math.max(120, width * 0.17), height - Math.max(120, height * 0.16));
    } else if (this.joyBase && this.joyThumb) {
      const x = Math.max(120, width * 0.17);
      const y = height - Math.max(120, height * 0.16);
      this.joyBase.setPosition(x, y);
      this.joyThumb.setPosition(x, y);
      this.joystickData.centerX = x;
      this.joystickData.centerY = y;
      if (this.leftZone) this.leftZone.setSize(width * 0.45, height);
    }

    const buttonW = Math.max(120, width * 0.15);
    const buttonH = Math.max(78, height * 0.11);
    const rightX = width - buttonW * 0.72;
    const topY = height - buttonH * 3.1;
    const gap = buttonH + 14;

    [
      { btn: this.btnJump, x: rightX, y: topY },
      { btn: this.btnShoot, x: rightX, y: topY + gap },
      { btn: this.btnGun, x: rightX, y: topY + gap * 2 },
      { btn: this.btnAgent, x: rightX, y: topY + gap * 3 }
    ].forEach((item) => {
      if (!item.btn) return;
      item.btn.setPosition(item.x, item.y);
      item.btn.bg.setSize(buttonW, buttonH);
      item.btn.txt.setFontSize(`${Math.max(22, Math.floor(buttonH * 0.27))}px`);
      item.btn.zone.setPosition(item.x, item.y);
      item.btn.zone.setSize(buttonW, buttonH);
    });

    if (this.bossBarBg) {
      this.resizeHUD({ width, height });
    }
  }

  setupCollisions() {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.george, this.platforms);
    this.physics.add.collider(this.enemyGroup, this.platforms);
    this.physics.add.collider(this.boss, this.platforms);

    this.physics.add.overlap(this.playerBullets, this.enemyGroup, this.onPlayerBulletHitsEnemy, null, this);
    this.physics.add.overlap(this.georgeBullets, this.enemyGroup, this.onGeorgeBulletHitsEnemy, null, this);
    this.physics.add.overlap(this.playerBullets, this.boss, this.onPlayerBulletHitsBoss, null, this);
    this.physics.add.overlap(this.georgeBullets, this.boss, this.onGeorgeBulletHitsBoss, null, this);
    this.physics.add.overlap(this.enemyBullets, this.player, this.onEnemyBulletHitsPlayer, null, this);
    this.physics.add.overlap(this.enemyGroup, this.player, this.onEnemyTouchesPlayer, null, this);
    this.physics.add.overlap(this.boss, this.player, this.onBossTouchesPlayer, null, this);
    this.physics.add.overlap(this.player, this.collectibles, this.onCollectItem, null, this);
  }

  spawnBoss() {
    this.boss = new Boss(this, this.worldWidth - 240, this.groundY - 85);
  }

  onPlayerBulletHitsEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.takeDamage(this.player.getCurrentGun().damage);
    if (enemy.hp <= 0) { this.increaseStress(-4); this.increaseBudget(3); }
  }

  onGeorgeBulletHitsEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.takeDamage(34);
    if (enemy.hp <= 0) { this.increaseStress(-6); this.increaseBudget(5); }
  }

  onPlayerBulletHitsBoss(bullet, boss) {
    bullet.destroy();
    const baseDamage = this.player.getCurrentGun().damage;
    const georgeActive = this.george && this.george.activePartner;
    const effectiveDamage = georgeActive ? baseDamage : Math.max(1, Math.floor(baseDamage * 0.1));
    boss.takeDamage(effectiveDamage, false, georgeActive);
    this.updateBossBar();
  }

  onGeorgeBulletHitsBoss(bullet, boss) {
    bullet.destroy();
    boss.takeDamage(28, true, true);
    this.updateBossBar();
  }

  onEnemyBulletHitsPlayer(bullet) {
    bullet.destroy();
    this.damagePlayer(8, 6);
  }

  onEnemyTouchesPlayer(player, enemy) {
    if (!enemy.touchCooldown) {
      enemy.touchCooldown = true;
      this.damagePlayer(6, 8);
      this.time.delayedCall(700, () => { if (enemy && enemy.active) enemy.touchCooldown = false; });
    }
  }

  onBossTouchesPlayer() {
    this.damagePlayer(12, 12);
  }

  onCollectItem(player, item) {
    if (item.collectType === 'budget') this.increaseBudget(18);
    if (item.collectType === 'stress') this.increaseStress(20);
    if (item.collectType === 'life') this.lives = Math.min(5, this.lives + 1);
    item.destroy();
    this.updateHUD();
  }

  setupHUD() {
    this.hudRoot = this.add.container(0, 0).setScrollFactor(0).setDepth(1500);

    this.hudBg = this.add.rectangle(16, 16, Math.min(this.scale.width * 0.66, 520), 130, 0x000000, 0.34).setOrigin(0, 0).setStrokeStyle(2, 0xffffff, 0.2);
    this.hudTitle = this.add.text(28, 22, 'THE HOME BATTLE: BUYER BEWARE', { fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#ffffff' });
    this.budgetLabel = this.add.text(28, 52, 'Budget', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' });
    this.stressLabel = this.add.text(28, 82, 'Stress', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' });
    this.budgetBarBg = this.add.rectangle(112, 63, 180, 16, 0x333333).setOrigin(0, 0.5);
    this.budgetBar = this.add.rectangle(112, 63, 180, 16, 0x2ec4b6).setOrigin(0, 0.5);
    this.stressBarBg = this.add.rectangle(112, 93, 180, 16, 0x333333).setOrigin(0, 0.5);
    this.stressBar = this.add.rectangle(112, 93, 180, 16, 0xff9f1c).setOrigin(0, 0.5);
    this.livesText = this.add.text(310, 52, 'Lives: 3', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' });
    this.gunText = this.add.text(310, 76, 'Gun: Basic Pre-Approval Pistol', { fontFamily: 'Arial', fontSize: '17px', color: '#ffffff', wordWrap: { width: 220 } });
    this.agentText = this.add.text(310, 102, 'Agent Status: Offline', { fontFamily: 'Arial', fontSize: '18px', color: '#ffb703' });

    this.hudRoot.add([
      this.hudBg, this.hudTitle, this.budgetLabel, this.stressLabel, this.budgetBarBg, this.budgetBar,
      this.stressBarBg, this.stressBar, this.livesText, this.gunText, this.agentText
    ]);

    this.bossBarBg = this.add.rectangle(this.scale.width * 0.5, 26, Math.min(420, this.scale.width * 0.55), 18, 0x222222, 0.9).setScrollFactor(0).setDepth(1500).setVisible(false);
    this.bossBar = this.add.rectangle(this.bossBarBg.x - this.bossBarBg.width / 2, 26, this.bossBarBg.width, 18, 0xe63946).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1501).setVisible(false);
    this.bossText = this.add.text(this.scale.width * 0.5, 4, 'THE ESCROW BEAST', { fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1502).setVisible(false);

    this.scale.on('resize', this.resizeHUD, this);
    this.updateHUD();
  }

  resizeHUD(gameSize) {
    const width = gameSize.width;
    this.hudBg.width = Math.min(width * 0.66, 520);
    this.bossBarBg.setPosition(width * 0.5, 26);
    this.bossBarBg.width = Math.min(420, width * 0.55);
    this.bossBar.setPosition(this.bossBarBg.x - this.bossBarBg.width / 2, 26);
    this.bossText.setPosition(width * 0.5, 4);
  }

  updateHUD() {
    this.budget = Phaser.Math.Clamp(this.budget, 0, 100);
    this.stress = Phaser.Math.Clamp(this.stress, 0, 100);
    this.budgetBar.width = 180 * (this.budget / 100);
    this.stressBar.width = 180 * (this.stress / 100);
    this.livesText.setText(`Lives: ${this.lives}`);
    this.gunText.setText(`Gun: ${this.player.getCurrentGun().name}`);
    this.agentText.setText(`Agent Status: ${this.george.activePartner ? 'George Active' : 'Offline'}`);
    this.agentText.setColor(this.george.activePartner ? '#80ed99' : '#ffb703');
  }

  updateBossBar() {
    if (!this.boss || !this.boss.active) return;
    const show = this.player.x > this.worldWidth - 950;
    this.bossBarBg.setVisible(show);
    this.bossBar.setVisible(show);
    this.bossText.setVisible(show);
    const pct = Phaser.Math.Clamp(this.boss.hp / this.boss.maxHp, 0, 1);
    this.bossBar.width = this.bossBarBg.width * pct;
  }

  flashGunLabel() {
    this.updateHUD();
    this.tweens.add({ targets: this.gunText, scaleX: 1.08, scaleY: 1.08, duration: 90, yoyo: true });
  }

  showIntroBanner() {
    const banner = this.add.text(this.scale.width * 0.5, this.scale.height * 0.18, 'SURVIVE THE HOMEBUYING CHAOS\nAND CALL GEORGE WHEN IT GETS REAL', {
      fontFamily: 'Arial', fontSize: '26px', fontStyle: 'bold', color: '#ffffff', align: 'center',
      backgroundColor: 'rgba(0,0,0,0.45)', padding: { x: 18, y: 12 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);

    this.tweens.add({ targets: banner, alpha: 0, y: banner.y - 18, delay: 1800, duration: 700, onComplete: () => banner.destroy() });
  }

  playerShoot() {
    if (this.gameEnded) return;
    const bulletData = this.player.fire();
    if (!bulletData) return;

    if (bulletData.type === 'flame') {
      for (let i = 0; i < 2; i++) {
        const spreadY = Phaser.Math.Between(-10, 10);
        const bullet = this.playerBullets.create(this.player.x + bulletData.offsetX * this.player.facing, this.player.y - 12 + spreadY, 'bullet-flame');
        bullet.body.allowGravity = false;
        bullet.setVelocityX(bulletData.speed * this.player.facing);
        bullet.damage = bulletData.damage;
        bullet.setScale(1.1);
        bullet.setDepth(20);
        this.time.delayedCall(420, () => bullet.active && bullet.destroy());
      }
      return;
    }

    const bullet = this.playerBullets.create(this.player.x + bulletData.offsetX * this.player.facing, this.player.y - 12, bulletData.texture);
    bullet.body.allowGravity = false;
    bullet.setVelocityX(bulletData.speed * this.player.facing);
    bullet.damage = bulletData.damage;
    bullet.setDepth(20);
    bullet.setFlipX(this.player.facing < 0);
    this.time.delayedCall(1800, () => bullet.active && bullet.destroy());
  }

  georgeShootAtTarget(target) {
    if (!this.george.activePartner || !target || !target.active) return;
    const bullet = this.georgeBullets.create(this.george.x + 26 * this.george.facing, this.george.y - 18, 'bullet-george');
    bullet.body.allowGravity = false;

    const dx = target.x - this.george.x;
    const dy = (target.y - 22) - this.george.y;
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const speed = 760;

    bullet.setVelocity((dx / len) * speed, (dy / len) * speed);
    bullet.setDepth(20);
    bullet.setFlipX(this.george.facing < 0);
    this.time.delayedCall(2000, () => bullet.active && bullet.destroy());
  }

  enemyShoot(enemy) {
    if (!enemy.active) return;
    const bullet = this.enemyBullets.create(enemy.x, enemy.y - 16, 'bullet-enemy');
    bullet.body.allowGravity = false;

    const dx = this.player.x - enemy.x;
    const dy = (this.player.y - 10) - enemy.y;
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const speed = 420;

    bullet.setVelocity((dx / len) * speed, (dy / len) * speed);
    bullet.setDepth(18);
    this.time.delayedCall(2600, () => bullet.active && bullet.destroy());
  }

  activateGeorge() {
    if (this.gameEnded || this.george.activePartner || this.callAgentCooldown) return;
    this.callAgentCooldown = true;
    this.time.delayedCall(400, () => this.callAgentCooldown = false);

    this.george.setPosition(this.player.x - 90, this.player.y);
    this.george.setActive(true).setVisible(true);
    this.george.activePartner = true;

    const banner = this.add.text(this.scale.width * 0.5, this.scale.height * 0.24, 'GEORGE HAS ENTERED THE BATTLE', {
      fontFamily: 'Arial', fontSize: '28px', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#1d3557', padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2200);

    this.tweens.add({ targets: banner, alpha: 0, y: banner.y - 26, delay: 1200, duration: 600, onComplete: () => banner.destroy() });
    this.updateHUD();
  }

  damagePlayer(budgetDamage, stressDamage) {
    if (this.player.invulnerable || this.gameEnded) return;
    this.player.invulnerable = true;
    this.increaseBudget(-budgetDamage);
    this.increaseStress(-stressDamage);

    this.tweens.add({ targets: this.player, alpha: 0.25, duration: 100, yoyo: true, repeat: 7 });

    this.time.delayedCall(1000, () => {
      if (this.player) {
        this.player.invulnerable = false;
        this.player.setAlpha(1);
      }
    });

    if (this.budget <= 0 || this.stress <= 0) {
      this.lives -= 1;
      if (this.lives > 0) {
        this.budget = 70;
        this.stress = 70;
        this.player.setPosition(Math.max(140, this.player.x - 180), this.groundY - 70);
      } else {
        this.showGameOver();
      }
    }

    this.updateHUD();
  }

  increaseBudget(value) { this.budget = Phaser.Math.Clamp(this.budget + value, 0, 100); }
  increaseStress(value) { this.stress = Phaser.Math.Clamp(this.stress + value, 0, 100); }

  showGameOver() {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.physics.pause();
    this.showEndCard('GAME OVER', 'Your budget or stress meter hit zero.\nRefresh the page to play again.');
  }

  showWin() {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.physics.pause();
    this.showEndCard('DEAL CLOSED!', 'George helped you survive the process.\nA strong real estate agent can help spot issues, manage chaos, and get deals to the finish line.');
  }

  showEndCard(title, body) {
    this.add.rectangle(this.scale.width * 0.5, this.scale.height * 0.5, this.scale.width, this.scale.height, 0x000000, 0.68).setScrollFactor(0).setDepth(3000);
    this.add.rectangle(this.scale.width * 0.5, this.scale.height * 0.5, Math.min(this.scale.width * 0.84, 700), Math.min(this.scale.height * 0.54, 360), 0x1f2937, 0.95).setStrokeStyle(4, 0xffffff, 0.25).setScrollFactor(0).setDepth(3001);
    this.add.text(this.scale.width * 0.5, this.scale.height * 0.5 - 90, title, { fontFamily: 'Arial', fontSize: '42px', fontStyle: 'bold', color: '#ffffff', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(3002);
    this.add.text(this.scale.width * 0.5, this.scale.height * 0.5, body, { fontFamily: 'Arial', fontSize: '24px', color: '#f1f5f9', align: 'center', wordWrap: { width: Math.min(this.scale.width * 0.68, 560) } }).setOrigin(0.5).setScrollFactor(0).setDepth(3002);
    this.add.text(this.scale.width * 0.5, this.scale.height * 0.5 + 105, 'Refresh the page to play again', { fontFamily: 'Arial', fontSize: '20px', color: '#ffd166' }).setOrigin(0.5).setScrollFactor(0).setDepth(3002);
  }

  tryFullscreenOnFirstTouch() {
    this.input.once('pointerdown', () => {
      if (this.scale.isFullscreen || !this.scale.game.device.fullscreen.available) return;
      try { this.scale.startFullscreen(); } catch (e) {}
    });
  }

  getJoystickState() {
    if (this.joystickMode === 'rex' && this.joystick) {
      const radius = 75;
      return {
        moveX: Phaser.Math.Clamp(this.joystick.forceX / radius, -1, 1),
        moveY: Phaser.Math.Clamp(this.joystick.forceY / radius, -1, 1),
        analogAmount: Phaser.Math.Clamp(this.joystick.force / radius, 0, 1)
      };
    }

    if (this.joystickData) {
      const radius = this.joystickData.radius || 75;
      return {
        moveX: Phaser.Math.Clamp(this.joystickData.forceX / radius, -1, 1),
        moveY: Phaser.Math.Clamp(this.joystickData.forceY / radius, -1, 1),
        analogAmount: Phaser.Math.Clamp(this.joystickData.force / radius, 0, 1)
      };
    }

    return { moveX: 0, moveY: 0, analogAmount: 0 };
  }

  handleOrientationPause() {
    const forcedPortrait = !!window.__forceLandscape;
    if (forcedPortrait && !this.orientationPaused) {
      this.orientationPaused = true;
      this.physics.pause();
    } else if (!forcedPortrait && this.orientationPaused && !this.gameEnded) {
      this.orientationPaused = false;
      this.physics.resume();
    }
    return this.orientationPaused;
  }

  update(time) {
    if (this.gameEnded) return;
    if (this.handleOrientationPause()) return;

    const leftDown = this.keys.left.isDown || this.keys.a.isDown;
    const rightDown = this.keys.right.isDown || this.keys.d.isDown;
    const upDown = this.keys.up.isDown || this.keys.w.isDown;
    const downDown = this.keys.down.isDown || this.keys.s.isDown;

    const keyboardX = (leftDown ? -1 : 0) + (rightDown ? 1 : 0);
    const keyboardY = (upDown ? -1 : 0) + (downDown ? 1 : 0);
    const keyboardShoot = this.keys.ctrl.isDown || this.keys.j.isDown;
    const keyboardJumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.space);

    if (keyboardJumpPressed) this.player.tryJump();

    let { moveX, moveY, analogAmount } = this.getJoystickState();

    if (keyboardX !== 0 || keyboardY !== 0) {
      moveX = keyboardX;
      moveY = keyboardY;
      analogAmount = 1;
    }

    this.player.updateMovement(moveX, moveY, analogAmount);

    if (this.shootHeld || keyboardShoot) this.playerShoot();

    if (this.george.activePartner) {
      const target = this.getPriorityTarget();
      this.george.updateAI(this.player, target, time);
      if (this.george.canFire(time) && target) {
        this.georgeShootAtTarget(target);
        this.george.recordFire(time);
      }
    }

    this.enemyGroup.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;
      enemy.updateAI(this.player, time);
      if (enemy.canShootAtPlayer(this.player, time)) {
        this.enemyShoot(enemy);
        enemy.recordShot(time);
      }
    });

    if (this.boss && this.boss.active) {
      this.boss.updateAI(this.player, time);
      if (this.boss.hp <= 0) {
        this.boss.destroy();
        this.showWin();
      }
    }

    this.cleanupOffscreenBullets(this.playerBullets);
    this.cleanupOffscreenBullets(this.georgeBullets);
    this.cleanupOffscreenBullets(this.enemyBullets);
    this.updateBossBar();
    this.updateHUD();
  }

  cleanupOffscreenBullets(group) {
    group.children.iterate((bullet) => {
      if (!bullet || !bullet.active) return;
      if (bullet.x < -100 || bullet.x > this.worldWidth + 100 || bullet.y < -100 || bullet.y > this.worldHeight + 100) bullet.destroy();
    });
  }

  getPriorityTarget() {
    if (this.boss && this.boss.active && Phaser.Math.Distance.Between(this.george.x, this.george.y, this.boss.x, this.boss.y) < 1200) return this.boss;
    let nearest = null;
    let nearestDist = Infinity;
    this.enemyGroup.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;
      const dist = Phaser.Math.Distance.Between(this.george.x, this.george.y, enemy.x, enemy.y);
      if (dist < nearestDist) { nearest = enemy; nearestDist = dist; }
    });
    return nearest;
  }
}
