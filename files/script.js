const canvas0 = document.createElement("canvas");
canvas0.screen = canvas0.getContext("2d");
canvas0.width = 320;
canvas0.height = 32;

const canvas1 = document.getElementById("canvasLayer1");
canvas1.screen = canvas1.getContext("2d");
canvas1.width = 320;
canvas1.height = 288;

const canvas2 = document.getElementById("canvasLayer2");
canvas2.screen = canvas2.getContext("2d");
canvas2.width = 320;
canvas2.height = 288;

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
	goals: "#00FF00"
}

const loadedData = {
	id: 0,
	player: {x:0,y:0},
	boxes: [],
	walls: [],
	goals: []
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
		],
		goals: [
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
		goals: [
			{x: 2, y: 2},
			{x: 2, y: 6}
		]
	}
];

function loadMap(mapIndex) {
	canvas0.screen.clearRect(0, 0, canvas0.width, canvas0.height);
	canvas1.screen.clearRect(0, 0, canvas1.width, canvas1.height);
	canvas2.screen.clearRect(0, 0, canvas2.width, canvas2.height);

	canvas0.screen.fillStyle = colors.player;
	canvas0.screen.fillRect(game.tileSize * 0, 0, game.tileSize, game.tileSize);

	canvas0.screen.fillStyle = colors.boxes;
	canvas0.screen.fillRect(game.tileSize * 1, 0, game.tileSize, game.tileSize);

	canvas0.screen.fillStyle = colors.walls;
	canvas0.screen.fillRect(game.tileSize * 2, 0, game.tileSize, game.tileSize);

	canvas0.screen.fillStyle = colors.goals;
	canvas0.screen.fillRect(game.tileSize * 3, 0, game.tileSize, game.tileSize);

	loadedData.walls = [];
	mapData[mapIndex].walls.forEach((wall) => {
		let loadedWall = {x: wall.x * game.tileSize, y: wall.y * game.tileSize}
		loadedData.walls.push(loadedWall);

		canvas1.screen.drawImage(
			canvas0,
			game.tileSize * 2, 0, game.tileSize, game.tileSize,
			loadedWall.x, loadedWall.y, game.tileSize, game.tileSize
		);
	});

	loadedData.goals = [];
	mapData[mapIndex].goals.forEach((goal) => {
		let loadedGoal = {x: goal.x * game.tileSize, y: goal.y * game.tileSize}
		loadedData.goals.push(loadedGoal);

		canvas1.screen.drawImage(
			canvas0,
			game.tileSize * 3, 0, game.tileSize, game.tileSize,
			loadedGoal.x, loadedGoal.y, game.tileSize, game.tileSize
		);
	});

	loadedData.player.x = mapData[mapIndex].player.x * game.tileSize;
	loadedData.player.y = mapData[mapIndex].player.y * game.tileSize;
	canvas2.screen.drawImage(
		canvas0,
		game.tileSize * 0, 0, game.tileSize, game.tileSize,
		loadedData.player.x, loadedData.player.y, game.tileSize, game.tileSize
	);

	loadedData.boxes = [];
	mapData[mapIndex].boxes.forEach((box) => {
		let loadedBox = {x: box.x * game.tileSize, y: box.y * game.tileSize}
		loadedData.boxes.push(loadedBox);

		canvas2.screen.drawImage(
			canvas0,
			game.tileSize * 1, 0, game.tileSize, game.tileSize,
			loadedBox.x, loadedBox.y, game.tileSize, game.tileSize
		);
	});

	loadedData.id = mapIndex;
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
				canvasLimit = canvas2.width;
				sideAxis = "y";
				break;
			case "y":
				canvasLimit = canvas2.height;
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
	canvas2.screen.drawImage(
		canvas0,
		game.tileSize * 0, 0, game.tileSize, game.tileSize,
		loadedData.player.x, loadedData.player.y, game.tileSize, game.tileSize
	);
	loadedData.boxes.forEach((box) => {
		canvas2.screen.drawImage(
			canvas0,
			game.tileSize * 1, 0, game.tileSize, game.tileSize,
			box.x, box.y, game.tileSize, game.tileSize
		);
	});
}

function checkGoals() {
	return loadedData.goals.every((goal) => {
		return loadedData.boxes.some((box) => {
			return goal.x === box.x && goal.y === box.y;
		});
	});
}

function update() {
	canvas2.screen.clearRect(0, 0, canvas2.width, canvas2.height);
	movement();
	draw();

	if (checkGoals() === false) setTimeout(() => {window.requestAnimationFrame(update);}, game.frameRate);
	else if (mapData[loadedData.id + 1]) loadMap(loadedData.id + 1);
	else loadMap(0);
}

document.addEventListener("keydown", keyPressListener);
document.addEventListener("keyup", keyReleaseListener);
loadMap(0);