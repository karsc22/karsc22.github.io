
var c = document.getElementById("myCanvas");
//var c = document.querySelector('canvas');
var ctx = c.getContext("2d");
var width = c.width;
var height = c.height;
var psfont = new FontFace('psfont', 'url(PressStart2P-Regular.ttf)');
document.fonts.add(psfont);
ctx.font = "22px psfont"; // set font
const size = 100;
const numMissiles = 2;
const sonarx = 142;
const sonary = 610;
const sonarRadius = 45;
var sonarTimer = 0;

var frames = 0;
var frameTimer = Date.now();
var yourScore = 0;
var enemyScore = 0;
var timeLeft = 120;
var lastTime = Date.now();
var centerx = 455;
var centery = 338;
var radius = 290;
var fps;
var enemyVisibleTimer = 0;
var enemyRadarX = 0;
var enemyRadarY = 0;
var enemyRadarTime = 0;


function distSquared(x1, x2, y1, y2) {
	return (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
}

function drawSonar() {
	ctx.beginPath();
	ctx.moveTo(sonarx, sonary);
	
	ctx.lineTo(sonarx + sonarRadius*Math.cos(sonarTimer*2), 
			   sonary + sonarRadius*Math.sin(sonarTimer*2));
	ctx.stroke();
	
	var angleToCenter = Math.atan2(Math.cos(sonarTimer*2), Math.sin(sonarTimer*2));
	var enemyAngle = Math.atan2(enemy.x - centerx, enemy.y-centery)
	
	if (Math.abs(angleToCenter - enemyAngle) < 0.1 && enemyRadarTime <= 2) {
		enemyRadarX = (enemy.x-centerx)*(sonarRadius/radius)+sonarx;
		enemyRadarY = (enemy.y-centery)*(sonarRadius/radius)+sonary;
		enemyRadarTime = 3.0;
	}
	if (enemyRadarTime > 0) {
		ctx.beginPath();
		ctx.fillStyle = "rgba(255, 255, 255, " + enemyRadarTime/3 + ")";
		ctx.rect(enemyRadarX, enemyRadarY, 7, 7);
		//ctx.arc(enemyRadarX, enemyRadarY, 4, 0, Math.PI*2);
		ctx.fill();
	}

		
}

class Missile {
	constructor(target) {
		this.x = 0;
		this.y = 0;
		this.angle = 0;
		this.speed = 200;
		this.isActive = false;
		this.target = target;
		this.explodeTime = 0;
		this.size = 100;
	}
	update(dt){
		if (this.explodeTime > 0) { this.explodeTime -= dt; }
		else if (this.isActive) {
			this.x += Math.cos(this.angle)*dt*this.speed;
			this.y += Math.sin(this.angle)*dt*this.speed;
			if (distSquared(this.x, centerx, this.y, centery) > radius*radius) {
				this.isActive = false;
				this.explodeTime = 1.5;
			}
			if (distSquared(this.x, this.target.x, this.y, this.target.y) < 25*25) {
				this.isActive = false;
				this.explodeTime = 1.5;
				if (this.target == player) {
					enemyScore++;
				} else {
					yourScore++;
					enemyVisibleTimer = 1;
				}
			}
		}
	}
	draw() {
		if (this.explodeTime > 0) {
			this.angle += 0.1;
			var img = document.getElementById("explosion");
			//console.log(this.x);
			ctx.translate(this.x, this.y);
			if ((this.explodeTime * 10) % 1 > 0.5) {
				//ctx.rotate(this.angle);
				ctx.scale(-1,-1);
				ctx.drawImage(img, -this.size/2, -this.size/2);
				
				ctx.scale(-1,-1);
				//ctx.rotate(-this.angle);
			} else {
				ctx.drawImage(img, -5, -5);
			}
			ctx.translate(-this.x, -this.y);
		}
		else if (this.isActive) {
			var img = document.getElementById("sub");
			//console.log(this.x);
			ctx.translate(this.x, this.y);
			ctx.rotate(this.angle);
			ctx.drawImage(img, -5, -5, 10, 10);
			ctx.rotate(-this.angle);
			ctx.translate(-this.x, -this.y);
		}
	}
}

class Sub {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.angle = 0;
		this.width = 50;
		this.height = 50;
		this.speed = 100;
		this.missiles = [];
		for (let i = 0; i < numMissiles; i++) {
			this.missiles.push(new Missile());
		}
	}
	
	draw() {
		//if (this != enemy || (enemyVisibleTimer * 10) % 1 > 0.5) {
			var img = document.getElementById("sub");
			//console.log(this.x);
			ctx.translate(this.x, this.y);
			ctx.rotate(this.angle);
			ctx.drawImage(img, -this.width/2, -this.height/2);
			ctx.rotate(-this.angle);
			ctx.translate(-this.x, -this.y);
		//}
		
		for (let i = 0; i < numMissiles; i++) {
			this.missiles[i].draw();
		}
		
	}
	update(dt){
		this.x += Math.cos(this.angle)*dt*this.speed;
		this.y += Math.sin(this.angle)*dt*this.speed;
		
		//collide with outer wall
		if (distSquared(this.x, centerx, this.y, centery) > (radius-18)*(radius - 18)) {
			var angleToCenter = Math.atan2(this.x - centerx, this.y-centery);
			
			this.x = centerx + Math.sin(angleToCenter)*(radius-20);
			this.y = centery + Math.cos(angleToCenter)*(radius-20);
			
			if (this == enemy && enemyVisibleTimer <= 0) {
				enemyVisibleTimer = 1;
			}
		}
		
		for (let i = 0; i < numMissiles; i++) {
			this.missiles[i].update(dt);
		}
		
	}
	
	fireMissile(target) {
		var shot = false;
		for (let i = 0; i < numMissiles && !shot; i++) {
			if (!this.missiles[i].isActive && this.missiles[i].explodeTime <= 0) {
				console.log("shot! " + i);
				this.missiles[i].isActive = true;
				this.missiles[i].x = this.x;
				this.missiles[i].y = this.y;
				this.missiles[i].angle = this.angle;
				this.missiles[i].target = target;
				shot = true;
			}
		}

		
	}
}

