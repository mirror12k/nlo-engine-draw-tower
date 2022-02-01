
var game;


function CheatService() {
	Entity.call(this, game);
	this.cheats_enabled = true;
}
CheatService.prototype = Object.create(Entity.prototype);
CheatService.prototype.update = function(game) {
	Entity.prototype.update.call(this, game);

	if (this.cheats_enabled) {

		if (game.is_key_pressed('s')) {
			game.services.enemy_service.sub_entities.forEach(e => e.speed = Math.min(e.speed + 100, 500));
		} else if (game.is_key_pressed('d')) {
			game.services.enemy_service.sub_entities.forEach(e => e.speed = Math.max(e.speed - 100, 15));
		} else if (game.is_key_pressed('a')) {
			for (var i = 0; i < 10; i++)
				game.services.enemy_service.spawn_enemy(game.services.enemy_service.primary_path);
		} else if (game.is_key_pressed('c')) {
			game.services.enemy_service.remove_entities(game.services.enemy_service.sub_entities);
			game.services.projectile_service.remove_projectiles(game.services.projectile_service.projectiles);
		}
	}

};

function UserInputService() {
	Entity.call(this, game);

	// this.fade_path = true;


	this.add_entity(this.hearts_brackets = new BracketsDisplay(game.canvas.width / 2, game.canvas.height - 50));
	for (var i = 0; i < game.services.player_service.health; i++)
		this.hearts_brackets.add_entity(new ScreenEntity(game, 0,0,32,32, game.images.heart));
	this.hearts_brackets.respace_all();
}
UserInputService.prototype = Object.create(Entity.prototype);
UserInputService.prototype.update = function(game) {
	Entity.prototype.update.call(this, game);


	while (this.hearts_brackets.sub_entities.length > game.services.player_service.health && this.hearts_brackets.sub_entities.length > 0) {
		var heart_ent = this.hearts_brackets.sub_entities[0];
		this.hearts_brackets.remove_entity(heart_ent);
		this.hearts_brackets.respace_all();

		game.services.blood_service.break_image(heart_ent.px + this.hearts_brackets.px, heart_ent.py + this.hearts_brackets.py, heart_ent.image);
	}


	if (game.is_mouse_pressed()) {
		if (
				(this.current_template = game.query_entities(DraggableTemplate).find(t => dist_sqr(t, game.mouse_game_position) < t.width * t.width / 4))
				) {





		} else if (
				(this.current_target = game.query_entities(TargetCircle).find(t => dist_sqr(t, game.mouse_game_position) < t.radius * t.radius))
				&& !this.current_target.connected_target) {

			this.current_target.radius_target = 5;
			game.query_entities(GoalCircle).forEach(t => t.radius_target = t.__radius);

			// create a scribble
			game.add_entity(this.scribble = new Scribble([game.mouse_game_position, game.mouse_game_position, game.mouse_game_position]));

			var ink_amount = 1800;

			// drag it until the player releases the mouse button
			this.until(() => !game.mouse1_state && ink_amount >= 0, () => {
				var p = game.mouse_game_position;
				var d = dist(p, this.scribble.points[this.scribble.points.length-1]);
				var max = 20 + Math.random() * 20;
				if (d > max) {
					var n = unit_vector(vector_delta(this.scribble.points[this.scribble.points.length-1], addp(p, unit_mul(rand_vector(), Math.random() * 50))));
					p = addp(
							unit_mul(n, max),
							this.scribble.points[this.scribble.points.length-1]);
					d = dist(p, this.scribble.points[this.scribble.points.length-1]);

				}
				if (ink_amount >= d
						&& !game.query_entities(NonBuildableCircle).find(circle => dist(circle, p) < circle.radius + 10)
						&& !game.find_at(NonBuildableRectangle, p)
						&& p.px >= 0 && p.px <= game.canvas.width
						&& p.py >= 0 && p.py <= game.canvas.height) {
					ink_amount -= d;
					this.scribble.add_point(p);
				// } else {
				// 	ink_amount = -1;
				}
			}, () => {
				if (this.last_scribble)
					game.remove_entity(this.last_scribble);

				var p = this.scribble.points[this.scribble.points.length-1];

				if (this.reached_target = game.query_entities(GoalCircle).find(t => dist_sqr(t, p) < t.radius * t.radius)) {
					this.current_target.connected_target = this.reached_target;

					game.add_entity(this.second_scribble = new Scribble());
					this.second_scribble.z_index = -2;
					this.second_scribble.px = 2;
					this.second_scribble.py = 2;
					this.second_scribble.color = '#c62'; // '#c62';
					this.second_scribble.line_width = 10;
					this.second_scribble.play_pointset(this.scribble.points);

					var path = [... this.scribble.points];
					game.services.enemy_service.primary_path = path;
					this.every(3, () => {
						if (game.services.player_service.is_alive)
							game.services.enemy_service.spawn_enemy(path);
					});

					game.services.turret_service.is_firing = true;

					// game.add_entity(this.dark_scribble = new Scribble());
					// game.add_entity(this.second_dark_scribble = new Scribble());
					// this.dark_scribble.z_index = 2;
					// this.dark_scribble.is_greyscale = true;
					// this.dark_scribble.line_width = 5;
					// this.second_dark_scribble.z_index = -1;
					// this.second_dark_scribble.is_greyscale = true;
					// this.second_dark_scribble.line_width = 10;
					// this.second_dark_scribble.px = 2;
					// this.second_dark_scribble.py = 2;
					// var farthest = 0;
					// this.dark_scribble.every(0.1, () => {
					// 	game.services.enemy_service.sub_entities.forEach(e => farthest = Math.max(farthest, e.index));
					// 	while(this.dark_scribble.points.length < farthest) {
					// 		this.dark_scribble.add_point(path[this.dark_scribble.points.length]);
					// 		this.second_dark_scribble.add_point(path[this.second_dark_scribble.points.length]);
					// 	}
					// });

				} else {
					this.current_target.radius_target = this.current_target.__radius;
					this.scribble.do_fade = true;
					var s = this.scribble;
					this.scribble.after(1.1, () => {
						s.do_fade = false;
					});

					this.last_scribble = this.scribble;
				}
				game.query_entities(GoalCircle).forEach(t => t.radius_target = 5);
			});
		}
	}


	// if (game.is_key_pressed('=')) {
	// 	if (this.interacting_ent) {
	// 		this.interacting_ent.value = Math.abs(this.interacting_ent.value);
	// 	}
	// } else if (game.is_key_pressed('-')) {
	// 	if (this.interacting_ent) {
	// 		this.interacting_ent.value = -Math.abs(this.interacting_ent.value);
	// 	}

};

