var DEBUG = false;

//PIXI Aliases
var Application = PIXI.Application,
  loader = PIXI.Loader.shared,
  resources = PIXI.Loader.shared.resources,
  TextureCache = PIXI.utils.TextureCache,
  Graphics = PIXI.Graphics,
  Rectangle = PIXI.Rectangle,
  Sprite = PIXI.Sprite,
  Text = PIXI.Text;

//Game
var gameRunning = false;
var gameOver = false;
var showingTutorial = false;

var inputPointer = { x: 0, y: 0 }
var delta = { x: 0, y: 0 }
var pointerDown = false;
var pointerMoved = false;

var canHold = true;
var fastFalling = false;
var canFastFall = true;
var fastFallTick = 0;

var keyboardTick = 0;
var keyboardTickDelay = 8;
var timeToCleanDelta = 10;
//Pieces
var blockTypes = [
  { type: "line", id: 10, UIoffset: -0.5, spawnCollumn: 3 },
  { type: "square", id: 20, UIoffset: 0.5, spawnCollumn: 4 },
  { type: "left_L", id: 60, UIoffset: 0, spawnCollumn: 3 },
  { type: "right_L", id: 70, UIoffset: 0, spawnCollumn: 3 },
  { type: "T", id: 30, UIoffset: 0, spawnCollumn: 3 },
  { type: "S", id: 40, UIoffset: 0, spawnCollumn: 3 },
  { type: "Z", id: 50, UIoffset: 0, spawnCollumn: 3 }
];
var blockPiece, nextPiece, blockPieceHold, previewBlockPiece;
var blockSize = 40;
var blocksMatrixSize = { x: 10, y: 20 };
var blocksMatrix;
var randomPieceBag = [];
//Difficulty
var autoMoveCurrentTime = 0;
var fastFallLimitTime = 4;
var level = {
  score: 0, lines: 0, level: 1, autoMoveTimeLimit: 60,
  pointsPerLine: [40, 100, 300, 1200]
};
//UI
var currentLane = 4;
var lanes;
var stageBorderLine;
var stageBorderDefaultWidth = 4;
var stageBorderDefaultColor = 0x111100;
var textStyle = new PIXI.TextStyle({
  fontFamily: "Verdana",
  fontSize: 42,
  fill: "green"
});
var tutorialTextStyle = new PIXI.TextStyle({
  fontFamily: "Verdana",
  fontSize: 32,
  fill: "#222222"
});
var gameOverTextUI = new Text("GAME OVER", textStyle);
var scoreUIText = new Text("Score: 0", textStyle);
var levelUIText = new Text("Level: 1", textStyle);
var linesUIText = new Text("Lines: 0", textStyle);

//Create a Pixi Application
let app = new Application({
  width: 700,
  height: 900,
  antialias: true,
  transparent: true,
  roundPixels: true,
  resolution: 1
}
);

function resize() {
  this.canvasX = ((window.innerWidth - app.renderer.width) >> 1)
  this.canvasY = ((window.innerHeight - app.renderer.height) >> 1)
  app.renderer.view.style.position = 'absolute';
  app.renderer.view.style.left = canvasX + 'px';
  app.renderer.view.style.top = canvasY + 'px';
}

resize();
window.addEventListener('resize', resize);


//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

//debug elements
if (DEBUG) {
  this.debugText = document.getElementById('debugText');
  this.debugText.textContent = "Width: " + window.innerWidth + " - Height: " + window.innerHeight;
}

//Render the stage
app.renderer.render(app.stage);

showTutorial();

//Start the game loop by adding the `gameLoop` function to
//Pixi's `ticker` and providing it with a `delta` argument.
app.ticker.add(delta => main(delta));
app.ticker.add(delta => refreshRemoveBlocksEffects(delta));

