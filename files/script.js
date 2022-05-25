const playCanvas = document.getElementById("playCanvas");
playCanvas.screen = playCanvas.getContext("2d");
playCanvas.width = 320;
playCanvas.height = 288;

const mapCanvas = document.getElementById("mapCanvas");
mapCanvas.screen = mapCanvas.getContext("2d");
mapCanvas.width = 320;
mapCanvas.height = 288;

const loadCanvas = document.createElement("canvas");
loadCanvas.screen = loadCanvas.getContext("2d");
loadCanvas.width = 320;
loadCanvas.height = 32;

const game = {
	tileSize: 32,
	frameRate: 1000 / 60,
	moveSpeed: 1000 / 10,
	moveDistance: 16
}

const player = {
	color: "#FF0000",
	x: 0,
	y: 0
}

const box = {
	color: "#888888"
}

const wall = {
	color: "#FFFFFF"
}

const maps = {
	currentMap: "map1",
	map1: {
		player: {
			initX: game.tileSize * 0, initY: game.tileSize * 0
		},
		boxes: [
			{x: game.tileSize * 3, y: game.tileSize * 3, initX: game.tileSize * 3, initY: game.tileSize * 3},
			{x: game.tileSize * 3, y: game.tileSize * 5, initX: game.tileSize * 3, initY: game.tileSize * 5}
		],
		walls: [
			{x: game.tileSize * 1, y: game.tileSize * 1},
			{x: game.tileSize * 2, y: game.tileSize * 1},
			{x: game.tileSize * 7, y: game.tileSize * 1},
			{x: game.tileSize * 8, y: game.tileSize * 1},
			{x: game.tileSize * 1, y: game.tileSize * 2},
			{x: game.tileSize * 8, y: game.tileSize * 2},
			{x: game.tileSize * 5, y: game.tileSize * 4},
			{x: game.tileSize * 1, y: game.tileSize * 6},
			{x: game.tileSize * 8, y: game.tileSize * 6},
			{x: game.tileSize * 1, y: game.tileSize * 7},
			{x: game.tileSize * 2, y: game.tileSize * 7},
			{x: game.tileSize * 7, y: game.tileSize * 7},
			{x: game.tileSize * 8, y: game.tileSize * 7}
		]
	},
	map2: {
		player: {
			initX: game.tileSize * 7, initY: game.tileSize * 0
		},
		boxes: [
			{x: game.tileSize * 4, y: game.tileSize * 4, initX: game.tileSize * 4, initY: game.tileSize * 4}
		],
		walls: [
			{x: game.tileSize * 1, y: game.tileSize * 1},
			{x: game.tileSize * 8, y: game.tileSize * 1},
			{x: game.tileSize * 1, y: game.tileSize * 7},
			{x: game.tileSize * 8, y: game.tileSize * 7}
		]
	}
};

const controller = {
	up: "ArrowUp",
	down: "ArrowDown",
	left: "ArrowLeft",
	right: "ArrowRight"
}

const inputs = {
	up: 0,
	down: 0,
	left: 0,
	right: 0,
	lastMove: 0
}

function keyPressListener(event) {
	if (event.key === controller.up && inputs.up === 0) inputs.up = Date.now();
	if (event.key === controller.down && inputs.down === 0) inputs.down = Date.now();
	if (event.key === controller.left && inputs.left === 0) inputs.left = Date.now();
	if (event.key === controller.right && inputs.right === 0) inputs.right = Date.now();
}

function keyReleaseListener(event) {
	if (event.key === controller.up && inputs.up > 0) inputs.up = 0;
	if (event.key === controller.down && inputs.down > 0) inputs.down = 0;
	if (event.key === controller.left && inputs.left > 0) inputs.left = 0;
	if (event.key === controller.right && inputs.right > 0) inputs.right = 0;
}