function PlayerService() {
	Entity.call(this, game);

	this.health = 10;
	this.is_alive = true;
}
PlayerService.prototype = Object.create(Entity.prototype);
PlayerService.prototype.update = function(game) {
	Entity.prototype.update.call(this, game);

	// ...
};
PlayerService.prototype.take_damage = function(dmg) {
	this.health--;
	if (this.health <= 0) {
		this.is_alive = false;
	}
};



function EnemyService() {
	Entity.call(this, game);

	// this.fade_path = true;
	this.create_canvas();

	this.z_index = 20;

}
EnemyService.prototype = Object.create(Entity.prototype);
EnemyService.prototype.update = function(game) {
	Entity.prototype.update.call(this, game);

	var collisons = this.sub_entities
		.map(ent => { return { ent: ent, projs: game.services.projectile_service.projectiles.filter(p => dist_sqr(ent, p) < 400) }; })
		.filter(col => col.projs.length > 0);

	var projs = [];
	for (var col of collisons) {
		col.ent.health -= 1;
		projs.push(...col.projs);
		for (var p of projs) {
			game.services.blood_service.draw_blood(p.px, p.py, 4);
		}
	}
	game.services.projectile_service.remove_projectiles(projs);

	this.remove_entities(collisons.filter(col => col.ent.health <= 0).map(col => col.ent));

};
EnemyService.prototype.draw = function(ctx) {
	// ctx.drawImage(this.buffer_canvas, 0, 0);
	// Entity.prototype.draw.call(this, ctx);
	this.redraw_canvas_fade(game.deltatime);
	var local_ctx = this.buffer_canvas.getContext('2d');
	local_ctx.imageSmoothingEnabled = false;
	Entity.prototype.draw.call(this, local_ctx);

	ctx.drawImage(this.buffer_canvas, 0, 0);
	// ctx.drawImage(this.buffer_canvas, 0, 0);
};
EnemyService.prototype.create_canvas = function() {
	this.buffer_canvas = document.createElement('canvas');
	this.buffer_canvas.width = game.canvas.width;
	this.buffer_canvas.height = game.canvas.height;
	this.redraw_amount = 0;
};
EnemyService.prototype.redraw_canvas_fade = function(amount) {
	this.redraw_amount += amount;

	var new_buffer_canvas = document.createElement('canvas');
	new_buffer_canvas.width = game.canvas.width;
	new_buffer_canvas.height = game.canvas.height;
	var new_buffer_context = new_buffer_canvas.getContext('2d');
	// new_buffer_context.globalAlpha = 1 - amount;
	// new_buffer_context.filter = 'blur(1px)';
	new_buffer_context.drawImage(this.buffer_canvas, 0, 0);
	// new_buffer_context.globalAlpha = 1;
	if (this.redraw_amount > 0.05) {
		this.redraw_amount -= 0.05;
		new_buffer_context.fillStyle = 'rgba(1,1,1,0.9)';
		new_buffer_context.globalCompositeOperation = 'source-in';
		new_buffer_context.fillRect(0, 0, game.canvas.width, game.canvas.height);
		new_buffer_context.globalCompositeOperation = 'source-over';
	}
	this.buffer_canvas = new_buffer_canvas;
};
EnemyService.prototype.spawn_enemy = function(path) {
	if (Math.random() < 0.25) {
		this.add_entity(new MachineEnemy(path[0].px, path[0].py, path));
	} else {
		this.add_entity(new CrawlerEnemy(path[0].px, path[0].py, path));
	}
};




