export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.setDepth(30);
    this.setBounce(0);
    this.setDragX(1200);
    this.setMaxVelocity(280, 900);
    this.body.setSize(28, 56);
    this.body.setOffset(14, 6);

    this.facing = 1;
    this.invulnerable = false;

    this.guns = [
      {
        name: 'Basic Pre-Approval Pistol',
        damage: 12,
        fireRate: 220,
        speed: 820,
        texture: 'bullet-player',
        type: 'normal',
        offsetX: 26
      },
      {
        name: 'Cash Offer Blaster',
        damage: 22,
        fireRate: 340,
        speed: 960,
        texture: 'bullet-player',
        type: 'normal',
        offsetX: 28
      },
      {
        name: 'Renovation Flamethrower',
        damage: 9,
        fireRate: 90,
        speed: 520,
        texture: 'bullet-flame',
        type: 'flame',
        offsetX: 30
      }
    ];

    this.currentGunIndex = 0;
    this.lastShotTime = 0;

    this.walkSpeed = 145;
    this.runSpeed = 285;
    this.airControl = 0.78;
    this.jumpSpeed = -620;
  }

  getCurrentGun() {
    return this.guns[this.currentGunIndex];
  }

  cycleGun() {
    this.currentGunIndex = (this.currentGunIndex + 1) % this.guns.length;
  }

  tryJump() {
    if (this.body.blocked.down || this.body.touching.down) {
      this.setVelocityY(this.jumpSpeed);
    }
  }

  updateMovement(inputX, inputY, analogAmount) {
    const grounded = this.body.blocked.down || this.body.touching.down;
    const speed = Phaser.Math.Linear(this.walkSpeed * 0.35, this.runSpeed, analogAmount);

    if (Math.abs(inputX) > 0.08) {
      const control = grounded ? 1 : this.airControl;
      this.setVelocityX(inputX * speed * control);

      if (inputX > 0) {
        this.facing = 1;
        this.setFlipX(false);
      } else if (inputX < 0) {
        this.facing = -1;
        this.setFlipX(true);
      }
    } else if (grounded) {
      this.setVelocityX(0);
    }

    if (!grounded && Math.abs(inputY) > 0.08) {
      this.setVelocityX(this.body.velocity.x + inputX * 4);
    }
  }

  fire() {
    const now = this.scene.time.now;
    const gun = this.getCurrentGun();

    if (now < this.lastShotTime + gun.fireRate) return null;
    this.lastShotTime = now;

    return {
      texture: gun.texture,
      damage: gun.damage,
      speed: gun.speed,
      type: gun.type,
      offsetX: gun.offsetX
    };
  }
}
