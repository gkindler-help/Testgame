export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'listing') {
    const texture = type === 'listing' ? 'enemy-basic' : 'enemy-small';
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.type = type;
    this.setDepth(26);
    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.setDragX(900);
    this.setMaxVelocity(180, 900);

    this.touchCooldown = false;
    this.lastShotTime = 0;

    switch (type) {
      case 'listing':
        this.hp = 55; this.speed = 110; this.range = 360; this.fireRate = 1800; break;
      case 'goblin':
        this.hp = 34; this.speed = 90; this.range = 420; this.fireRate = 1400; break;
      default:
        this.hp = 28; this.speed = 135; this.range = 250; this.fireRate = 2200; break;
    }

    this.body.setSize(26, 54);
    this.body.setOffset(14, 8);
  }

  updateAI(player, time) {
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const grounded = this.body.blocked.down || this.body.touching.down;

    if (dist > 700) {
      this.setVelocityX(0);
      return;
    }

    if (dist < this.range) {
      const dir = dx > 0 ? 1 : -1;
      this.setFlipX(dir < 0);

      if (this.type === 'listing') {
        this.setVelocityX(dir * this.speed);
      } else if (this.type === 'goblin') {
        if (dist > 180) this.setVelocityX(dir * this.speed);
        else this.setVelocityX(0);
      } else {
        this.setVelocityX(dir * this.speed);
        if (grounded && dist > 120 && dist < 220 && Phaser.Math.Between(0, 100) < 2) {
          this.setVelocityY(-360);
        }
      }
    } else {
      this.setVelocityX(0);
    }
  }

  canShootAtPlayer(player, time) {
    if (!this.active || this.type === 'listing') return false;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    return dist < this.range && time >= this.lastShotTime + this.fireRate;
  }

  recordShot(time) {
    this.lastShotTime = time;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.25,
      duration: 50,
      yoyo: true,
      repeat: 1
    });
    if (this.hp <= 0) this.destroy();
  }
}