function movement() {
	let currentTime = Date.now();

	let move = {
		x: 0,
		y: 0
	}

	let boxToMove;

	switch (Math.max(0, inputs.up, inputs.down)) {
		case 0: break;
		case inputs.up:
			move.y = -1;
			break;
		case inputs.down:
			move.y = +1;
			break;
	}

	switch (Math.max(0, inputs.left, inputs.right)) {
		case 0: break;
		case inputs.left:
			move.x = -1;
			break;
		case inputs.right:
			move.x = +1;
			break;
	}

	function detectCollision(subject, mainAxis) {
		let canvasLimit;
		let sideAxis;

		switch (mainAxis) {
			case "x":
				canvasLimit = playCanvas.width;
				sideAxis = "y";
				break;
			case "y":
				canvasLimit = playCanvas.height;
				sideAxis = "x";
				break;
		}

		function detectOOB() {
			return subject[mainAxis] + game.tileSize * Math.max(0, move[mainAxis]) === canvasLimit * Math.max(0, move[mainAxis]);
		}

		function detectWall() {
			return maps[maps.currentMap].walls.some((wall) => {
				let alignedWithWall;
				let adjacentToWall;

				if (
					(subject[sideAxis] === wall[sideAxis] || subject[sideAxis] + game.tileSize === wall[sideAxis] + game.tileSize)
					|| (subject[sideAxis] > wall[sideAxis] && subject[sideAxis] < wall[sideAxis] + game.tileSize)
					|| (subject[sideAxis] + game.tileSize > wall[sideAxis] && subject[sideAxis] + game.tileSize < wall[sideAxis] + game.tileSize)
				) alignedWithWall = true;

				if (subject[mainAxis] + game.tileSize * move[mainAxis] === wall[mainAxis]) adjacentToWall = true;

				return alignedWithWall && adjacentToWall;
			});
		}

		function detectBox() {
			return maps[maps.currentMap].boxes.some((box) => {
				let perfectlyAlignedWithBox;
				let alignedWithBox;
				let adjacentToBox;
	
				if (subject[sideAxis] === box[sideAxis] || subject[sideAxis] + game.tileSize === box[sideAxis] + game.tileSize) perfectlyAlignedWithBox = true;
				if (
					(subject[sideAxis] > box[sideAxis] && subject[sideAxis] < box[sideAxis] + game.tileSize)
					|| (subject[sideAxis] + game.tileSize > box[sideAxis] && subject[sideAxis] + game.tileSize < box[sideAxis] + game.tileSize)
				) alignedWithBox = true;
	
				if (subject[mainAxis] + game.tileSize * move[mainAxis] === box[mainAxis]) adjacentToBox = true;
	
				if (perfectlyAlignedWithBox && adjacentToBox) {
					if (subject === player && ((move.x !== 0 && move.y === 0) || (move.x === 0 && move.y !== 0))) {
						boxToMove = box;
						return false;
					}
					else return true;
				}
				return alignedWithBox && adjacentToBox;
			});
		}

		return detectOOB() || detectWall() || detectBox();
	}

	function movePlayer() {
		let canMoveX = (move.x !== 0 && !detectCollision(player, "x"));
		let canMoveY = (move.y !== 0 && !detectCollision(player, "y"));

		if (canMoveX) {
			if (boxToMove) {
				if (!detectCollision(boxToMove, "x")) {
					boxToMove.x += game.moveDistance * move.x;
					player.x += game.moveDistance * move.x;
				}
			}
			else player.x += game.moveDistance * move.x;
		}
		if (canMoveY && !detectCollision(player, "y")) {
			if (boxToMove) {
				if (!detectCollision(boxToMove, "y")) {
					boxToMove.y += game.moveDistance * move.y;
					player.y += game.moveDistance * move.y;
				}
			}
			else player.y += game.moveDistance * move.y;
		}
		if (canMoveX || canMoveY) inputs.lastMove = currentTime;
	}

	if (move.x === 0 && move.y === 0) {
		if (inputs.lastMove !== 0) inputs.lastMove = 0;
	}
	
	if (move.x !== 0 || move.y !== 0) {
		if (inputs.lastMove === 0) movePlayer();
		if (inputs.lastMove !== 0) {
			if (currentTime - inputs.lastMove >= game.moveSpeed) movePlayer();
		}
	}
}

function draw() {
	playCanvas.screen.drawImage(
		loadCanvas,
		game.tileSize * 0, 0, game.tileSize, game.tileSize,
		player.x, player.y, game.tileSize, game.tileSize
	);
	maps[maps.currentMap].boxes.forEach((box) => {
		playCanvas.screen.drawImage(
			loadCanvas,
			game.tileSize * 1, 0, game.tileSize, game.tileSize,
			box.x, box.y, game.tileSize, game.tileSize
		);
	});
}

function update() {
	setTimeout(() => {window.requestAnimationFrame(update);}, game.frameRate);

	playCanvas.screen.clearRect(0, 0, playCanvas.width, playCanvas.height);
	movement();
	draw();
}

Object.defineProperty(maps, "loadMap", {
	value: function(map) {
		loadCanvas.screen.clearRect(0, 0, loadCanvas.width, loadCanvas.height);
		playCanvas.screen.clearRect(0, 0, playCanvas.width, playCanvas.height);
		mapCanvas.screen.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

		loadCanvas.screen.fillStyle = player.color;
		loadCanvas.screen.fillRect(game.tileSize * 0, 0, game.tileSize, game.tileSize);

		loadCanvas.screen.fillStyle = box.color;
		loadCanvas.screen.fillRect(game.tileSize * 1, 0, game.tileSize, game.tileSize);

		loadCanvas.screen.fillStyle = wall.color;
		loadCanvas.screen.fillRect(game.tileSize * 2, 0, game.tileSize, game.tileSize);

		player.x = this[map].player.initX;
		player.y = this[map].player.initY;

		playCanvas.screen.drawImage(
			loadCanvas,
			game.tileSize * 0, 0, game.tileSize, game.tileSize,
			player.x, player.y, game.tileSize, game.tileSize
		);

		this[map].boxes.forEach((box) => {
			box.x = box.initX;
			box.y = box.initY;
	
			playCanvas.screen.drawImage(
				loadCanvas,
				game.tileSize * 1, 0, game.tileSize, game.tileSize,
				box.x, box.y, game.tileSize, game.tileSize
			);
		});

		this[map].walls.forEach((wall) => {
			mapCanvas.screen.drawImage(
				loadCanvas,
				game.tileSize * 2, 0, game.tileSize, game.tileSize,
				wall.x, wall.y, game.tileSize, game.tileSize
			);
		});

		this.currentMap = map;
		setTimeout(() => {window.requestAnimationFrame(update);}, game.frameRate);
	}
});

document.addEventListener("keydown", keyPressListener);
document.addEventListener("keyup", keyReleaseListener);
maps.loadMap("map1");