function BloodService() {
	Entity.call(this, game);

	// this.fade_path = true;
	this.create_canvas();


	this.particles = [];

	this.z_index = 40;

}
BloodService.prototype = Object.create(Entity.prototype);
// BloodService.prototype.update = function(game) {
// 	Entity.prototype.update.call(this, game);
// };
BloodService.prototype.draw = function(ctx) {
	this.redraw_canvas_fade(game.deltatime);
	var local_ctx = this.buffer_canvas.getContext('2d');
	Entity.prototype.draw.call(this, local_ctx);

	ctx.globalAlpha = 1;
	ctx.drawImage(this.buffer_canvas, 0, 0);
};
BloodService.prototype.create_canvas = function() {
	this.buffer_canvas = document.createElement('canvas');
	this.buffer_canvas.width = game.canvas.width;
	this.buffer_canvas.height = game.canvas.height;
	this.redraw_amount = 0;
};
BloodService.prototype.redraw_canvas_fade = function(amount) {
	this.redraw_amount += amount;

	var new_buffer_canvas = document.createElement('canvas');
	new_buffer_canvas.width = game.canvas.width;
	new_buffer_canvas.height = game.canvas.height;
	var new_buffer_context = new_buffer_canvas.getContext('2d');
	// new_buffer_context.globalAlpha = 1 - amount;
	// new_buffer_context.filter = 'blur(1px)';
	new_buffer_context.drawImage(this.buffer_canvas, 0, 0);
	// new_buffer_context.globalAlpha = 1;
	if (this.redraw_amount > 0.1) {
		this.redraw_amount -= 0.1;
		new_buffer_context.fillStyle = 'rgba(0,0,0,0.1)';
		new_buffer_context.globalCompositeOperation = 'source-in';
		new_buffer_context.fillRect(0, 0, game.canvas.width, game.canvas.height);
		new_buffer_context.globalCompositeOperation = 'source-over';
	}
	this.buffer_canvas = new_buffer_canvas;
};
BloodService.prototype.draw_blood = function(px, py, amount) {
	var ctx = this.buffer_canvas.getContext('2d');

	ctx.strokeStyle = '#fff';
	ctx.fillStyle = '#fff';

	for (var i = 0; i < amount; i++) {
		ctx.beginPath();
		ctx.filter = 'blur(1px)';
		ctx.lineWidth = Math.floor(Math.random() * 3) + 2;
		ctx.moveTo(px, py);
		ctx.lineTo(px + Math.random() * 70 - 35, py + Math.random() * 70 - 35);
		// ctx.bezierCurveTo(from.px + d1.px, from.py + d1.py, to.px + d2.px, to.py + d2.py, to.px, to.py);
		// ctx.bezierCurveTo(from.px + dr1.px, from.py + dr1.py, to.px + dr2.px, to.py + dr2.py, to.px, to.py);
		ctx.stroke();
		ctx.restore();
		// ctx.beginPath();
		// ctx.filter = 'blur(3px)';
		// // ctx.lineWidth = Math.floor(Math.random() * 8) + 4;
		// ctx.arc(px + Math.random()*30-15, py + Math.random()*30-15, Math.floor(Math.random() * 4) + 2, 0, 2 * Math.PI);
		// // ctx.moveTo(px, py);
		// // ctx.lineTo(px + Math.random() * 70 - 35, py + Math.random() * 70 - 35);
		// // ctx.bezierCurveTo(from.px + d1.px, from.py + d1.py, to.px + d2.px, to.py + d2.py, to.px, to.py);
		// // ctx.bezierCurveTo(from.px + dr1.px, from.py + dr1.py, to.px + dr2.px, to.py + dr2.py, to.px, to.py);
		// ctx.fill();
		// ctx.stroke();
		// ctx.restore();
	}
};
BloodService.prototype.break_image = function(px, py, image) {
	var ents = [1,2,3,4,5,6,7,8,9,10].map(i => new ParticleEntity(px, py, image));
	this.add_entities(ents);
	this.after(3, () => {
		this.remove_entities(ents);
	});
};



function ParticleEntity(px, py, image) {
	ScreenEntity.call(this, game, px, py, 4, 4, image);
	this.max_framex = this.image.width / this.width;
	this.framex = Math.floor(Math.random() * this.max_framex);
	this.max_framey = this.image.height / this.height;
	this.framey = Math.floor(Math.random() * this.max_framey);

	this.vx = Math.random() * 100 - 50;
	this.vy = Math.random() * 100 - 50;
	this.rotation = Math.random() * 180 - 90;
	this.angle = Math.random() * 360;
}
ParticleEntity.prototype = Object.create(ScreenEntity.prototype);
ParticleEntity.prototype.draw_self = function(ctx) {
	if (this.image)
		ctx.drawImage(this.image,
			this.framex * (this.image.width / this.max_framex), this.framey * (this.image.height / this.max_framey),
				this.image.width / this.max_framex, this.image.height / this.max_framey,
			0 - this.width / 2, 0 - this.height / 2, this.width, this.height);
};
ParticleEntity.prototype.contains_point = function(p) {
	return Math.abs(p.px - this.px) < this.width / 2 && Math.abs(p.py - this.py) < this.height / 2;
};