async function initGame() {
  this.gameOver = false;
  if (blocksMatrix) { //if game was restared
    clearLines(true);
    clearBlocksMatrix();

    app.stage.removeChild(gameOverTextUI);
    this.level.score = 0;
    this.level.level = 1;
    this.level.lines = 0;
    this.scoreUIText.text = ("Score: " + this.level.score);
    this.levelUIText.text = ("Level: " + this.level.level);
    this.linesUIText.text = ("Lines: " + this.level.lines);

    if (this.blockPiece) {
      this.blockPiece.delete();
      this.blockPiece = undefined;
    }
    if (this.previewBlockPiece) {
      this.previewBlockPiece.delete();
      this.previewBlockPiece = undefined;
    }
    if (this.nextPiece) {
      this.nextPiece.delete();
      this.nextPiece = undefined;
    }
    if (this.blockPieceHold) {
      this.blockPieceHold.delete();
      this.blockPieceHold = undefined;
    }
    updateUI(200);
  } else {
    initInput();
    drawUI();
  }

  //begin countdown
  var beginGameCountdownText = new Text("3", tutorialTextStyle);
  beginGameCountdownText.style.fontSize = 96;
  beginGameCountdownText.style.fill = "#446666";
  beginGameCountdownText.x = this.blockSize * 5 - 10;
  beginGameCountdownText.y = this.blockSize * 10;
  app.stage.addChild(beginGameCountdownText);
  await sleep(1000);
  beginGameCountdownText.text = "2";
  beginGameCountdownText.style.fontSize = 136;
  beginGameCountdownText.style.fill = "#883333";
  beginGameCountdownText.x -= 16;
  beginGameCountdownText.y -= 16;
  await sleep(1000);
  beginGameCountdownText.text = "1";  
  beginGameCountdownText.style.fontSize = 176;
  beginGameCountdownText.style.fill = "#DD0000";
  beginGameCountdownText.x -= 16;
  beginGameCountdownText.y -= 16;
  await sleep(1000);  
  app.stage.removeChild(beginGameCountdownText);
  //end countdown

  createRandomPieceBag();
  clearBlocksMatrix();
  this.createBlockPiece(false);
  this.gameRunning = true;
}

function clearBlocksMatrix() {
  blocksMatrix = [];
  for (let i = 0; i < this.blocksMatrixSize.x; i++) {
    blocksMatrix[i] = [];
  }
}

function endGame() {
  this.gameOver = true;
  this.gameRunning = false;
  this.gameOverTextUI.position.set(20, 10);
  app.stage.addChild(this.gameOverTextUI);
  if (this.nextPiece) {
    this.nextPiece.delete();
  }
  if (this.blockPieceHold) {
    this.blockPieceHold.delete();
    this.blockPieceHold = null;
  }

  this.stageBorderLine.graphicsData[0].lineColor = "0xFF0000";
  setStageBorderStyleEffect(10, 1);
}

function initInput() {
  document.addEventListener('keydown', inputKeyDown);
  document.addEventListener('keyup', inputKeyUp);
  document.addEventListener('pointerdown', inputPointerDown);
  document.addEventListener('pointermove', inputPointerMove);
  document.addEventListener('pointerup', inputPointerUp);

  //create "lanes" for input
  this.lanes = [10];
  for (i = 0; i < 10; i++) {
    let lane = new Graphics();
    lane.lineStyle(1, 0x555555, 1);
    lane.beginFill(0xFFFFFF);
    lane.drawRect(0, 0, blockSize, blockSize * 20);
    lane.endFill();
    lane.x = blockSize * i;
    lane.y = 0;
    app.stage.addChild(lane);
    this.lanes[i] = lane;
  }
}

