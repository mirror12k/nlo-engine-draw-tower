
var game;


function UserInputService() {
	Entity.call(this, game);

	// this.fade_path = true;

}
UserInputService.prototype = Object.create(Entity.prototype);
UserInputService.prototype.update = function(game) {
	Entity.prototype.update.call(this, game);

	if (game.is_mouse_pressed()) {
		if (
				(this.current_target = game.query_entities(TargetCircle).find(t => dist_sqr(t, game.mouse_game_position) < t.radius * t.radius))
				&& !this.current_target.connected_target) {
			this.current_target.radius_target = 5;
			game.query_entities(GoalCircle).forEach(t => t.radius_target = t.__radius);
			// drag it until the player releases the mouse button

			game.add_entity(this.scribble = new Scribble([game.mouse_game_position, game.mouse_game_position, game.mouse_game_position]));
			var fromfrom = game.mouse_game_position;
			var from = game.mouse_game_position;
			var to = game.mouse_game_position;
			this.until(() => !game.mouse1_state, () => {
				this.scribble.add_point(game.mouse_game_position);
				// this.render_scribble(fromfrom, from, to, game.mouse_game_position);
				// fromfrom = from;
				// from = to;
				// to = game.mouse_game_position;
			}, () => {
				if (this.last_scribble)
					game.remove_entity(this.last_scribble);

				if (this.reached_target = game.query_entities(GoalCircle).find(t => dist_sqr(t, game.mouse_game_position) < t.radius * t.radius)) {
					this.current_target.connected_target = this.reached_target;

					game.add_entity(this.second_scribble = new Scribble());
						this.second_scribble.z_index = -2;
						this.second_scribble.px = 2;
						this.second_scribble.py = 2;
					this.second_scribble.color = '#c62'; // '#c62';
					this.second_scribble.line_width = 10;
					this.second_scribble.play_pointset(this.scribble.points);

					var path = [... this.scribble.points];
					this.every(3, () => {
						game.services.enemy_service.add_entity(new CrawlerEnemy(path[0].px, path[0].py, path));
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
					this.scribble.after(1.7, () => {
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
// UserInputService.prototype.save_data = function () {
// 	var data = game.query_entities(NumberCircle).map(n => [n.value, Math.round(n.px), Math.round(n.py)]);
// 	console.log("data:", JSON.stringify(data));
// 	return data;
// };
// UserInputService.prototype.reload_data = function (data) {
// 	// console.log("data:", data);
// 	game.remove_entities(game.query_entities(NumberCircle));
// 	game.remove_entities(game.query_entities(CircleConnector));
// 	game.add_entities(data.map(d => new NumberCircle(d[1],d[2], d[0])));
// };
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
	var local_ctx = this.buffer_canvas.getContext('2d');
	// Entity.prototype.draw.call(this, ctx);
	Entity.prototype.draw.call(this, local_ctx);
	this.redraw_canvas_fade(game.deltatime / 2);

	ctx.drawImage(this.buffer_canvas, 0, 0);
	// ctx.drawImage(this.buffer_canvas, 0, 0);
};
EnemyService.prototype.create_canvas = function() {
	this.buffer_canvas = document.createElement('canvas');
	this.buffer_canvas.width = game.canvas.width;
	this.buffer_canvas.height = game.canvas.height;
};
EnemyService.prototype.redraw_canvas_fade = function(amount) {
	var new_buffer_canvas = document.createElement('canvas');
	new_buffer_canvas.width = game.canvas.width;
	new_buffer_canvas.height = game.canvas.height;
	var new_buffer_context = new_buffer_canvas.getContext('2d');
	new_buffer_context.globalAlpha = 1 - amount;
	// new_buffer_context.filter = 'blur(1px)';
	new_buffer_context.drawImage(this.buffer_canvas, 0, 0);
	this.buffer_canvas = new_buffer_canvas;
};
function BloodService() {
	Entity.call(this, game);

	// this.fade_path = true;
	this.create_canvas();

	this.z_index = 40;

}
BloodService.prototype = Object.create(Entity.prototype);
// BloodService.prototype.update = function(game) {
// 	Entity.prototype.update.call(this, game);
// };
BloodService.prototype.draw = function(ctx) {
	var local_ctx = this.buffer_canvas.getContext('2d');
	Entity.prototype.draw.call(this, local_ctx);
	this.redraw_canvas_fade(game.deltatime);

	ctx.globalAlpha = 1;
	ctx.drawImage(this.buffer_canvas, 0, 0);
};
BloodService.prototype.create_canvas = function() {
	this.buffer_canvas = document.createElement('canvas');
	this.buffer_canvas.width = game.canvas.width;
	this.buffer_canvas.height = game.canvas.height;
};
BloodService.prototype.redraw_canvas_fade = function(amount) {
	var new_buffer_canvas = document.createElement('canvas');
	new_buffer_canvas.width = game.canvas.width;
	new_buffer_canvas.height = game.canvas.height;
	var new_buffer_context = new_buffer_canvas.getContext('2d');
	new_buffer_context.globalAlpha = 1 - amount;
	// new_buffer_context.filter = 'blur(1px)';
	new_buffer_context.drawImage(this.buffer_canvas, 0, 0);
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



function TurretService() {
	Entity.call(this, game);
	this.turrets = [];

	this.image = game.images.turret;
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
	if (this.is_firing) {
		for (const t of this.turrets) {
			t.firetimer -= game.deltatime;
			if (t.firetimer <= 0) {
				t.firetimer += 1;
				this.fire_turret(game, t);
			}
		}
	}
};
TurretService.prototype.add_turret = function(px, py) {
	this.turrets.push({
		px: px,
		py: py,
		firetimer: 0,
	});
	
	var buffer_context = this.buffer_canvas.getContext('2d');
	buffer_context.drawImage(this.image, px - this.width / 2, py - this.height / 2, this.width, this.height);
};
TurretService.prototype.fire_turret = function(game, turret) {
	game.services.projectile_service.spawn_projectile(game, turret.px + 4, turret.py - 4);
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
	}

	this.projectiles = this.projectiles.filter(p => p.px < 960);

	// console.log("this.projectiles:", this.projectiles.length);

	this.redraw_canvas(game, 64 * game.deltatime, 0);
};
TurretProjectileService.prototype.spawn_projectile = function(game, px, py) {
	this.projectiles.push({ px: px, py: py, a: 45 * Math.floor(Math.random() * 8), r: 90, vx: 64, vy: 0, });

	var buffer_context = this.buffer_canvas.getContext('2d');
	buffer_context.drawImage(this.image, px - this.width / 2, py - this.height / 2);
};
TurretProjectileService.prototype.remove_projectiles = function(projectiles) {
	var buffer_context = this.buffer_canvas.getContext('2d');
	for (const p of projectiles) {
		buffer_context.clearRect(p.px - this.width / 2 - 1, p.py - this.height / 2, this.width + 2, this.height);
	}

	this.projectiles = this.projectiles.filter(p => !projectiles.includes(p));
};
TurretProjectileService.prototype.create_canvas = function(game) {
	this.buffer_canvas = document.createElement('canvas');
	this.buffer_canvas.width = game.canvas.width;
	this.buffer_canvas.height = game.canvas.height;
	this.true_offset_x = 0;
	this.true_offset_y = 0;
};
TurretProjectileService.prototype.redraw_canvas = function(game, dx, dy) {
	this.true_offset_x += dx;
	this.true_offset_y += dy;

	var dx2 = this.true_offset_x - this.true_offset_x % 1;
	this.true_offset_x = this.true_offset_x % 1;
	var dy2 = this.true_offset_y - this.true_offset_y % 1;
	this.true_offset_y = this.true_offset_y % 1;

	var new_buffer_canvas = document.createElement('canvas');
	new_buffer_canvas.width = game.canvas.width;
	new_buffer_canvas.height = game.canvas.height;
	var new_buffer_context = new_buffer_canvas.getContext('2d');
	new_buffer_context.drawImage(this.buffer_canvas, dx2, dy2);
	this.buffer_canvas = new_buffer_canvas;
};
TurretProjectileService.prototype.draw = function(ctx) {
	ctx.drawImage(this.buffer_canvas, 0, 0);
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
		this.redraw_canvas_fade(game.deltatime);
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

	this.speed = 20;
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



function main () {
	var canvas = document.querySelector('#game_canvas');
	var ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;

	nlo.load.load_all_assets({
		images: {
			ufo: 'assets/img/ufo.png',
			enemy: 'assets/img/enemy.png',
			turret: 'assets/img/turret.png',
			projectile: 'assets/img/projectile.png',
		},
	}, loaded_assets => {
		game = new GameSystem(canvas, loaded_assets);
		game.background_color = '#111';

		// initialize all systems
		game.services.user_input_service = new UserInputService();
		game.services.enemy_service = new EnemyService();
		game.services.turret_service = new TurretService();
		game.services.projectile_service = new TurretProjectileService();
		game.services.blood_service = new BloodService();

		game.add_entity(new TargetCircle(100, 100));
		game.add_entity(new GoalCircle(600, 400));

		game.services.turret_service.add_turret(100, 300);
		game.services.turret_service.add_turret(300, 450);
		// game.add_entity(new TargetCircle(100, 400));
		// game.add_entity(new GoalCircle(300, 600));


		game.run_game(ctx, 60);
	});
}

window.addEventListener('load', main);
