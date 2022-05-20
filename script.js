const canvas = document.getElementById("canvas");
canvas.screen = canvas.getContext("2d");
canvas.width = 320;
canvas.height = 288;

const game = {
	tileSize: 32,
	frameRate: 1000 / 60,
	moveSpeed: 1000 / 10,
	moveDistance: 16
}

const player = {
	color: "#FF0000",
	x: game.tileSize * 0,
	y: game.tileSize * 0
}

const wall = {
	color: "#FFFFFF",
	pos: [
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
	right: 0
}

let lastMove = 0;

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

	function detectCollision(mainAxis) {
		let canvasLimit;
		let sideAxis;

		switch (mainAxis) {
			case "x":
				canvasLimit = canvas.width;
				sideAxis = "y";
				break;
			case "y":
				canvasLimit = canvas.height;
				sideAxis = "x";
				break;
		}

		function detectOOB() {
			return player[mainAxis] + game.tileSize * Math.max(0, move[mainAxis]) === canvasLimit * Math.max(0, move[mainAxis]);
		}

		function detectWall() {
			return wall.pos.some((wall) => {
				let alignedWithWall;
				let adjacentToWall;

				if (
					(player[sideAxis] === wall[sideAxis] || player[sideAxis] + game.tileSize === wall[sideAxis] + game.tileSize)
					|| (player[sideAxis] > wall[sideAxis] && player[sideAxis] < wall[sideAxis] + game.tileSize)
					|| (player[sideAxis] + game.tileSize > wall[sideAxis] && player[sideAxis] + game.tileSize < wall[sideAxis] + game.tileSize)
				) alignedWithWall = true;

				if (player[mainAxis] + game.tileSize * move[mainAxis] === wall[mainAxis]) adjacentToWall = true;

				return alignedWithWall && adjacentToWall;
			});
		}

		return detectOOB() || detectWall();
	}

	function movePlayer() {
		let canMoveX = (move.x !== 0 && !detectCollision("x"));
		let canMoveY = (move.y !== 0 && !detectCollision("y"));

		if (canMoveX) player.x += game.moveDistance * move.x;
		if (canMoveY && !detectCollision("y")) player.y += game.moveDistance * move.y;
		if (canMoveX || canMoveY) lastMove = currentTime;
	}

	if (move.x === 0 && move.y === 0) {
		if (lastMove !== 0) lastMove = 0;
	}
	
	if (move.x !== 0 || move.y !== 0) {
		if (lastMove === 0) movePlayer();
		if (lastMove !== 0) {
			if (currentTime - lastMove >= game.moveSpeed) movePlayer();
		}
	}
}

function draw() {
	function drawPlayer() {
		canvas.screen.fillStyle = player.color;
		canvas.screen.fillRect(player.x, player.y, game.tileSize, game.tileSize);
	}

	function drawWall() {
		canvas.screen.fillStyle = wall.color;
		wall.pos.forEach(wall => canvas.screen.fillRect(wall.x, wall.y, game.tileSize, game.tileSize));
	}

	drawPlayer();
	drawWall();
}

function update() {
	setTimeout(() => {window.requestAnimationFrame(update);}, game.frameRate);

	canvas.screen.clearRect(0, 0, canvas.width, canvas.height);
	movement();
	draw();
}

document.addEventListener("keydown", keyPressListener);
document.addEventListener("keyup", keyReleaseListener);
window.requestAnimationFrame(update);