function showTutorial() {
  //listener for quick close tutorial on keyboard
  document.addEventListener('keydown', function () {
    if (!gameRunning && showingTutorial) {
        closeTutorial();
    }
  });
  this.showingTutorial = true;
  this.tutorialImage = Sprite.fromImage('rsc/tutorial.png')
  this.tutorialImage.x = 200;
  this.tutorialImage.y = 50;
  app.stage.addChild(this.tutorialImage);

  this.tutorialButton = new Graphics();
  this.tutorialButton.lineStyle(3, 0x222200, 1);
  this.tutorialButton.beginFill(0xEEEEEE);
  this.tutorialButton.drawRect(0,0,200,50);
  this.tutorialButton.endFill();
  this.tutorialButton.x = (this.blockSize * 5) + 100;
  this.tutorialButton.y = (this.blockSize * 10);
  this.tutorialButton.interactive = true;
  this.tutorialButton.buttonMode = true;
  this.tutorialButton.on("pointerdown", closeTutorial);
  app.stage.addChild(this.tutorialButton);

  this.tutorialTitleText = new Text("TELETRIS", tutorialTextStyle);
  this.tutorialTitleText.position.set((this.blockSize * 5) + 140, 0);
  app.stage.addChild(this.tutorialTitleText);

  this.tutorialPlayText = new Text("PLAY", tutorialTextStyle);
  this.tutorialPlayText.position.set((this.blockSize * 5) + 160, (this.blockSize * 10) + 5);
  app.stage.addChild(this.tutorialPlayText);
}

function closeTutorial() {
  this.showingTutorial = false;
  app.stage.removeChild(tutorialImage);
  app.stage.removeChild(tutorialButton);
  app.stage.removeChild(tutorialPlayText);
  app.stage.removeChild(tutorialTitleText);
  initGame();
}

function drawUI() {

  //dynamic
  // score background panel
  let scorePanel = new Graphics();
  scorePanel.lineStyle(stageBorderDefaultWidth, stageBorderDefaultColor, 1);
  scorePanel.beginFill(0xDDDDEE);
  scorePanel.drawRect(0, 0, this.blockSize * 8, this.blockSize * 4 - 10);
  scorePanel.endFill();
  scorePanel.x = 10 * this.blockSize + 10;
  scorePanel.y = 1;
  app.stage.addChild(scorePanel);

  //score texts
  this.scoreUIText.position.set(10 * this.blockSize + 20, 00);
  app.stage.addChild(this.scoreUIText);
  this.levelUIText.position.set(10 * this.blockSize + 20, 50);
  app.stage.addChild(this.levelUIText);
  this.linesUIText.position.set(10 * this.blockSize + 20, 100);
  app.stage.addChild(this.linesUIText);
  //static
  let staticTextPadding = 10;
  let nextPieceUIText = new Text("Next", textStyle);
  nextPieceUIText.position.set(12 * this.blockSize + staticTextPadding, 70 + (blockSize * 3));
  app.stage.addChild(nextPieceUIText);
  let holdPieceUIText = new Text("Hold", textStyle);
  holdPieceUIText.position.set(12 * this.blockSize + staticTextPadding, 310 + (blockSize * 5));
  app.stage.addChild(holdPieceUIText);

  //stage borders
  let stageBorderPadding = 2;
  stageBorder = new Graphics();
  stageBorder.lineStyle(stageBorderDefaultWidth, stageBorderDefaultColor, 1);
  stageBorder.moveTo(0, 1);
  stageBorder.lineTo((this.blocksMatrixSize.x * this.blockSize) + stageBorderPadding, 1);
  stageBorder.lineTo((this.blocksMatrixSize.x * this.blockSize) + stageBorderPadding, (this.blocksMatrixSize.y * this.blockSize) + stageBorderPadding);
  stageBorder.lineTo(0, (this.blocksMatrixSize.y * this.blockSize) + stageBorderPadding);
  stageBorder.lineTo(0, 1);
  app.stage.addChild(stageBorder);

  //stage line to add effects to
  this.stageBorderLine = new Graphics();
  this.stageBorderLine.lineStyle(stageBorderDefaultWidth, stageBorderDefaultColor, 1);
  this.stageBorderLine.moveTo(0, 1);
  this.stageBorderLine.lineTo((this.blocksMatrixSize.x * this.blockSize) + stageBorderPadding, 1);
  this.stageBorderLine.lineTo((this.blocksMatrixSize.x * this.blockSize) + stageBorderPadding, (this.blocksMatrixSize.y * this.blockSize) + stageBorderPadding);
  this.stageBorderLine.lineTo(0, (this.blocksMatrixSize.y * this.blockSize) + stageBorderPadding);
  this.stageBorderLine.lineTo(0, 1);
  this.stageBorderLine.alpha = 0;
  app.stage.addChild(this.stageBorderLine);

  //next piece border lines
  let nextPieceBorderLine = new Graphics();
  nextPieceBorderLine.lineStyle(4, stageBorderDefaultColor, 2);
  nextPieceBorderLine.moveTo(11 * this.blockSize, 100 + (blockSize * 2));
  nextPieceBorderLine.lineTo(16 * this.blockSize, 100 + (blockSize * 2));
  nextPieceBorderLine.lineTo(16 * this.blockSize, 100 + (blockSize * 9));
  nextPieceBorderLine.lineTo(11 * this.blockSize, 100 + (blockSize * 9));
  nextPieceBorderLine.lineTo(11 * this.blockSize, 100 + (blockSize * 2));
  app.stage.addChild(nextPieceBorderLine);

  //hold piece border lines
  let holdPieceBorderLine = new Graphics();
  holdPieceBorderLine.lineStyle(4, stageBorderDefaultColor, 2);
  holdPieceBorderLine.moveTo(11 * this.blockSize, 100 + (blockSize * 10));
  holdPieceBorderLine.lineTo(16 * this.blockSize, 100 + (blockSize * 10));
  holdPieceBorderLine.lineTo(16 * this.blockSize, 82 + (blockSize * 18));
  holdPieceBorderLine.lineTo(11 * this.blockSize, 82 + (blockSize * 18));
  holdPieceBorderLine.lineTo(11 * this.blockSize, 100 + (blockSize * 10));
  app.stage.addChild(holdPieceBorderLine);
}

