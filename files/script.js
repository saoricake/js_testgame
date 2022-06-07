class Canvas {
	constructor(canvasElement) {
		this.ele = canvasElement;
		this.ele.width = 320;
		this.ele.height = 288;
		this.screen = this.ele.getContext("2d");
	}

	clear() {
		this.screen.clearRect(0, 0, this.ele.width, this.ele.height);
	}
}

const canvas0 = new Canvas(document.createElement("canvas"));
const canvas1 = new Canvas(document.getElementById("canvasLayer1"));
const canvas2 = new Canvas(document.getElementById("canvasLayer2"));

canvas0.loadSprite = function(color, tile) {
	this.screen.fillStyle = color;
	this.screen.fillRect(game.tileSize * tile, 0, game.tileSize, game.tileSize);
}

const game = {
	tileSize: 32,
	frameRate: 1000 / 60,
	moveSpeed: 1000 / 10,
	moveDist: 16
}

const colors = {
	player: "#FF0000",
	boxes: "#888888",
	walls: "#FFFFFF",
	buttons: "#00FF00"
}

const loadedData = {
	id: 0,
	player: {},
	boxes: [],
	walls: [],
	buttons: []
}

const mapData = [
	{
		player: {
			x: 4, y: 0
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
		],
		buttons: [
			{x: 7, y: 2},
			{x: 7, y: 6}
		]
	},
	{
		player: {
			x: 7, y: 0
		},
		boxes: [
			{x: 4, y: 4},
			{x: 8, y: 4}
		],
		walls: [
			{x: 1, y: 1},
			{x: 8, y: 1},
			{x: 1, y: 7},
			{x: 8, y: 7}
		],
		buttons: [
			{x: 2, y: 2},
			{x: 2, y: 6}
		]
	}
];

class GameObject {
	static targetCanvas = canvas0;
	static tileId = 0;

	constructor(objMapData) {
		this.x = objMapData.x * game.tileSize;
		this.y = objMapData.y * game.tileSize;
		this.draw();
	}

	draw() {
		this.constructor.targetCanvas.screen.drawImage(
			canvas0.ele,
			game.tileSize * this.constructor.tileId, 0, game.tileSize, game.tileSize,
			this.x, this.y, game.tileSize, game.tileSize
		);
	}
}

class Player extends GameObject {
	static targetCanvas = canvas2;
	static tileId = 0;
}

class Wall extends GameObject {
	static targetCanvas = canvas1;
	static tileId = 1;
}

class Box extends GameObject {
	static targetCanvas = canvas2;
	static tileId = 2;
}

class Button extends GameObject {
	static targetCanvas = canvas1;
	static tileId = 3;

	checkPressed() {
		return loadedData.boxes.some(box => this.x === box.x && this.y === box.y);
	}
}

function loadMap(inputId) {
	let mapId = 0;

	if (mapData[inputId]) mapId = inputId;

	canvas0.clear();
	canvas1.clear();
	canvas2.clear();

	canvas0.loadSprite(colors.player, 0);
	canvas0.loadSprite(colors.walls, 1);
	canvas0.loadSprite(colors.boxes, 2);
	canvas0.loadSprite(colors.buttons, 3);

	loadedData.id = mapId;
	loadedData.player = new Player(mapData[mapId].player);
	loadedData.walls = mapData[mapId].walls.map(wall => new Wall(wall));
	loadedData.boxes = mapData[mapId].boxes.map(box => new Box(box));
	loadedData.buttons = mapData[mapId].buttons.map(button => new Button(button));

	setTimeout(() => {window.requestAnimationFrame(update);}, game.frameRate);
}

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

	let boxToMove;

	function detectObstacle(subject, mainAxis) {
		let canvasLimit;
		let sideAxis;

		switch (mainAxis) {
			case "x":
				canvasLimit = canvas2.ele.width;
				sideAxis = "y";
				break;
			case "y":
				canvasLimit = canvas2.ele.height;
				sideAxis = "x";
				break;
		}

		let sbjSideStart = subject[sideAxis];
		let sbjSideEnd = subject[sideAxis] + game.tileSize;

		function detectDynamicObstacle() {
			return loadedData.boxes.some((obs) => {
				let obsSideStart = obs[sideAxis];
				let obsSideEnd = obs[sideAxis] + game.tileSize;

				if (subject[mainAxis] + game.tileSize * move[mainAxis] === obs[mainAxis]) {}
				else return false;

				if ((sbjSideStart >= obsSideStart && sbjSideStart < obsSideEnd) || (sbjSideEnd > obsSideStart && sbjSideEnd <= obsSideEnd)) {}
				else return false;

				if (sbjSideStart === obsSideStart && sbjSideEnd === obsSideEnd) {
					if (subject === loadedData.player && move[sideAxis] === 0) {
						boxToMove = obs;
						return false;
					} else return true;
				}

				return true;
			});
		}

		function detectStaticObstacle() {
			return loadedData.walls.some((obs) => {
				let obsSideStart = obs[sideAxis];
				let obsSideEnd = obs[sideAxis] + game.tileSize;

				if (subject[mainAxis] + game.tileSize * move[mainAxis] === obs[mainAxis]) {}
				else return false;

				if ((sbjSideStart >= obsSideStart && sbjSideStart < obsSideEnd) || (sbjSideEnd > obsSideStart && sbjSideEnd <= obsSideEnd)) return true;
				else return false;
			});
		}

		function detectOOB() {
			return subject[mainAxis] + game.tileSize * Math.max(0, move[mainAxis]) === canvasLimit * Math.max(0, move[mainAxis]);
		}

		return detectDynamicObstacle() || detectStaticObstacle() || detectOOB();
	}

	function movePlayer() {
		let canMoveX = (move.x !== 0 && !detectObstacle(loadedData.player, "x"));
		let canMoveY = (move.y !== 0 && !detectObstacle(loadedData.player, "y"));

		if (canMoveX) {
			if (boxToMove) {
				if (!detectObstacle(boxToMove, "x")) {
					boxToMove.x += game.moveDist * move.x;
					loadedData.player.x += game.moveDist * move.x;
				}
			}
			else loadedData.player.x += game.moveDist * move.x;
		}

		if (canMoveY && !detectObstacle(loadedData.player, "y")) {
			if (boxToMove) {
				if (!detectObstacle(boxToMove, "y")) {
					boxToMove.y += game.moveDist * move.y;
					loadedData.player.y += game.moveDist * move.y;
				}
			}
			else loadedData.player.y += game.moveDist * move.y;
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
	loadedData.player.draw();
	loadedData.boxes.forEach(box => box.draw());
}

function checkButtons() {
	return loadedData.buttons.every(button => button.checkPressed());
}

function update() {
	canvas2.clear();
	movement();
	draw();

	if (checkButtons() === false) setTimeout(() => window.requestAnimationFrame(update), game.frameRate);
	else setTimeout(() => loadMap(loadedData.id + 1), 1000);
}

document.addEventListener("keydown", keyPressListener);
document.addEventListener("keyup", keyReleaseListener);
loadMap(0);