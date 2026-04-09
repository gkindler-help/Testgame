export default class GeorgeAgent extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'george');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.setDepth(29);
    this.setCollideWorldBounds(true);
    this.setDragX(1000);
    this.setMaxVelocity(260, 900);
    this.body.setSize(30, 58);
    this.body.setOffset(14, 4);

    this.activePartner = false;
    this.facing = 1;
    this.lastShotTime = 0;
    this.fireRate = 260;
  }

  updateAI(player, target, time) {
    if (!this.activePartner) return;

    const followDistance = 90;
    const stopDistance = 56;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const absDx = Math.abs(dx);

    if (absDx > followDistance) {
      const dir = dx > 0 ? 1 : -1;
      this.setVelocityX(dir * 225);
      this.facing = dir;
      this.setFlipX(dir < 0);
    } else if (absDx < stopDistance) {
      this.setVelocityX(0);
    }

    const grounded = this.body.blocked.down || this.body.touching.down;
    if (dy < -80 && grounded) {
      this.setVelocityY(-560);
    }

    if (target && Math.abs(target.x - this.x) > 10) {
      this.facing = target.x > this.x ? 1 : -1;
      this.setFlipX(this.facing < 0);
    }
  }

  canFire(time) {
    return time >= this.lastShotTime + this.fireRate;
  }

  recordFire(time) {
    this.lastShotTime = time;
  }
}