//Main Loop
function main(delta) {
  if (!this.gameRunning || !blockPiece) {
    this.gameOverTextUI.position.set(blockSize * 2 + randomInt(1, 5), blockSize * 9 + randomInt(1, 5));
    return;
  }

  //fastfall 'tick'
  if (!this.canFastFall) {
    this.fastFallTick += delta;
    if (this.fastFallTick >= fastFallLimitTime) {
      this.canFastFall = true;
      this.fastFallTick = 0;
    }
  }

  if (this.fastFalling && this.canFastFall) {
    movePiece(this.blockPiece, 0, 1);
    this.autoMoveCurrentTime = 0;
    this.canFastFall = false;
  }

  //piece auto movement
  this.autoMoveCurrentTime += delta;
  if (this.autoMoveCurrentTime >= this.level.autoMoveTimeLimit) {
    movePiece(this.blockPiece, 0, 1);
    this.autoMoveCurrentTime = 0;
  }

  //keyboard controls
  if (this.keyboardMove) {
    keyboardTick += delta;
  }

  if (keyboardTick >= keyboardTickDelay) {
    keyboardTick = 0;
    movePiece(this.blockPiece, this.keyboardMoveDirection, 0);
  }

  //delta touch drag cleanup (FIXME: can cause unwanted rotation)
  if (this.pointerMoved) {
    this.pointerMoved = false;
    this.cleanDeltaTick = 0;
  } else {
    if (this.cleanDeltaTick >= this.timeToCleanDelta && this.cleanDeltaTick <= this.timeToCleanDelta + 5) {
      this.delta = { x: 0, y: 0 };
    } else {
      this.cleanDeltaTick++;
    }

    if (this.delta && DEBUG) {
      debugText.textContent = "delta x: " + this.delta.x + " - delta y: " + this.delta.y;
    }
  }

  updateUI(delta);
}

function refreshRemoveBlocksEffects(delta) {
  //removed blocks effects
  if (this.blocksRemovedForEffects) {
    animateRemovedBlocks(delta);
  }

}