function TurretService() {
	Entity.call(this, game);
	this.turrets = [];

	this.image = game.images.turret;
	this.fourway_turret_image = game.images.fourway_turret;
	this.width = 32;
	this.height = 32;

	this.frame = 0;
	this.max_frame = 1;

	this.z_index = 200;

	this.is_firing = false;

	this.create_canvas(game);
}
TurretService.prototype = Object.create(Entity.prototype);
TurretService.prototype.draw = function(ctx) {
	ctx.drawImage(this.buffer_canvas, 0, 0);
};
TurretService.prototype.update = function(game) {
	if (this.is_firing && game.services.player_service.is_alive) {
		for (const t of this.turrets) {
			t.firetimer -= game.deltatime;
			if (t.firetimer <= 0) {
				t.firetimer += 1;
				this.fire_turret(game, t);
			}
		}
	}
};
TurretService.prototype.add_turret = function(px, py, type) {
	this.turrets.push({
		px: px,
		py: py,
		firetimer: 0,
		type: type,
	});
	
	var buffer_context = this.buffer_canvas.getContext('2d');
	buffer_context.imageSmoothingEnabled = false;
	if (type === 'four-way') {
		buffer_context.drawImage(this.fourway_turret_image,
			0 * (this.fourway_turret_image.width / 2), 0, this.fourway_turret_image.width / 2, this.fourway_turret_image.height,
			px - this.width / 2, py - this.height / 2, this.width, this.height);
	} else {
		buffer_context.drawImage(this.image, px - this.width / 2, py - this.height / 2, this.width, this.height);
	}
};
TurretService.prototype.fire_turret = function(game, turret) {
	if (turret.type === "right") {
		game.services.projectile_service.spawn_projectile(game, turret.px + 4, turret.py, 1, 0);
	} else if (turret.type === "four-way") {
		game.services.projectile_service.spawn_projectile(game, turret.px + 4, turret.py, 1, 0);
		game.services.projectile_service.spawn_projectile(game, turret.px - 4, turret.py, -1, 0);
		game.services.projectile_service.spawn_projectile(game, turret.px, turret.py + 4, 0, 1);
		game.services.projectile_service.spawn_projectile(game, turret.px, turret.py - 4, 0, -1);
	}
	// game.add_entity(new TurretProjectile(game, turret.px + 4, turret.py - 4));
};
TurretService.prototype.remove_turrets = function(turrets) {
	var buffer_context = this.buffer_canvas.getContext('2d');
	for (const t of turrets) {
		buffer_context.clearRect(t.px - this.width / 2, t.py - this.height / 2, this.width, this.height);
	}

	this.turrets = this.turrets.filter(t => !turrets.includes(t));
};
TurretService.prototype.create_canvas = function(game) {
	this.buffer_canvas = document.createElement('canvas');
	this.buffer_canvas.width = game.canvas.width;
	this.buffer_canvas.height = game.canvas.height;
};
TurretService.prototype.redraw_canvas = function(game, dx, dy) {
	var new_buffer_canvas = document.createElement('canvas');
	new_buffer_canvas.width = game.canvas.width;
	new_buffer_canvas.height = game.canvas.height;
	var new_buffer_context = new_buffer_canvas.getContext('2d');
	new_buffer_context.drawImage(this.buffer_canvas, dx, dy);
	this.buffer_canvas = new_buffer_canvas;
};


