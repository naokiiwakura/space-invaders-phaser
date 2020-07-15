import { Component } from '@angular/core';


declare var Phaser;

let game;
let startfield;
let cursors;
let player;
let bullets;
let enemyBullets;
let fireButton;
let that;
let bulletTime = 0;
let aliens;
let explosions;
let scoreString = '';
let scoreText;
let score = 0;
let firingTimer = 0;
let livingEnemies = [];
let lives;


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor() {

    game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, 'space-invaders',
      { preload: this.preload, create: this.create, update: this.update, render: this.render });

    that = Object.create(this.constructor.prototype);
  }


  preload() {
    game.load.image('bullet', 'assets/phaser/bullet.png');
    game.load.image('enemyBullet', 'assets/phaser/enemy-bullet.png');
    game.load.spritesheet('invader', 'assets/phaser/invader32x32x4.png', 32, 32);
    game.load.image('ship', 'assets/phaser/player.png');
    game.load.spritesheet('kaboom', 'assets/phaser/explode.png', 128, 128);
    game.load.image('starfield', 'assets/phaser/starfield.png');
  }

  create() {
    startfield = game.add.tileSprite(0, 0, window.innerWidth, window.innerHeight, 'starfield');


    scoreString = 'Score : ';
    scoreText = game.add.text(10,10, scoreString + score, {font: '24px Arial', fill: '#fff'});


    //Configurando nossos tiros
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);


    //Configurando os tiros do oponente
    enemyBullets = game.add.group();
    enemyBullets.enableBody = true;
    enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    enemyBullets.createMultiple(30, 'enemyBullet');
    enemyBullets.setAll('anchor.x', 0.5);
    enemyBullets.setAll('anchor.y', 1);

    //Vidas do jogador
    lives = game.add.group();
    game.add.text(game.world.width - 100, 10, 'Vidas : ', {font: '24px Arial', fill: '#fff'});

    for(let i = 0; i < 3; i++)
    {
      let ship = lives.create(game.world.width - 100 + (30 * i), 60, 'ship');
      ship.anchor.setTo(0.5,0.5);
      ship.angle = 90;
    }


    //nossa nave
    player = game.add.sprite(window.innerWidth / 2, window.innerHeight - 100, 'ship');
    player.anchor.setTo(0.5, 0.5);
    game.physics.enable(player, Phaser.Physics.ARCADE);



    //nossos oponentes
    aliens = game.add.group();
    aliens.enableBody = true;
    aliens.physicsBodyType = Phaser.Physics.ARCADE;
    that.createAliens();


    explosions = game.add.group();
    explosions.createMultiple(35, 'kaboom');
    explosions.forEach(that.setupInvader, this);

    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  }

  update() {

    startfield.tilePosition.y += 2;

    player.body.velocity.setTo(0, 0);
    if (cursors.left.isDown) {
      player.body.velocity.x = -200;
    }
    else if (cursors.right.isDown) {
      player.body.velocity.x = 200;
    }

    if (cursors.up.isDown) {
      player.body.velocity.y = -200;
    }
    else if (cursors.down.isDown) {
      player.body.velocity.y = 200;
    }

    if (fireButton.isDown) {
      that.fireBullet();
    }

    if( game.time.now > firingTimer)
    {
        that.enemyFires();
    }




    game.physics.arcade.overlap(bullets, aliens, that.collisionHandler, null, this);
    game.physics.arcade.overlap(enemyBullets, player, that.enemyHitsPlayer, null, this);

  }

  render() {

  }


  collisionHandler(bullet, alien) {
    bullet.kill();
    alien.kill();

    score += 10;
    scoreText.text = scoreString + score;

    let explosion = explosions.getFirstExists(false);
    explosion.reset(alien.body.x, alien.body.y);
    explosion.play('kaboom', 30, false, true);
  }


  fireBullet() {
    if (game.time.now > bulletTime) {

      let bullet = bullets.getFirstExists(false);

      if (bullet) {
        bullet.reset(player.x, player.y + 8);
        bullet.body.velocity.y = -400;
        bulletTime = game.time.now + 200;
      }
    }
  }

  createAliens() {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 8; x++) {
        let alien = aliens.create(x * ((window.innerWidth - 100) / 8), y * 50, 'invader');
        alien.anchor.setTo(0.5, 0.5);
        alien.animations.add('fly', [0, 1, 2, 3], 2, true);
        alien.play('fly');
        alien.body.moves = false;
      }
    }

    aliens.x = 10;
    aliens.y = 50;

    let tween = game.add.tween(aliens).to({ x: 90 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    tween.onLoop.add(that.descend, this);
  }

  setupInvader(invader) {
    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('kaboom');
  }

  descend() {
    aliens.y += 10;
  }

  enemyFires()
  {
    let enemyBullet = enemyBullets.getFirstExists(false);

    livingEnemies.length = 0;

    aliens.forEachAlive(function(alien) {
      livingEnemies.push(alien);
    });

    if(enemyBullet && livingEnemies.length > 0)
    {
      let random = game.rnd.integerInRange(0, livingEnemies.length - 1);
      
      let shooter = livingEnemies[random];

      enemyBullet.reset(shooter.body.x, shooter.body.y);
      
      game.physics.arcade.moveToObject(enemyBullet, player, 120);
      firingTimer = game.time.now + 2000;

    }
  }

  enemyHitsPlayer(player, bullet)
  {
    bullet.kill();


    let live = lives.getFirstAlive();
    if(live) {
      live.kill();
    }

    let explosion = explosions.getFirstExists(false);
    explosion.reset(player.body.x, player.body.y);
    explosion.play('kaboom', 30, false, true);


    if(lives.countLiving() < 1)
    {
      player.kill();
    }


  }


}