function updateUI(delta) {
  //stage borders "drop" effect
  if (this.stageBorderLine.graphicsData[0].lineWidth >= this.stageBorderDefaultWidth) {
    this.setStageBorderStyleEffect(this.stageBorderLine.graphicsData[0].lineWidth - delta, this.stageBorderLine.alpha);
  }
  if (this.stageBorderLine.alpha > 0) {
    this.stageBorderLine.alpha -= delta * 0.1;
  }

  //default Lane effects
  if (this.lanes) {
    for (i = 0; i < 10; i++) {
      lane = this.lanes[i];
      lane.graphicsData[0].fillColor = 0xFFFFFF;
      if (lane.alpha >= 0.2) {
        lane.alpha -= 0.15 * delta;
      }
      if (lane.graphicsData[0].lineWidth < 5) {
        lane.graphicsData[0].lineWidth++;
      }
      lane.dirty++;
      lane.clearDirty++;
    };
  }

  //Lane effects on blockPiece lanes
  if (this.blockPiece && this.lanes) {
    this.blockPiece.getCurrentLanes().forEach(lane => {
      var lane_ = this.lanes[this.blockPiece.posX + lane];
      lane_.alpha = 0.10;
      lane_.graphicsData[0].fillColor = this.blockPiece.color;
      lane_.graphicsData[0].lineWidth = 1;
      lane_.dirty++;
      lane_.clearDirty++;
    });
  }
}

function createBlockPiece(hold) {
  if (this.blockPiece) {
    if (!hold) {
      this.canHold = true;
      this.pointerDown = false;
      this.delta = this.inputPointer;
      this.fastFalling = false;
    }
    this.blockPiece.delete();
    this.blockPiece = null;
  }

  if (!this.nextPiece) {
    createNextPiece();
  }

  //chooses between holdPiece or nextPiece for the new blockPiece
  let nextBlockType = (hold && this.blockPieceHold) ? this.blockPieceHold.blockInfo : this.nextPiece.blockInfo;
  this.blockPiece = new BlockPiece(nextBlockType, nextBlockType.spawnCollumn, 0, this.blockSize);
  this.blockPiece.active = true;
  //preview block
  if (this.previewBlockPiece) {
    this.previewBlockPiece.delete();
  }
  this.previewBlockPiece = new BlockPiece(nextBlockType, nextBlockType.spawnCollumn, 0, this.blockSize);
  this.previewBlockPiece.alpha = 0.2;
  this.previewBlockPiece.drawBlocks();

  if (checkPieceCollision(this.blockPiece, 0, 0)) {
    endGame();
  }

  if (!hold) {
    createNextPiece();
  }
  this.autoMoveCurrentTime = 0;
  this.currentLane = 4;
  dropPiece(previewBlockPiece);
}

function createNextPiece() {
  if (this.nextPiece) {
    this.nextPiece.delete();
  }

  let nextPieceType;
  if (this.randomPieceBag.length > 0) {
    nextPieceType = this.randomPieceBag.pop();
  } else {
    createRandomPieceBag();
    nextPieceType = this.randomPieceBag.pop();
  }
  this.nextPiece = new BlockPiece(this.blockTypes[nextPieceType], 12 + this.blockTypes[nextPieceType].UIoffset, 7, this.blockSize);
}

function createRandomPieceBag() {
  this.randomPieceBag = [7];
  this.remainingPieces = [0, 1, 2, 3, 4, 5, 6];
  for (let i = 6; i >= 0; i--) {
    this.randomPieceBag[i] = remainingPieces.splice(randomInt(0, i), 1);
  }
}