function TurretProjectileService() {
	Entity.call(this, game);
	this.projectiles = [];

	this.image = game.images.projectile;
	this.width = 4;
	this.height = 4;

	this.create_canvas(game);
}
TurretProjectileService.prototype = Object.create(Entity.prototype);
TurretProjectileService.prototype.update = function(game) {
	for (const p of this.projectiles) {
		p.px += p.vx * game.deltatime;
		p.py += p.vy * game.deltatime;
	}

	this.projectiles = this.projectiles.filter(p => p.px < game.canvas.width && p.px > 0 && p.py < game.canvas.height && p.py > 0);

	// console.log("this.projectiles:", this.projectiles.length);

	this.buffer_canvases[0] = this.redraw_canvas(game, this.buffer_canvases[0], 120 * game.deltatime, 0);
	this.buffer_canvases[1] = this.redraw_canvas(game, this.buffer_canvases[1], -120 * game.deltatime, 0);
	this.buffer_canvases[2] = this.redraw_canvas(game, this.buffer_canvases[2], 0, 120 * game.deltatime);
	this.buffer_canvases[3] = this.redraw_canvas(game, this.buffer_canvases[3], 0, -120 * game.deltatime);
};
TurretProjectileService.prototype.spawn_projectile = function(game, px, py, vx, vy) {
	this.projectiles.push({ px: px, py: py, a: 45 * Math.floor(Math.random() * 8), r: 90, vx: vx * 120, vy: vy * 120, });

	var buffer_context = (
			vx > 0 ? this.buffer_canvases[0]
			: vx < 0 ? this.buffer_canvases[1]
			: vy > 0 ? this.buffer_canvases[2]
			: this.buffer_canvases[3]
		).getContext('2d');
	buffer_context.imageSmoothingEnabled = false;
	buffer_context.drawImage(this.image, px - this.width / 2, py - this.height / 2);
};
TurretProjectileService.prototype.remove_projectiles = function(projectiles) {
	for (const p of projectiles) {
		var buffer_context = (
				p.vx > 0 ? this.buffer_canvases[0]
				: p.vx < 0 ? this.buffer_canvases[1]
				: p.vy > 0 ? this.buffer_canvases[2]
				: this.buffer_canvases[3]
			).getContext('2d');
		buffer_context.clearRect(p.px - this.width / 2 - 1, p.py - this.height / 2, this.width + 2, this.height);
	}

	this.projectiles = this.projectiles.filter(p => !projectiles.includes(p));
};
TurretProjectileService.prototype.create_canvas = function(game) {
	this.buffer_canvases = [1,2,3,4].map(i => {
		var cvs = document.createElement('canvas');
		cvs.width = game.canvas.width;
		cvs.height = game.canvas.height;
		cvs.true_offset_x = 0;
		cvs.true_offset_y = 0;

		return cvs;
	});
};
TurretProjectileService.prototype.redraw_canvas = function(game, cvs, dx, dy) {
	cvs.true_offset_x += dx;
	cvs.true_offset_y += dy;

	var dx2 = cvs.true_offset_x - cvs.true_offset_x % 1;
	cvs.true_offset_x = cvs.true_offset_x % 1;
	var dy2 = cvs.true_offset_y - cvs.true_offset_y % 1;
	cvs.true_offset_y = cvs.true_offset_y % 1;

	var new_buffer_canvas = document.createElement('canvas');
	new_buffer_canvas.width = game.canvas.width;
	new_buffer_canvas.height = game.canvas.height;
	var new_buffer_context = new_buffer_canvas.getContext('2d');
	new_buffer_context.drawImage(cvs, dx2, dy2);

	new_buffer_canvas.true_offset_x = cvs.true_offset_x;
	new_buffer_canvas.true_offset_y = cvs.true_offset_y;

	return new_buffer_canvas;
};
TurretProjectileService.prototype.draw = function(ctx) {
	this.buffer_canvases.forEach(cvs => ctx.drawImage(cvs, 0, 0));
};