var player = new Sub(300, 300)
var enemy = new Sub(500, 300)

function clear() {
	ctx.fillStyle = "black";
	ctx.strokeStyle = "white";
	ctx.fillRect(0, 0, width, height);
	var img = document.getElementById("bg");
	ctx.drawImage(img, 10, 10);
	ctx.beginPath();
	ctx.arc(centerx, centery, radius, 0, Math.PI*2);
	ctx.stroke();
}


function draw() {
	clear();
	
	ctx.textAlign = "left";
	frames++;
	if (Date.now()- frameTimer > 1000) {
		fps = frames; //1000*frames / (Date.now()- frameTimer);
		frames = 0;
		frameTimer = Date.now();
		timeLeft--;
		if (timeLeft < 0) timeLeft = 0;
	}
	ctx.fillStyle = "white";
	ctx.fillText("FPS: " + fps, 700, 650);
	ctx.fillText("YOUR SCORE", 120, 28);
	ctx.fillText(yourScore, 231, 53);
	
	ctx.fillText("ENEMY SCORE", 572, 28);
	ctx.fillText(enemyScore, 705, 53);
	
	ctx.fillText("TIME" , 200, 630);
	ctx.fillText(Math.floor(timeLeft / 60) + ":" + String(Math.round(timeLeft) % 60).padStart(2, '0') , 200, 660);
	
	
	player.draw();
	enemy.draw();
	drawSonar();
}

turnTime = 0;
turnAmount = 0;
missileTimer = 5
function updateEnemyLogic(dt) {
	turnTime -= dt;
	missileTimer -= dt;
	if (missileTimer <= 0) {
		enemy.fireMissile(player);
		missileTimer = Math.random()*3 +2;
	}
	
	if (turnTime <= 0) {
		turnTime = Math.random()*3;
		turnAmount = Math.random()*6 - 3;
	}
	enemy.angle += turnAmount * dt;
}

function update(dt) {
	player.update(dt);
	updateEnemyLogic(dt);
	enemy.update(dt);
	
	enemyVisibleTimer -= dt;
	if (enemyVisibleTimer <= 0) {
		enemyVisibleTimer = 0;
	}
	sonarTimer += dt;
	
	enemyRadarTime -= dt;
	
}

function main() {
	draw();
	update((Date.now() - lastTime)/1000);
	lastTime = Date.now();
	requestAnimFrame(main);
}


addEventListener('mousemove', (event) => {
	mousex = event.x;
	mousey = event.y;
	player.angle = Math.atan2(player.x - mousex, mousey-player.y) + Math.PI / 2;
});

addEventListener('mousedown', (event) => {
	console.log(event.x + ", " + event.y);
	player.fireMissile(enemy);
});

addEventListener('mouseup', (event) => {
	var found = false;
	dragging = null;
});

	

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    || window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     || function(main, element){
              window.setTimeout(main, 1000 / 60);
            };
})();

main();