//////Input
function inputKeyDown(event) {
   //restarts the game if it's over
  if (gameOver) {
    initGame();
    return;
  }

  if (!gameRunning) {
    return;
  }

  switch (event.key) {
    case "ArrowLeft":
      keyboardMoveDirection = -1;
      keyboardMove = true;
      keyboardTick = keyboardTickDelay;
      break;
    case "ArrowRight":
      keyboardMoveDirection = 1;
      keyboardMove = true;
      keyboardTick = keyboardTickDelay;
      break;
    case "ArrowDown":
      fastFalling = true;
      break;
    case "Shift":
      holdPiece();
      break;
    case "c":
      holdPiece();
      break;
  }
  //rotation input
  if (event.key == 'z' || event.key == 'x' || event.key == 'ArrowUp') {
    rotatePiece(event.key == 'z' ? "left" : "right");
  }

  if (event.which == 32) {
    dropPiece(blockPiece);
  }
}

function inputKeyUp(event) {
  switch (event.key) {
    case "ArrowLeft":
      keyboardMove = false;
      keyboardTick = 3;
      break;
    case "ArrowRight":
      keyboardMove = false;
      keyboardTick = 3;
      break;
    case "ArrowDown":
      fastFalling = false;
      break;
  }
}

function inputPointerDown(event) {
  inputPointer = { x: Math.round(event.x), y: Math.round(event.y) };
  delta = { x: 0, y: 0 };
  pointerDown = true;
}

function inputPointerMove(event) {
  pointerMoved = true;
  if (!inputPointer || !pointerDown || !gameRunning) {
    return;
  }

  // piece movement (drag)
  if (Math.abs(delta.x) >= 20 && Math.round(delta.x) != inputPointer.x && delta.y > -50) {
    movePiece(blockPiece, Math.sign(-delta.x), 0);
    inputPointer = { x: Math.round(event.x), y: Math.round(event.y) };
  }

  delta.x = Math.round(inputPointer.x - event.x);
  delta.y = Math.round(inputPointer.y - event.y);

  //cancel fast fall
  if (delta.y > 10) {
    fastFalling = false;
  }

  //hold
  if (delta.y > 100) {
    holdPiece();
  }

  //fast fall
  if (delta.y <= -20) {
    fastFalling = true;
  }

  if (delta.y <= -100) {
    dropPiece(blockPiece);
    delta.y = 0;
  }
}

function inputPointerUp(event) {
  pointerDown = false;
  if (fastFalling) {
    fastFalling = false;
    return;
  }

  //restarts the game if it's over
  if (gameOver) {
    initGame();
    return;
  }

  if (!gameRunning) {
    return;
  }

  //piece drop
  if (delta.y <= -100) {
    dropPiece(blockPiece);
  }

  //piece rotation
  if (Math.abs(delta.x) < 2 && Math.abs(delta.y) < 2) {
    let rotationDirection = null;
    if (event.x > (window.innerWidth / 2) - blockSize * 2 && event.x < (window.innerWidth / 2) + blockSize * 2) {
      rotationDirection = "right";
    } else if (event.x < (window.innerWidth / 2) - blockSize * 2) {
      rotationDirection = "left";
    }
    if (rotationDirection) {
      rotatePiece(rotationDirection);
    }
  }
  inputPointer = { x: event.x, y: event.y };
}

function setMatrixPieceBlocks(value) {
  this.blockPiece.matrixPlacements[this.blockPiece.currentRotation].forEach(block => {
    blocksMatrix[this.blockPiece.posX + block.col][this.blockPiece.posY + block.row] = value;
  });
}

function checkPieceCollision(piece, offsetX, offsetY) {
  let collision = false;
  let posx = piece.posX + offsetX;
  let posy = piece.posY + offsetY;

  //checks for collision with other blocks and stage boundaries
  piece.matrixPlacements[piece.currentRotation].forEach(block => {
    if (posx + block.col >= this.blocksMatrixSize.x || block.col + posx < 0 ||
      posy + block.row >= this.blocksMatrixSize.y) {
      collision = true;
    } else if (blocksMatrix[posx + block.col][posy + block.row]) {
      if (blocksMatrix[posx + block.col][posy + block.row]) {
        collision = true;
      }
    }
  });
  return collision;
}