function Scribble(points=[]) {
	ScreenEntity.call(this, game, 0, 0, 1, 1, undefined);
	this.points = points;
	this.draw_cycle = Math.random() * Math.PI * 2;

	this.do_fade = false;

	// this.color = '#fc4';
	this.line_width = 4;

	this.is_faded = false;
	this.is_greyscale = false;

	this.create_canvas();
}
Scribble.prototype = Object.create(ScreenEntity.prototype);
Scribble.prototype.update = function(game) {
	ScreenEntity.prototype.update.call(this, game);
	this.draw_cycle += game.deltatime;
	this.draw_cycle %= Math.PI * 2;
	if (this.do_fade) {
		this.is_faded = true;
		this.redraw_canvas_fade(game.deltatime * 2);
	}
};
Scribble.prototype.draw_self = function(ctx) {
	ctx.drawImage(this.buffer_canvas, 0, 0);

	if (!this.is_greyscale && !this.is_faded && this.points.length > 0) {
		var p = this.points[this.points.length - 1];
		ctx.beginPath();
		ctx.arc(p.px, p.py, 8, 0, 2 * Math.PI);
		ctx.fillStyle = this.color || '#fc4';
		ctx.fill();
	}
};
Scribble.prototype.create_canvas = function() {
	this.buffer_canvas = document.createElement('canvas');
	this.buffer_canvas.width = game.canvas.width;
	this.buffer_canvas.height = game.canvas.height;
};
Scribble.prototype.redraw_canvas_fade = function(amount) {
	var new_buffer_canvas = document.createElement('canvas');
	new_buffer_canvas.width = game.canvas.width;
	new_buffer_canvas.height = game.canvas.height;
	var new_buffer_context = new_buffer_canvas.getContext('2d');
	new_buffer_context.globalAlpha = 1 - amount;
	new_buffer_context.drawImage(this.buffer_canvas, 0, 0);
	this.buffer_canvas = new_buffer_canvas;
};
Scribble.prototype.add_point = function(p) {
	p.draw_cycle = this.draw_cycle;
	this.points.push(p);
	if (this.points.length >= 4)
		this.render_scribble(
			this.points[this.points.length-4],
			this.points[this.points.length-3],
			this.points[this.points.length-2],
			this.points[this.points.length-1]);
};
Scribble.prototype.play_pointset = function(ps) {
	ps = [...ps];
	this.until(() => ps.length === 0, () => {
		this.points.push(ps.shift());
		if (this.points.length >= 4)
			this.render_scribble(
				this.points[this.points.length-4],
				this.points[this.points.length-3],
				this.points[this.points.length-2],
				this.points[this.points.length-1]);
	})
};
Scribble.prototype.render_scribble = function(prev, from, to, next) {
	var d = dist(from, to);
	var d1 = unit_mul(unit_vector(vector_delta(prev, from)), 100);
	var d2 = unit_mul(unit_vector(vector_delta(next, to)), 100);
	var davg = unit_mul(avgp(d1,d2), 2);
	var dr1 = lerpp(davg, d1, 0);
	var dr2 = lerpp(davg, d2, 0);

	var ctx = this.buffer_canvas.getContext('2d');
	ctx.save();
	ctx.lineWidth = this.line_width;
	if (this.is_greyscale) {
		ctx.strokeStyle = 'rgb('
				+ Math.floor((Math.sin(to.draw_cycle) / 2 + 0.5)*255) + ','
				+ Math.floor((Math.sin(to.draw_cycle) / 2 + 0.5)*255) + ','
				+ Math.floor((Math.sin(to.draw_cycle) / 2 + 0.5)*255) + ')';
	} else if (this.color) {
		ctx.strokeStyle = 'rgb('
				+ Math.floor((Math.sin(to.draw_cycle + Math.PI * 0.5 / 3) / 2 + 0.5)*128) + ','
				+ Math.floor((Math.sin(to.draw_cycle + Math.PI * 2.5 / 3) / 2 + 0.5)*128) + ','
				+ Math.floor((Math.sin(to.draw_cycle + Math.PI * 4.5 / 3) / 2 + 0.5)*128) + ')';
	} else {
		ctx.strokeStyle = 'rgb('
				+ Math.floor((Math.sin(to.draw_cycle) / 2 + 0.5)*255) + ','
				+ Math.floor((Math.sin(to.draw_cycle + Math.PI * 2 / 3) / 2 + 0.5)*255) + ','
				+ Math.floor((Math.sin(to.draw_cycle + Math.PI * 4 / 3) / 2 + 0.5)*255) + ')';
	}
	// ctx.strokeStyle = this.color;
	ctx.beginPath();
	ctx.moveTo(from.px, from.py);
	ctx.bezierCurveTo(from.px + davg.px, from.py + davg.py, to.px + davg.px, to.py + davg.py, to.px, to.py);
	// ctx.bezierCurveTo(from.px + d1.px, from.py + d1.py, to.px + d2.px, to.py + d2.py, to.px, to.py);
	// ctx.bezierCurveTo(from.px + dr1.px, from.py + dr1.py, to.px + dr2.px, to.py + dr2.py, to.px, to.py);
	ctx.stroke();
	ctx.restore();
};

function CrawlerEnemy(px, py, path) {
	ScreenEntity.call(this, game, px, py, 32, 32, game.images.enemy);
	this.frame = 0;
	this.max_frame = 4;

	this.speed = 30;
	this.health = 3;

	this.every(0.2 + Math.random() * 0.3, () => {
		this.frame = (this.vx > 0 ? 0 : 2) + (this.frame + 1) % 2;

		var delta = vector_delta(this, this.target_point);
		var d = dist(this, this.target_point);
		this.vx = delta.px / d * this.speed;
		this.vy = delta.py / d * this.speed;
		this.px += Math.floor(Math.random() * (3 * 2 + 1) - 3);
		this.py += Math.floor(Math.random() * (3 * 2 + 1) - 3);
	});


	this.path = path;
	this.index = 0;
	this.target_point = { px: px, py: py };
}
CrawlerEnemy.prototype = Object.create(ScreenEntity.prototype);
CrawlerEnemy.prototype.update = function(game) {
	ScreenEntity.prototype.update.call(this, game);

	if (this.index < this.path.length && dist_sqr(this, this.target_point) < 25) {
		this.next_point();
	}

};
CrawlerEnemy.prototype.next_point = function() {
	if (this.index < this.path.length) {
		while (this.index < this.path.length && dist_sqr(this, this.path[this.index]) < 25 * 25) {
			this.index++;
		}
		if (this.index >= this.path.length) {
			game.services.enemy_service.remove_entity(this);
			game.services.player_service.take_damage(1);
		} else {
			var p = this.path[this.index];
			var max_offset = 15;
			this.target_point = {
				px: p.px + Math.floor(Math.random() * (max_offset * 2 + 1) - max_offset),
				py: p.py + Math.floor(Math.random() * (max_offset * 2 + 1) - max_offset),
			};
			// var delta = vector_delta(this, this.target_point);
			// var d = dist(this, this.target_point);
			// this.vx = delta.px / d * this.speed;
			// this.vy = delta.py / d * this.speed;
		}
	} else {
		game.services.enemy_service.remove_entity(this);
		game.services.player_service.take_damage(1);
	}
};

