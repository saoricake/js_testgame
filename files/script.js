// define a class for the canvases
class Canvas {
	// canvasElement: must be an HTMLCanvasElement
	constructor(canvasElement) {
		this.ele = canvasElement;
		this.ctx = this.ele.getContext("2d");
	}

	// instance method that clears the calling canvas
	clear() {
		this.ctx.clearRect(0, 0, this.ele.width, this.ele.height);
	}
}

// create the canvas objects.
const canvas0 = new Canvas(document.getElementById("canvasLayer0")); // invisible canvas where sprites are drawn and copied from
const canvas1 = new Canvas(document.getElementById("canvasLayer1")); // where walls are drawn
const canvas2 = new Canvas(document.getElementById("canvasLayer2")); // where moving objects (the player and boxes) are drawn

// get the <div> where the current level's number is displayed
const currentMapText = document.getElementById("divCurrentMap");

// define the game's parameters
const game = {
	tileSize: 32, // the size of a "tile", in pixels
	moveDist: 16, // how much moving objects move per frame, also in pixels. must be half of tileSize
	gameSpeed: 1000 / 60, // the interval between game frames, in ms. calculated as (1000 / fps)
	moveSpeed: 1000 / 10 // the interval between player movement "steps" if a movement key is held down, in ms
}

// this is where live game object data is loaded to, held, and modified while stuff is going on
const loadedData = {
	id: 0,
	player: {},
	boxes: [],
	walls: [],
	buttons: []
}

// database of maps and their game objects. the X and Y values are the initial coordinates (IN TILES) of the objects
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

// define a generic class for game objects
class GameObject {
	static targetCanvas = canvas0;
	static color = "#000000";
	static tileId = 0; // where in canvas0 (horizontally) this class' sprite will be drawn

	static loadSprite() {
		canvas0.ctx.fillStyle = this.color;
		canvas0.ctx.fillRect(
			game.tileSize * this.tileId, 0, // the X and Y coordinates of the top-left corner of the rectangle
			game.tileSize, game.tileSize // the X and Y lengths of the rectangle
		);
	}

	// objMapData: an individual game object from mapData
	// NOTE: in mapData, objects' coordinates are saved in tiles, so here we multiply them by tileSize to get the same coordinates but in pixels.
	constructor(objMapData) {
		this.x = objMapData.x * game.tileSize;
		this.y = objMapData.y * game.tileSize;
		this.draw();
	}

	// instance method to copy the calling object's sprite from canvas0 and paste it on targetCanvas ("draw" it)
	draw() {
		this.constructor.targetCanvas.ctx.drawImage(
			canvas0.ele,
			game.tileSize * this.constructor.tileId, 0, game.tileSize, game.tileSize,
			this.x, this.y, game.tileSize, game.tileSize
		);
	}
}

// subclasses for the player character, walls, boxes, and buttons
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

	// a different loadSprite() for buttons so they'll look like small circles instead of squares
	static loadSprite() {
		canvas0.ctx.fillStyle = this.color;
		canvas0.ctx.beginPath();
		canvas0.ctx.arc(
			game.tileSize * (this.tileId + 0.5), game.tileSize / 2, // the X and Y coordinates of the center of the circle
			game.tileSize * 0.3125, 0, 2 * Math.PI // the radius and starting/ending angles of the circle
		);
		canvas0.ctx.fill();
	}

	// instance method to check if a box has the same coordinates as the calling button
	checkPressed() {
		return loadedData.boxes.some(box => this.x === box.x && this.y === box.y);
	}
}

// function for loading a new map.
// inputId: an integer. if mapData[inputId] exists, then that map is loaded; if it doesn't, mapData[0] is loaded instead.
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

// map arrow keys to movement
const controller = {
	up: "ArrowUp",
	down: "ArrowDown",
	left: "ArrowLeft",
	right: "ArrowRight"
}

// the properties of input keep track of whether inputs are being made or not.
// lastMove: the time (in ms since the UNIX epoch) when movement was last applied. this is used later.
const inputs = {
	up: 0,
	down: 0,
	left: 0,
	right: 0,
	lastMove: 0
}

// listeners for pressing and releasing keys.
// NOTE 1: UNIX time is used instead of simple booleans so that if, for example, both left and right are held down at the same time, priority can be given to the one that was pressed last.
// NOTE 2: it might have been possible to have multiple keys work for each input, allowing for e.g. wasd as well. maybe if the properties of controller were arrays, and the listeners checked for the key with controller[n].find() or something. although i'd then need to account for what would happen if you, say, held both right and d down at the same time, or let one go but kept holding the other down...
function keyPressListener(event) {
	if (event.key === controller.up) inputs.up ||= Date.now();
	if (event.key === controller.down) inputs.down ||= Date.now();
	if (event.key === controller.left) inputs.left ||= Date.now();
	if (event.key === controller.right) inputs.right ||= Date.now();
}

function keyReleaseListener(event) {
	if (event.key === controller.up) inputs.up &&= 0;
	if (event.key === controller.down) inputs.down &&= 0;
	if (event.key === controller.left) inputs.left &&= 0;
	if (event.key === controller.right) inputs.right &&= 0;
}