function movePiece(piece, posX, posY) {
  currentLane += posX;
  let canMove = true;

  if (checkPieceCollision(piece, posX, posY)) {
    canMove = false;
  }

  if (canMove) { //clear old positions and fill matrix witch current piece blocks
    piece.move(posX, posY);

    //moves preview piece with it
    this.previewBlockPiece.move(posX, piece.posY - this.previewBlockPiece.posY);
    dropPiece(this.previewBlockPiece);

    if (posY > 0) { //clears auto-move time when doing a soft-drop
      this.autoMoveCurrentTime = 0;
    }
  } else if (posY > 0) {
    dropPiece(piece);
  }

  return canMove;
}

function dropPiece(piece) {
  while (!checkPieceCollision(piece, 0, 1)) {
    if (piece.active) {
      movePiece(piece, 0, 1);
    } else {
      piece.move(0, 1);
    }
  }

  if (piece.active) {
    //UI border lines effect
    setStageBorderStyleEffect(10, 1);
    this.stageBorderLine.graphicsData[0].lineColor = piece.color;

    setMatrixPieceBlocks(piece.blockInfo.id);
    checkForLines();
  }
}

function checkForLines() {
  clearLines(false);
}

function rotatePiece(rotationDirection) {
  let currentRotation = blockPiece.currentRotation;
  let nextRotation = blockPiece.getNextRotation(rotationDirection);
  blockPiece.rotate(nextRotation);
  if (checkPieceCollision(this.blockPiece, 0, 0)) {
    blockPiece.rotate(currentRotation);
    nextRotation = currentRotation;
  }
  //updates the preview block
  this.previewBlockPiece.rotate(nextRotation);
  this.previewBlockPiece.move(0, -2);
  dropPiece(this.previewBlockPiece);

  animateLanesRotation(rotationDirection);
}

function holdPiece() {
  if (!this.canHold) {
    return;
  }
  let blockInfo = this.blockPiece.blockInfo;
  createBlockPiece(true);
  if (this.blockPieceHold) {
    this.blockPieceHold.delete();
    this.blockPieceHold = null;
  }
  this.blockPieceHold = new BlockPiece(blockInfo, 12 + blockInfo.UIoffset, 15, this.blockSize);
  this.canHold = false;

}

//creates sprites for each block of the piece inside the matrix
function solidifyBlocksInsideMatrix() {
  this.blockPiece.matrixPlacements[this.blockPiece.currentRotation].forEach(block => {
    let blockSprite = new Graphics();
    blockSprite.lineStyle(3, 0x222200, 1);
    blockSprite.beginFill(this.blockPiece.color);

    blockSprite.drawRect(
      block.col * this.blockPiece.blockSize,
      block.row * this.blockPiece.blockSize,
      this.blockPiece.blockSize, this.blockPiece.blockSize); //size

    blockSprite.endFill();
    blockSprite.x = this.blockPiece.posX * this.blockPiece.blockSize;
    blockSprite.y = this.blockPiece.posY * this.blockPiece.blockSize;
    app.stage.addChild(blockSprite);
    blocksMatrix[this.blockPiece.posX + block.col][this.blockPiece.posY + block.row] = blockSprite;
  });
}

let blocksRemovedForEffects;