function MachineEnemy(px, py, path) {
	ScreenEntity.call(this, game, px, py, 48, 48, game.images.enemy_machine);
	this.frame = 0;
	this.max_frame = 3;

	this.speed = 15;
	this.health = 6;

	this.every(0.1 + Math.random() * 0.1, () => {
		this.frame = (this.frame + 1) % 3;

		var delta = vector_delta(this, this.target_point);
		var d = dist(this, this.target_point);
		this.vx = delta.px / d * this.speed;
		this.vy = delta.py / d * this.speed;
		// this.px += Math.floor(Math.random() * (3 * 2 + 1) - 3);
		// this.py += Math.floor(Math.random() * (3 * 2 + 1) - 3);
	});


	this.path = path;
	this.index = 0;
	this.target_point = { px: px, py: py };
}
MachineEnemy.prototype = Object.create(ScreenEntity.prototype);
MachineEnemy.prototype.update = function(game) {
	ScreenEntity.prototype.update.call(this, game);

	if (this.index < this.path.length && dist_sqr(this, this.target_point) < 25) {
		this.next_point();
	}

};
MachineEnemy.prototype.next_point = function() {
	if (this.index < this.path.length) {
		while (this.index < this.path.length && dist_sqr(this, this.path[this.index]) < 25 * 25) {
			this.index++;
		}
		if (this.index >= this.path.length) {
			game.services.enemy_service.remove_entity(this);
			game.services.player_service.take_damage(1);
		} else {
			var p = this.path[this.index];
			var max_offset = 15;
			this.target_point = {
				px: p.px + Math.floor(Math.random() * (max_offset * 2 + 1) - max_offset),
				py: p.py + Math.floor(Math.random() * (max_offset * 2 + 1) - max_offset),
			};
			// var delta = vector_delta(this, this.target_point);
			// var d = dist(this, this.target_point);
			// this.vx = delta.px / d * this.speed;
			// this.vy = delta.py / d * this.speed;
		}
	} else {
		game.services.enemy_service.remove_entity(this);
		game.services.player_service.take_damage(1);
	}
};

function TargetCircle(px, py) {
	ScreenEntity.call(this, game, px, py, 48, 48, undefined);

	this.color = '#e92';
	this.edge_color = '#c50';

	this.timer = Math.random() * 50;
	this.radius = 50;
	this.__radius = this.radius;
	this.radius_target = this.radius;

	this.z_index = 10;
}
TargetCircle.prototype = Object.create(ScreenEntity.prototype);
TargetCircle.prototype.draw_self = function (ctx) {

	ctx.beginPath();
	ctx.arc(0, 0, this.radius + Math.sin(this.timer * 2) * this.radius * 0.1, 0, 2 * Math.PI);
	ctx.fillStyle = this.color;
	ctx.fill();
	ctx.lineWidth = this.radius * 0.08;
	ctx.strokeStyle = this.edge_color;
	ctx.stroke();
};
TargetCircle.prototype.update = function (game) {
	ScreenEntity.prototype.update.call(this, game);

	this.timer += game.deltatime;
	this.radius = lerp(this.radius, this.radius_target, game.deltatime*2);
};


function GoalCircle(px, py) {
	ScreenEntity.call(this, game, px, py, 48, 48, undefined);

	this.color = '#9e2';
	this.edge_color = '#5c0';

	this.timer = Math.random() * 50;
	this.__radius = 50;
	this.radius = 5;
	this.radius_target = this.radius;

	this.z_index = 10;
}
GoalCircle.prototype = Object.create(ScreenEntity.prototype);
GoalCircle.prototype.draw_self = function (ctx) {

	ctx.beginPath();
	ctx.arc(0, 0, this.radius + Math.sin(this.timer * 2) * this.radius * 0.1, 0, 2 * Math.PI);
	ctx.fillStyle = this.color;
	ctx.fill();
	ctx.lineWidth = this.radius * 0.08;
	ctx.strokeStyle = this.edge_color;
	ctx.stroke();
};
GoalCircle.prototype.update = function (game) {
	ScreenEntity.prototype.update.call(this, game);

	this.timer += game.deltatime;
	this.radius = lerp(this.radius, this.radius_target, game.deltatime*2);
};

function NonBuildableCircle(px, py, radius) {
	ScreenEntity.call(this, game, px, py, radius, radius, game.images.circuit);

	this.color = '#ccf';
	this.edge_color = '#444';

	this.radius = radius;

	this.z_index = 5;
}
NonBuildableCircle.prototype = Object.create(ScreenEntity.prototype);
NonBuildableCircle.prototype.draw_self = function (ctx) {

	ctx.beginPath();
	ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
	var pattern = ctx.createPattern(this.image, 'repeat');
	ctx.fillStyle = pattern;
	// ctx.fillStyle = this.color;
	ctx.fill();
	ctx.lineWidth = 3;
	ctx.strokeStyle = this.edge_color;
	ctx.stroke();
};