// the function for handling movement
function movement() {
	let currentTime = Date.now();
	let boxesToMove = new Set();

	// move: a simplification of the values in input. you can't move in opposite directions at once, so each axis has three values it can be: -1, 0, and +1. which one each is is determined by which of the associated inputs was pressed last, if any, as described earlier.
	// NOTE 1: the 0 in Math.max() and case 0 are required so that the move properties don't default to -1 if all the inputs are unpressed (0).
	// NOTE 2: it really feels like there must be a simpler way of doing this, that doesn't involve switches, but... i couldn't figure it out! ugh
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

	// function for detecting collision.
	// subject: the object that is doing the moving. can be either the player or a box that's being pushed.
	// mainAxis: the primary axis along which the subject is moving.
	// NOTE 1: the function is named "obstacleDetected" because it works like it's answering a question; it returns true (yes) if an obstacle is indeed detected, and false (no) if not. naming it like this makes more sense than if i'd called it "collisionHandler" or something.
	// NOTE 2: the reason "mainAxis" is a thing is so that the function will only check for collision along a single axis at a time. this might sound inefficient compared to just having it check collision on both axes at once, but if i did that, then moving diagonally into a wall would cause the player to stop moving entirely, instead of simply moving along it.
	function obstacleDetected(subject, mainAxis) {
		let canvasLimit, sideAxis;
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

		// general-purpose function for checking if the subject is adjacent to an obstacle
		function adjacentObstacleDetected(obs) {
			const sbjSideStart = subject[sideAxis];
			const sbjSideEnd = subject[sideAxis] + game.tileSize;
			const obsSideStart = obs[sideAxis];
			const obsSideEnd = obs[sideAxis] + game.tileSize;

			return (
				(subject[mainAxis] + game.tileSize * Math.max(0, move[mainAxis]) === obs[mainAxis] + game.tileSize * Math.max(0, -move[mainAxis]))
				&& ((sbjSideStart >= obsSideStart && sbjSideStart < obsSideEnd) || (sbjSideEnd > obsSideStart && sbjSideEnd <= obsSideEnd))
			);
		}

		// function for detecting collisions with dynamic obstacles (i.e. boxes)
		function dynamicObstacleDetected() {
			return loadedData.boxes.some((obs) => {
				if (!adjacentObstacleDetected(obs)) return false;

				// if the subject is the player, they're only moving along the main axis, and the box is not itself incapable of moving, then add it to boxesToMove and return false.
				if (subject === loadedData.player && move[sideAxis] === 0 && !obstacleDetected(obs, mainAxis)) {
					boxesToMove.add(obs);
					return false;
				} else return true;
			});
		}

		// function for detecting collisions with static objects (walls)
		function staticObstacleDetected() {
			return loadedData.walls.some(obs => adjacentObstacleDetected(obs));
		}

		// function for detecting collisions with the edge of the canvas (out-of-bounds)
		function oobDetected() {
			return subject[mainAxis] + game.tileSize * Math.max(0, move[mainAxis]) === canvasLimit * Math.max(0, move[mainAxis]);
		}

		return dynamicObstacleDetected() || staticObstacleDetected() || oobDetected();
	}

	function movePlayer() {
		// check whether the player can, from their current position, move along either axis
		let canMove = {
			x: move.x !== 0 && !obstacleDetected(loadedData.player, "x"),
			y: move.y !== 0 && !obstacleDetected(loadedData.player, "y")
		}

		// iterate over canMove to apply movement to any boxes in boxesToMove, as well as the player.
		// NOTE 1: collision needs to be checked again here. if it wasn't, the fact that X movement happens before Y movement means X movement could put you in a position where Y movement is not longer possible, even though it was before any movement happened.
		// NOTE 2: if the player could push boxes while moving diagonally, this code would likely make boxes not move as intended, as they're moved once for each axis... you can't do that, so it's not a problem, but that's something to keep in mind
		for (const axis in move) {
			if (canMove[axis] && !obstacleDetected(loadedData.player, axis)) {
				boxesToMove.forEach(box => box[axis] += game.moveDist * move[axis]);
				loadedData.player[axis] += game.moveDist * move[axis];
				inputs.lastMove = currentTime;
			}
		}
	}

	// if movement keys were not being pressed this frame, set lastMove to 0 (if it wasn't 0 already).
	// if movement keys were pressed, AND lastInput is 0 or it happened more than moveSpeed ms ago, move the player.
	// NOTE: i'm still surprised that currentTime - inputs.lastMove >= game.moveSpeed checks for both those things by itself... lol
	if (move.x === 0 && move.y === 0) inputs.lastMove &&= 0;
	if ((move.x !== 0 || move.y !== 0) && currentTime - inputs.lastMove >= game.moveSpeed) movePlayer();
}

// function for drawing the player and boxes. walls are not included because they can't move.
// NOTE: it would've been nice to have this set so things are only drawn on frames where they've moved...
function draw() {
	loadedData.player.draw();
	loadedData.boxes.forEach(box => box.draw());
}

// function for checking whether every button in the map is pressed or not.
// NOTE: maybe it could've been a static method of the Buttons class...?
function checkButtons() {
	return loadedData.buttons.every(button => button.checkPressed());
}

// function for updating the game state and drawing new frames.
function update() {
	canvas2.clear();
	movement();
	draw();

	// if all the buttons in the stage are pressed, show a "level complete" message and pause the game for 1s, then load the next map.
	// else, call this function again in gameSpeed ms.
	if (checkButtons()) {
		currentMapText.innerText = `level ${loadedData.id + 1} complete`;
		setTimeout(() => loadMap(loadedData.id + 1), 1000);
	} else setTimeout(() => window.requestAnimationFrame(update), game.gameSpeed);
}

document.addEventListener("keydown", keyPressListener);
document.addEventListener("keyup", keyReleaseListener);
loadMap(0);