function clearLines(clearAll) {
  if (!clearAll) {
    solidifyBlocksInsideMatrix();
  }
  let linesCleared = 0;
  let blocksPerLine = [];
  clearBlocksRemovedForEffects();
  //initialize blocksPerLine array, filling it with max values if 'clearAll' is set
  for (let row = 0; row < blocksMatrixSize.y; row++) {
    blocksPerLine.push(clearAll ? blocksMatrixSize.y : 0);
  }

  for (let collumn = 0; collumn < this.blocksMatrixSize.x; collumn++) {
    if (blocksMatrix[collumn]) {
      for (let line = 0; line < this.blocksMatrixSize.y; line++) {
        if (blocksMatrix[collumn][line]) {
          blocksPerLine[line]++;
        }
      }
    }
  }

  //tests for number of blocks in line
  for (let line = 0; line < this.blocksMatrixSize.y; line++) {
    if (blocksPerLine[line] >= this.blocksMatrixSize.x) {
      for (let collumn = 0; collumn < this.blocksMatrixSize.x; collumn++) {
        this.blocksRemovedForEffects[collumn][line] = blocksMatrix[collumn][line];
        blocksMatrix[collumn][line] = undefined;
      }
      linesCleared++;
      if (!clearAll) {
        pullLinesDown(line);
      } else {
        this.canAnimateRemovedBlocks = true;
        linesCleared = 0;
      }
    }
  }

  if (linesCleared > 0) {
    addLinesScore(linesCleared);
    createBlockPiece(false);
    this.canAnimateRemovedBlocks = true;
    setStageBorderStyleEffect(20, 2);
    linesCleared = 0;
  } else if (!clearAll) {
    createBlockPiece(false);
  }
}

let removedBlocksAlpha = 0.7;
let canAnimateRemovedBlocks = false;

function animateRemovedBlocks(delta) {
  if (this.canAnimateRemovedBlocks) {
    removedBlocksAlpha -= delta * 0.05;

    for (let line = 0; line < this.blocksMatrixSize.y; line++) {
      for (let collumn = 0; collumn < this.blocksMatrixSize.x; collumn++) {
        if (this.blocksRemovedForEffects[collumn][line]) {
          let block = this.blocksRemovedForEffects[collumn][line];
          block.alpha = removedBlocksAlpha;
          block.y += delta * 5;
          if (removedBlocksAlpha <= 0) {
            app.stage.removeChild(this.blocksRemovedForEffects[collumn][line]);
          }
        }
      }
    }

    if (removedBlocksAlpha <= 0) {
      this.blocksRemovedForEffects = undefined;
      removedBlocksAlpha = 0.7;
      this.canAnimateRemovedBlocks = false;
      return;
    }
  }
}

function clearBlocksRemovedForEffects() {
  this.blocksRemovedForEffects = [];
  for (let i = 0; i < this.blocksMatrixSize.x; i++) {
    this.blocksRemovedForEffects[i] = [];
  }
}

//moves down every line above the deleted one
function pullLinesDown(index) {
  for (let line = index; line > 0; line--) {
    for (let collumn = 0; collumn < this.blocksMatrixSize.x; collumn++) {
      blockSprite = blocksMatrix[collumn][line - 1];
      if (blockSprite) {
        blockSprite.y += this.blockPiece.blockSize;
        blocksMatrix[collumn][line] = blocksMatrix[collumn][line - 1];
        blocksMatrix[collumn][line - 1] = undefined;
      }
    }
  }
}

function addLinesScore(lines) {
  this.level.lines += lines;
  this.linesUIText.text = ("Lines: " + this.level.lines);

  this.level.score += this.level.pointsPerLine[lines - 1] * this.level.level;
  this.scoreUIText.text = ("Score: " + this.level.score);

  this.level.level = Math.floor(this.level.lines / 10) + 1;
  this.levelUIText.text = ("Level: " + this.level.level);
}

function setStageBorderStyleEffect(width, alpha) {
  if (width) {
    this.stageBorderLine.graphicsData[0].lineWidth = width;
  }
  if (alpha) {
    this.stageBorderLine.alpha = alpha;
  }
  this.stageBorderLine.dirty++;
  this.stageBorderLine.clearDirty++;
}

function animateLanesRotation(direction) {
  if (direction == "left") {
    this.lanes[0].alpha = 2;
    this.lanes[1].alpha = 1.3;
    this.lanes[2].alpha = 0.8;
  } else {
    this.lanes[9].alpha = 2;
    this.lanes[8].alpha = 1.3;
    this.lanes[7].alpha = 0.8;
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}