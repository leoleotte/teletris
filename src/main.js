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
var gameRunning = true;
var inputPointer = { x: 0, y: 0 }
var pieceMoved = false;
var pointerDown = true;
var fastFalling = false;
var canFastFall = true;
var fastFallTick = 0;
//Pieces
var blockTypes = [
  { type: "line", id: 10 },
  { type: "square", id: 20 },
  { type: "left_L", id: 60 },
  { type: "right_L", id: 70 },
  { type: "T", id: 30 },
  { type: "S", id: 40 },
  { type: "Z", id: 50 }
];
var blockPiece, nextPiece, blockPieceHold;
var blockSize = 40;
var blocksMatrixSize = { x: 10, y: 20 };
let blocksMatrix;
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
var stageBorderDefaultColor = 0x444444;
var textStyle = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize: 42,
  fill: "green"
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

//Add debug build time into the HTML document
var debug = true;
var iframe = document.createElement('iframe');
iframe.src = "../buildtime.html";
iframe.onerror = function () { debug = false };
if (debug) {
  document.body.appendChild(iframe);
  this.debugText = document.getElementById('debugText');
  this.debugText.textContent = "DEBUG";
}

//Render the stage
app.renderer.render(app.stage);

//Start the game loop by adding the `gameLoop` function to
//Pixi's `ticker` and providing it with a `delta` argument.
app.ticker.add(delta => main(delta));
initInput();
drawUI();
initGame();

function initGame() {
  createNextPiece();
  if (blocksMatrix) { //if game was restared
    this.clearLines(true);
    app.stage.removeChild(gameOverTextUI);
    this.blockPiece.delete();
    this.blockPiece = undefined;

    this.level.score = 0;
    this.level.level = 1;
    this.level.lines = 0;
    this.scoreUIText.text = ("Score: " + this.level.score);
    this.levelUIText.text = ("Level: " + this.level.level);
    this.linesUIText.text = ("Lines: " + this.level.lines);
  }

  blocksMatrix = [];
  for (let i = 0; i < blocksMatrixSize.x; i++) {
    blocksMatrix[i] = [];
  }
  this.createBlockPiece(false);
  this.gameRunning = true;
}

function endGame() {
  this.gameRunning = false;
  this.gameOverTextUI.position.set(20, 10);
  app.stage.addChild(this.gameOverTextUI);
  this.nextPiece.delete();
  this.blockPieceHold.delete();
  this.blockPieceHold = null;

  this.stageBorderLine.graphicsData[0].lineColor = "0xFF0000";
  setStageBorderStyleEffect(10, 1);
}

