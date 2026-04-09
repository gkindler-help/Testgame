export default class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'boss');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.setDepth(35);
    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.setDragX(800);
    this.setMaxVelocity(180, 900);
    this.body.setSize(88, 112);
    this.body.setOffset(20, 4);

    this.maxHp = 1800;
    this.hp = this.maxHp;

    this.contactDamageCooldown = false;
    this.lastRoar = 0;
    this.phase = 1;
    this.baseSpeed = 90;
  }

  updateAI(player, time) {
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const grounded = this.body.blocked.down || this.body.touching.down;

    if (this.hp < this.maxHp * 0.65) this.phase = 2;
    if (this.hp < this.maxHp * 0.3) this.phase = 3;

    const speed = this.baseSpeed + (this.phase - 1) * 18;

    if (dist > 90) {
      const dir = dx > 0 ? 1 : -1;
      this.setVelocityX(dir * speed);
      this.setFlipX(dir < 0);
    } else {
      this.setVelocityX(0);
    }

    if (grounded && dist > 140 && dist < 380 && time > this.lastRoar + 2200) {
      this.lastRoar = time;
      this.setVelocityY(-540);
      this.setVelocityX((dx > 0 ? 1 : -1) * (180 + this.phase * 15));
    }
  }

  takeDamage(amount, fromGeorge = false, georgeActive = false) {
    let effective = amount;

    if (!georgeActive) {
      effective = Math.max(1, Math.floor(amount * 0.1));
    } else {
      if (fromGeorge) {
        effective = Math.floor(amount * 1.6);
      } else {
        effective = amount;
      }
    }

    this.hp = Math.max(0, this.hp - effective);

    this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      duration: 60,
      yoyo: true,
      repeat: 1
    });
  }
}
