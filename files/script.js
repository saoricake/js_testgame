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
	x: 0,
	y: 0
}

const colors = {
	player: "#FF0000",
	boxes: "#888888",
	walls: "#FFFFFF"
}

const mapData = [
	{
		player: {
			x: 0, y: 0
		},
		boxes: [
			{x: 3, y: 3},
			{x: 3, y: 5}
		],
		walls: [
			{x: 1, y: 1},
			{x: 2, y: 1},
			{x: 7, y: 1},
			{x: 8, y: 1},
			{x: 1, y: 2},
			{x: 8, y: 2},
			{x: 5, y: 4},
			{x: 1, y: 6},
			{x: 8, y: 6},
			{x: 1, y: 7},
			{x: 2, y: 7},
			{x: 7, y: 7},
			{x: 8, y: 7}
		]
	},
	{
		player: {
			x: 7, y: 0
		},
		boxes: [
			{x: 4, y: 4}
		],
		walls: [
			{x: 1, y: 1},
			{x: 8, y: 1},
			{x: 1, y: 7},
			{x: 8, y: 7}
		]
	}
];

const mapHandler = {
	loadedMap: {
		boxes: [],
		walls: []
	},
	loadMap: function(map) {
		loadCanvas.screen.clearRect(0, 0, loadCanvas.width, loadCanvas.height);
		playCanvas.screen.clearRect(0, 0, playCanvas.width, playCanvas.height);
		mapCanvas.screen.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

		loadCanvas.screen.fillStyle = colors.player;
		loadCanvas.screen.fillRect(game.tileSize * 0, 0, game.tileSize, game.tileSize);

		loadCanvas.screen.fillStyle = colors.boxes;
		loadCanvas.screen.fillRect(game.tileSize * 1, 0, game.tileSize, game.tileSize);

		loadCanvas.screen.fillStyle = colors.walls;
		loadCanvas.screen.fillRect(game.tileSize * 2, 0, game.tileSize, game.tileSize);

		player.x = mapData[map].player.x * game.tileSize;
		player.y = mapData[map].player.y * game.tileSize;

		playCanvas.screen.drawImage(
			loadCanvas,
			game.tileSize * 0, 0, game.tileSize, game.tileSize,
			player.x, player.y, game.tileSize, game.tileSize
		);

		this.loadedMap.boxes = [];
		mapData[map].boxes.forEach((box) => {
			let loadedBox = {x: box.x * game.tileSize, y: box.y * game.tileSize}
			this.loadedMap.boxes.push(loadedBox);

			playCanvas.screen.drawImage(
				loadCanvas,
				game.tileSize * 1, 0, game.tileSize, game.tileSize,
				loadedBox.x, loadedBox.y, game.tileSize, game.tileSize
			);
		});

		this.loadedMap.walls = [];
		mapData[map].walls.forEach((wall) => {
			let loadedWall = {x: wall.x * game.tileSize, y: wall.y * game.tileSize}
			this.loadedMap.walls.push(loadedWall);

			mapCanvas.screen.drawImage(
				loadCanvas,
				game.tileSize * 2, 0, game.tileSize, game.tileSize,
				loadedWall.x, loadedWall.y, game.tileSize, game.tileSize
			);
		});

		setTimeout(() => {window.requestAnimationFrame(update);}, game.frameRate);
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
			return mapHandler.loadedMap.walls.some((wall) => {
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
			return mapHandler.loadedMap.boxes.some((box) => {
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
	mapHandler.loadedMap.boxes.forEach((box) => {
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

document.addEventListener("keydown", keyPressListener);
document.addEventListener("keyup", keyReleaseListener);
mapHandler.loadMap(0);