function initInput () {
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

function drawUI() {
  //dynamic
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
  holdPieceBorderLine.moveTo(11 * this.blockSize, 300 + (blockSize * 5));
  holdPieceBorderLine.lineTo(16 * this.blockSize, 300 + (blockSize * 5));
  holdPieceBorderLine.lineTo(16 * this.blockSize, 441 + (blockSize * 9));
  holdPieceBorderLine.lineTo(11 * this.blockSize, 441 + (blockSize * 9));
  holdPieceBorderLine.lineTo(11 * this.blockSize, 300 + (blockSize * 5));
  app.stage.addChild(holdPieceBorderLine);
}

//Main Loop
function main(delta) {
  if (!this.gameRunning || !blockPiece) {
    this.gameOverTextUI.position.set(20 + randomInt(1, 5), blockSize * 8 + randomInt(1, 5));
    return;
  }

  if (!this.canFastFall) {
    this.fastFallTick += delta;
    if (this.fastFallTick >= fastFallLimitTime) {
      this.canFastFall = true;
      this.fastFallTick = 0;
    }
  }

  if (this.fastFalling && this.canFastFall) {
    movePiece(0, 1);
    this.autoMoveCurrentTime = 0;
    this.canFastFall = false;
  }

  //piece auto movement
  this.autoMoveCurrentTime += delta;
  if (this.autoMoveCurrentTime >= this.level.autoMoveTimeLimit) {
    movePiece(0, 1);
    this.autoMoveCurrentTime = 0;
  }

  updateUI(delta);  
}

function updateUI(delta) {
  //stage borders "drop" effect
  if (this.stageBorderLine.graphicsData[0].lineWidth >= this.stageBorderDefaultWidth) {
    this.setStageBorderStyleEffect(this.stageBorderLine.graphicsData[0].lineWidth - delta, this.stageBorderLine.alpha);
  }
  if (this.stageBorderLine.alpha > 0) {
    this.stageBorderLine.alpha -= delta * 0.1;
  }

  if (this.blockPiece && this.lanes) {
    for (i = 0; i < 10; i++) {
      lane = this.lanes[i];
      lane.graphicsData[0].fillColor = 0xFFFFFF;
      if(lane.alpha >= 0.2) {
        lane.alpha -= 0.15 * delta;
      }
      lane.dirty++;
      lane.clearDirty++;
    };

    //Lane effects on blockPiece lanes
    this.blockPiece.getCurrentLanes().forEach(lane => {
      var lane_ = this.lanes[this.blockPiece.posX + lane];
      lane_.alpha = 0.3;
      lane_.graphicsData[0].fillColor = this.blockPiece.color;
      lane_.dirty++;
      lane_.clearDirty++;
    });
  }
}

function createBlockPiece(hold) {
  if (this.blockPiece && !hold) {
    solidifyBlocksInsideMatrix();
    this.blockPiece.delete();
    clearLines(false);
  }

  let nextBlockType = (hold && this.blockPieceHold) ? this.blockPieceHold.blockInfo.type : this.blockTypes.find(type => type.id == this.nextPiece.blockInfo.id);
  this.blockPiece = new BlockPiece(nextBlockType, 4, 0, this.blockSize);

  if (checkPieceCollision(0, 0)) {
    endGame();
  }

  if (!hold) {
    createNextPiece();
  }
  this.autoMoveCurrentTime = 0;
  this.currentLane = 4;
}

function createNextPiece() {
  if (this.nextPiece) {
    this.nextPiece.delete();
  }
  this.nextPiece = new BlockPiece(this.blockTypes[randomInt(0, 6)], 12, 7, this.blockSize);
}

//////Input
function inputKeyDown(event) {
  if (!gameRunning) { //restarts the game if it's over
    initGame();
    return;
  }

  switch (event.key) {
    case "ArrowLeft":
      movePiece(-1, 0);
      break;
    case "ArrowRight":
      movePiece(1, 0);
      break;
    case "ArrowUp":
      dropPiece();
      break;
    case "ArrowDown":
      fastFalling = true;
      break;
  }
  //rotation input
  if (event.key == 'e' || event.key == 'r') {
    rotatePiece(event.key == 'e' ? "left" : "right");
  }

  if(event.key == "d") {
    holdPiece();
  }
}

function inputKeyUp(event) {
  if (event.key == "ArrowDown") {
    fastFalling = false;    
  }
}

function inputPointerDown(event) {
  this.inputPointer = { x: event.x, y: event.y };
  this.pointerDown = true;
}

function inputPointerMove(event) {  
  if (!this.inputPointer || !this.pointerDown) {
    return;
  }

  let delta = { x: Math.round(this.inputPointer.x - event.x), y: Math.round(this.inputPointer.y - event.y) };
  if (!gameRunning || delta.y > 10) {
    this.deltaY = this.inputPointer.y - event.y;
    this.inputPointer = {x: event.x, y: event.y};
    fastFalling = false;
    return;
  }

   // piece movement (drag)
  if (Math.abs(delta.x) >= 30) {
      movePiece(Math.sign(-delta.x),0);
      this.inputPointer = {x: event.x, y: event.y};
      this.pieceMoved = true;
  }

  //fast fall
  if (delta.y <= -20) {
    this.inputPointer = {x: event.x, y: event.y};
    fastFalling = true;
  }
}

function inputPointerUp(event) {
  this.pointerDown = false;
  if (fastFalling) {
    fastFalling = false;
    return;
  }
  //restarts the game if it's over
  if (!gameRunning) {
    initGame();
    return;
  }

  //prevents the piece from rotating after moving
  if (this.pieceMoved) {
    this.pieceMoved = false;
    return;
  }

  let delta = { x: Math.round(this.inputPointer.x - event.x), y: Math.round(this.inputPointer.y - event.y) };

  //piece drop
  if (this.deltaY >= 20) {
    this.deltaY = 0;
    dropPiece();
  }

  //piece rotation
  if (Math.abs(delta.x) < 20 && Math.abs(delta.y) < 20) {
    let rotationDirection = event.x > (window.innerWidth / 2) - blockSize * 2 ? "right" : "left";
    debugText.textContent = rotationDirection;
    rotatePiece(rotationDirection);
  }
}

function setMatrixPieceBlocks(value) {
  this.blockPiece.matrixPlacements[this.blockPiece.currentRotation].forEach(block => {
    blocksMatrix[this.blockPiece.posX + block.col][this.blockPiece.posY + block.row] = value;
  });
}

function checkPieceCollision(offsetX, offsetY) {
  let collision = false;
  let posx = this.blockPiece.posX + offsetX;
  let posy = this.blockPiece.posY + offsetY;

  //checks for collision with other blocks and stage boundaries
  this.blockPiece.matrixPlacements[this.blockPiece.currentRotation].forEach(block => {
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

function movePiece(posX, posY) {
  currentLane += posX;
  let canMove = true;

  if (checkPieceCollision(posX, posY)) {
    canMove = false;
  }

  if (canMove) { //clear old positions and fill matrix witch current piece blocks
    this.blockPiece.move(posX, posY);
    if (posY > 0) { //clears auto-move time when doing a soft-drop
      this.autoMoveCurrentTime = 0;
    }
  } else if (posY > 0) {
    dropPiece();
  }

  return canMove;
}

function dropPiece() {
  while (!checkPieceCollision(0, 1)) {
    movePiece(0, 1);
  }

  //UI border lines effect
  setStageBorderStyleEffect(10, 1)
  this.stageBorderLine.graphicsData[0].lineColor = this.blockPiece.color;

  setMatrixPieceBlocks(this.blockPiece.blockInfo.id);
  createBlockPiece(false);
}

function rotatePiece(rotationDirection) {
  let currentRotation = blockPiece.currentRotation;
  blockPiece.rotate(blockPiece.getNextRotation(rotationDirection));
  if (checkPieceCollision(0, 0)) {
    blockPiece.rotate(currentRotation);
  }  
}

function holdPiece() {
  let tempBlock = this.blockPiece;
  createBlockPiece(true);
  this.blockPieceHold = tempBlock;
  this.blockPieceHold.posX = 12;
  this.blockPieceHold.posY = 15;
  this.blockPieceHold.drawBlocks();
  
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

function clearLines(clearAll) {
  let linesCleared = 0;
  let blocksPerLine = [];
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

  //tests for number of blocks in line, or if it should clear all lines
  for (let line = 0; line < this.blocksMatrixSize.y; line++) {
    if (blocksPerLine[line] >= this.blocksMatrixSize.x) {
      for (let collumn = 0; collumn < this.blocksMatrixSize.x; collumn++) {
        app.stage.removeChild(blocksMatrix[collumn][line]);
        blocksMatrix[collumn][line] = undefined;
      }
      linesCleared++;
      //only moves lines down and show effects if it's not cleaning all blocks
      if (!clearAll) {
        pullLinesDown(line);
        setStageBorderStyleEffect(linesCleared * 10, 1);
      }
    }
  }

  if (linesCleared > 0) {
    addLinesScore(linesCleared);
    linesCleared = 0;
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

  this.level.level = Math.floor(this.level.lines / 10) + 1;
  this.levelUIText.text = ("Level: " + this.level.level);

  this.level.score += this.level.pointsPerLine[lines - 1] * this.level.level;
  this.scoreUIText.text = ("Score: " + this.level.score);
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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get a ratio for resize in a bounds
function getRatio(obj, w, h) {
  let r = Math.min(w / obj.width, h / obj.height);
  return r;
};