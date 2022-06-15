class Canvas {
	constructor(canvasElement) {
		this.ele = canvasElement;
		this.ctx = this.ele.getContext("2d");
	}

	clear() {
		this.ctx.clearRect(0, 0, this.ele.width, this.ele.height);
	}
}

const canvas0 = new Canvas(document.getElementById("canvasLayer0"));
const canvas1 = new Canvas(document.getElementById("canvasLayer1"));
const canvas2 = new Canvas(document.getElementById("canvasLayer2"));

const currentMapText = document.getElementById("divCurrentMap");

const game = {
	tileSize: 32,
	moveDist: 16,
	frameRate: 1000 / 60,
	moveSpeed: 1000 / 10
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
	static color = "#000000";
	static tileId = 0;
	static loadSprite() {
		canvas0.ctx.fillStyle = this.color;
		canvas0.ctx.fillRect(
			game.tileSize * this.tileId, 0, // the X and Y coordinates of the top-left corner of the rectangle
			game.tileSize, game.tileSize // the X and Y lengths of the rectangle
		);
	}

	constructor(objMapData) {
		this.x = objMapData.x * game.tileSize;
		this.y = objMapData.y * game.tileSize;
		this.draw();
	}

	draw() {
		this.constructor.targetCanvas.ctx.drawImage(
			canvas0.ele,
			game.tileSize * this.constructor.tileId, 0, game.tileSize, game.tileSize,
			this.x, this.y, game.tileSize, game.tileSize
		);
	}
}

class Player extends GameObject {
	static targetCanvas = canvas2;
	static color = "#FF0000";
	static tileId = 0;
}

class Wall extends GameObject {
	static targetCanvas = canvas1;
	static color = "#FFFFFF";
	static tileId = 1;
}

class Box extends GameObject {
	static targetCanvas = canvas2;
	static color = "#8B4513";
	static tileId = 2;
}

class Button extends GameObject {
	static targetCanvas = canvas1;
	static color = "#888888";
	static tileId = 3;
	static loadSprite() {
		canvas0.ctx.fillStyle = this.color;
		canvas0.ctx.beginPath();
		canvas0.ctx.arc(
			game.tileSize * (this.tileId + 0.5), game.tileSize / 2, // the X and Y coordinates of the center of the circle
			game.tileSize * 0.3125, 0, 2 * Math.PI // the radius and starting/ending angles of the circle
		);
		canvas0.ctx.fill();
	}

	checkPressed() {
		return loadedData.boxes.some(box => this.x === box.x && this.y === box.y);
	}
}

function loadMap(inputId) {
	let mapId = mapData[inputId] ? inputId : 0;

	canvas0.clear();
	canvas1.clear();
	canvas2.clear();

	Player.loadSprite();
	Wall.loadSprite();
	Box.loadSprite();
	Button.loadSprite();

	loadedData.id = mapId;
	loadedData.player = new Player(mapData[mapId].player);
	loadedData.walls = mapData[mapId].walls.map(wall => new Wall(wall));
	loadedData.boxes = mapData[mapId].boxes.map(box => new Box(box));
	loadedData.buttons = mapData[mapId].buttons.map(button => new Button(button));

	currentMapText.innerText = `level ${loadedData.id + 1}`;
	window.requestAnimationFrame(update);
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

	let boxToMove = new Set();

	function obstacleDetected(subject, mainAxis) {
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

		function dynamicObstacleDetected() {
			return loadedData.boxes.some((obs) => {
				let obsSideStart = obs[sideAxis];
				let obsSideEnd = obs[sideAxis] + game.tileSize;

				if (
					(subject[mainAxis] + game.tileSize * move[mainAxis] === obs[mainAxis])
					&& ((sbjSideStart >= obsSideStart && sbjSideStart < obsSideEnd) || (sbjSideEnd > obsSideStart && sbjSideEnd <= obsSideEnd))
				) {}
				else return false;

				if (subject === loadedData.player && move[sideAxis] === 0 && !obstacleDetected(obs, mainAxis)) {
					boxToMove.add(obs);
					return false;
				} else return true;
			});
		}

		function staticObstacleDetected() {
			return loadedData.walls.some((obs) => {
				let obsSideStart = obs[sideAxis];
				let obsSideEnd = obs[sideAxis] + game.tileSize;
				
				return (
					(subject[mainAxis] + game.tileSize * move[mainAxis] === obs[mainAxis])
					&& ((sbjSideStart >= obsSideStart && sbjSideStart < obsSideEnd) || (sbjSideEnd > obsSideStart && sbjSideEnd <= obsSideEnd))
				);
			});
		}

		function oobDetected() {
			return subject[mainAxis] + game.tileSize * Math.max(0, move[mainAxis]) === canvasLimit * Math.max(0, move[mainAxis]);
		}

		return dynamicObstacleDetected() || staticObstacleDetected() || oobDetected();
	}

	function movePlayer() {
		let canMoveX = (move.x !== 0 && !obstacleDetected(loadedData.player, "x"));
		let canMoveY = (move.y !== 0 && !obstacleDetected(loadedData.player, "y"));

		if (canMoveX) {
			if (boxToMove.size > 0) {
				boxToMove.forEach(box => box.x += game.moveDist * move.x);
				loadedData.player.x += game.moveDist * move.x;
			}
			else loadedData.player.x += game.moveDist * move.x;
		}

		if (canMoveY && !obstacleDetected(loadedData.player, "y")) {
			if (boxToMove.size > 0) {
				boxToMove.forEach(box => box.y += game.moveDist * move.y);
				loadedData.player.y += game.moveDist * move.y;
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
	else {
		currentMapText.innerText = `level ${loadedData.id + 1} complete`;
		setTimeout(() => loadMap(loadedData.id + 1), 1000);
	}
}

document.addEventListener("keydown", keyPressListener);
document.addEventListener("keyup", keyReleaseListener);
loadMap(0);