function NonBuildableRectangle(px, py, width, height) {
	ScreenEntity.call(this, game, px, py, width + 10, height + 10, game.images.circuit);

	this.color = '#ccf';
	this.edge_color = '#444';

	this.z_index = 5;
}
NonBuildableRectangle.prototype = Object.create(ScreenEntity.prototype);
NonBuildableRectangle.prototype.draw_self = function (ctx) {

	var pattern = ctx.createPattern(this.image, 'repeat');
	ctx.fillStyle = pattern;
	// ctx.fillStyle = this.color;
	ctx.fillRect(-(this.width-10) / 2, -(this.height-10) / 2, (this.width-10), (this.height-10));
	ctx.lineWidth = 3;
	ctx.strokeStyle = this.edge_color;
	ctx.strokeRect(-(this.width-10) / 2, -(this.height-10) / 2, (this.width-10), (this.height-10));
};
// NonBuildableRectangle.prototype.update = function (game) {
// 	ScreenEntity.prototype.update.call(this, game);

// 	this.timer += game.deltatime;
// 	this.radius = lerp(this.radius, this.radius_target, game.deltatime*2);
// };




function BracketsDisplay(px, py, image) {
	ScreenEntity.call(this, game, px, py, 16, 32, image);
	this.max_frame = 2;
}
BracketsDisplay.prototype = Object.create(ScreenEntity.prototype);
BracketsDisplay.prototype.draw_self = function (ctx) {
	if (this.image) {
		var x = this.sub_entities.length + 1;
		ctx.drawImage(this.image,
			0 * (this.image.width / this.max_frame), 0, this.image.width / this.max_frame, this.image.height,
			0 - this.width / 2 - x * this.width, 0 - this.height / 2, this.width, this.height);
		ctx.drawImage(this.image,
			1 * (this.image.width / this.max_frame), 0, this.image.width / this.max_frame, this.image.height,
			0 - this.width / 2 + x * this.width, 0 - this.height / 2, this.width, this.height);
	}
};
BracketsDisplay.prototype.update = function (game) {
	ScreenEntity.prototype.update.call(this, game);

	this.timer += game.deltatime;
	this.radius = lerp(this.radius, this.radius_target, game.deltatime*2);
};
BracketsDisplay.prototype.respace_all = function () {
	var middle = this.sub_entities.length / 2 - 0.5;
	this.sub_entities.forEach((e,i) => {
		i -= middle;
		e.px = 0 + i * this.width * 2;
		e.py = 0;
	});
};



function DraggableTemplate(px, py, width, height, image, max_frame) {
	ScreenEntity.call(this, game, px, py, width, height, image);
	this.max_frame = max_frame;
}
DraggableTemplate.prototype = Object.create(ScreenEntity.prototype);
DraggableTemplate.prototype.spawn = function () {
	var s = new ScreenEntity(game, this.px, this.py, this.width, this.height, this.image);
	s.max_frame = this.max_frame;
	return s;
};



function main () {
	var canvas = document.querySelector('#game_canvas');
	var ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;

	nlo.load.load_all_assets({
		images: {
			ufo: 'assets/img/ufo.png',

			enemy: 'assets/img/enemy.png',
			enemy_machine: 'assets/img/enemy_machine.png',
			turret: 'assets/img/turret.png',
			fourway_turret: 'assets/img/fourway_turret.png',
			projectile: 'assets/img/projectile.png',
			circuit: 'assets/img/circuit.png',

			brackets: 'assets/img/brackets.png',
			heart: 'assets/img/heart.png',
		},
	}, loaded_assets => {
		game = new GameSystem(canvas, loaded_assets);
		game.background_color = '#111';

		// initialize all systems
		game.services.cheat_service = new CheatService();
		game.services.player_service = new PlayerService();
		game.services.enemy_service = new EnemyService();
		game.services.turret_service = new TurretService();
		game.services.projectile_service = new TurretProjectileService();
		game.services.blood_service = new BloodService();
		game.services.user_input_service = new UserInputService();

		game.add_entity(new TargetCircle(100, 100));
		game.add_entity(new GoalCircle(600, 400));

		// game.add_entity(brackets = new BracketsDisplay(canvas.width / 2, canvas.height - 100, game.images.brackets));
		// var s = new ScreenEntity(game, 0,0,32,32, game.images.enemy);
		// s.max_frame = 4;
		// brackets.add_entity(s);
		// brackets.respace_all();

		game.services.turret_service.add_turret(150, 300, 'four-way');
		game.add_entity(new NonBuildableCircle(150, 300, 50));
		game.services.turret_service.add_turret(350, 450, 'four-way');
		game.add_entity(new NonBuildableCircle(350, 450, 50));
		game.add_entity(new NonBuildableRectangle(350, 225, 100, 450));
		// game.add_entity(new TargetCircle(100, 400));
		// game.add_entity(new GoalCircle(300, 600));


		game.run_game(ctx, 60);
	});
}

window.addEventListener('load', main);
