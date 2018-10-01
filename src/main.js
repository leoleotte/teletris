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
var inputPointer = {x: 0, y: 0, state: 'stopped' || 'moved'}
//Pieces
var blockTypes = [
  {type:"line", id:10}, 
  {type:"square", id:20}, 
  {type:"left_L", id:60}, 
  {type:"right_L", id:70},
  {type:"T", id:30}, 
  {type:"S", id:40}, 
  {type:"Z", id:50}
];
var blockPiece;
var blockSize = 20;
var blocksMatrixSize = {x:10, y:20};
let blocksMatrix;
//Difficulty
var autoMoveCurrentTime = 0;
var level = {score: 0, lines: 0, level: 1, autoMoveTimeLimit: 60, 
  pointsPerLine: [40, 100, 300, 1200]};
//UI
var left_arrow, right_arrow;
var stageBorderLine;
var stageBorderDefaultWidth = 4;
var stageBorderDefaultColor = 0x444444;
var gameOverTextUI = new Text("GAME OVER");
var scoreUIText = new Text("Score: 0");
var levelUIText = new Text("Level: 1");
var linesUIText = new Text("Lines: 0");


//Create a Pixi Application
let app = new Application({ 
    width: 600,
    height: 600,                       
    antialias: true, 
    transparent: true, 
    resolution: 1
  }
);

//Keyboard Input Handling
document.addEventListener('keydown', inputKeyDown);
document.addEventListener('pointerdown', inputPointerDown);
document.addEventListener('pointerup', inputPointerUp);

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

//Drawing
loader
  .add("rsc/arrow_left.png")
  .add("rsc/arrow_right.png")
  .load(setup);

//This `setup` function will run when the image has loaded
function setup() {

  let leftArrowTexCache = TextureCache["rsc/arrow_left.png"];
  let rightArrowTexCache = TextureCache["rsc/arrow_right.png"];

  this.left_arrow = new Sprite(leftArrowTexCache);
  this.right_arrow = new Sprite(rightArrowTexCache);

  this.left_arrow.interactive = true;
  this.left_arrow.buttonMode = true;

  this.right_arrow.interactive = true;
  this.right_arrow.buttonMode = true;

  //Sprites positions
  this.left_arrow.x = 5;
  this.left_arrow.y = 10;
  this.left_arrow.alpha = 1;

  this.right_arrow.x = 105;
  this.right_arrow.y = 10;
  this.right_arrow.alpha = 1;
  
  //Render the stage   
  app.renderer.render(app.stage);

  //Start the game loop by adding the `gameLoop` function to
  //Pixi's `ticker` and providing it with a `delta` argument.
  app.ticker.add(delta => main(delta));

  drawUI();
  initGame();
}

function initGame() {
  if (blocksMatrix) { //if game was restared
    this.clearLines(true);
    app.stage.removeChild(this.blockPiece.rectangles);
    app.stage.removeChild(gameOverTextUI);
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
  this.createBlockPiece();
  this.gameRunning = true;
}

function endGame() {
  this.gameRunning = false;
  this.gameOverTextUI.position.set(20, 450);
  app.stage.addChild(this.gameOverTextUI);
}

function drawUI() {
  app.stage.addChild(this.left_arrow);
  app.stage.addChild(this.right_arrow);
  this.scoreUIText.position.set(220, 00);
  app.stage.addChild(this.scoreUIText);
  this.levelUIText.position.set(220, 40);
  app.stage.addChild(this.levelUIText);
  this.linesUIText.position.set(220, 80);
  app.stage.addChild(this.linesUIText);

  //stage borders
  let stageBorderPadding = 2;
  stageBorder = new Graphics();
  stageBorder.lineStyle(stageBorderDefaultWidth, stageBorderDefaultColor, 1);
  stageBorder.moveTo(0, 1);
  stageBorder.lineTo((this.blocksMatrixSize.x * this.blockSize) + stageBorderPadding, 1);
  stageBorder.lineTo((this.blocksMatrixSize.x * this.blockSize) + stageBorderPadding, (this.blocksMatrixSize.y * this.blockSize)+ stageBorderPadding);
  stageBorder.lineTo(0, (this.blocksMatrixSize.y * this.blockSize) + stageBorderPadding);
  stageBorder.lineTo(0, 1);
  stageBorder.x = 0;
  stageBorder.y = 0;
  app.stage.addChild(stageBorder);

  //stage line to add effects to
  this.stageBorderLine = new Graphics();
  this.stageBorderLine.lineStyle(stageBorderDefaultWidth, stageBorderDefaultColor, 1);
  this.stageBorderLine.moveTo(0, 1);
  this.stageBorderLine.lineTo((this.blocksMatrixSize.x * this.blockSize) + stageBorderPadding, 1);
  this.stageBorderLine.lineTo((this.blocksMatrixSize.x * this.blockSize) + stageBorderPadding, (this.blocksMatrixSize.y * this.blockSize) + stageBorderPadding);
  this.stageBorderLine.lineTo(0, (this.blocksMatrixSize.y * this.blockSize) + stageBorderPadding);
  this.stageBorderLine.lineTo(0, 1);
  this.stageBorderLine.x = 0;
  this.stageBorderLine.y = 0;
  this.stageBorderLine.alpha = 0;
  app.stage.addChild(this.stageBorderLine);
}

//Main Loop
function main(delta){
  if (!this.gameRunning || !blockPiece) {
    return;
  }

  //block auto movement
  this.autoMoveCurrentTime += delta;
  if (this.autoMoveCurrentTime >= this.level.autoMoveTimeLimit) {
    movePiece(0, 1);
    this.autoMoveCurrentTime = 0;
  }

  updateUI(delta);
}

function updateUI(delta) {
  //UI Tutorial Fading
  if (this.left_arrow.alpha > 0) {
    this.left_arrow.alpha -= delta * 0.005;
  }
  if (this.right_arrow.alpha > 0) {
    this.right_arrow.alpha -= delta * 0.005;
  }
  //stage borders "drop" effect
  if (this.stageBorderLine.graphicsData[0].lineWidth >= this.stageBorderDefaultWidth) {
    this.setStageBorderStyleEffect(this.stageBorderLine.graphicsData[0].lineWidth - delta, this.stageBorderLine.alpha);
  }
  if (this.stageBorderLine.alpha > 0) {
    this.stageBorderLine.alpha -= delta * 0.1;
  }
}

function createBlockPiece() {
  if (this.blockPiece) {
    solidifyBlocksInsideMatrix();
    app.stage.removeChild(this.blockPiece.rectangles);
    clearLines(false);
  }
  this.blockPiece = new BlockPiece(this.blockTypes[randomInt(0,6)], 4, 0, this.blockSize);

  if (checkPieceCollision(0, 0)) {
    endGame();
  }
  this.autoMoveCurrentTime = 0;
}

//////Input
function inputKeyDown(event) {
  if (!gameRunning) {
    initGame();
  } else {
    switch(event.key) {
      case "ArrowLeft":
        movePiece(-1, 0);
      break;
      case "ArrowRight":
        movePiece(1, 0);
      break;
      case "ArrowUp":
        dropPiece();
      break;
    }
    //rotation input
    if (event.key == 'e' || event.key == 'r') {
      rotatePiece(event.key == 'e' ? "left" : "right");
    }
  }
}

function inputPointerDown(event) {
  this.inputPointer = {x: event.x, y: event.y};
}

function inputPointerUp(event) {
  let delta = {x: this.inputPointer.x - event.x, y: this.inputPointer.y - event.y};
  
  if (event.x >= 400 || event.y >= 600) { //invalid inputs
    return;
  }

  //piece drop and soft drop
  if (delta.y >= 50 || delta.y <= -40) {
    if (Math.sign(delta.y) > 0) {
      dropPiece();
    } else {
      movePiece(0,1);
    }
    return;
  }

  if (delta.x >= 20 || delta.x <= -20) {
    rotatePiece(event.key == Math.sign(delta.x) > 0 ? "left" : "right");
  } else {
    if (this.inputPointer.x <= 100) {
      movePiece(-1,0);
    } else {
      movePiece(1,0);
    }
  }

  this.inputPointer = {x: event.x, y: event.y};
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
      } else if (blocksMatrix[posx + block.col][posy + block.row]){
        if (blocksMatrix[posx + block.col][posy + block.row]) {
          collision = true;
        }
      }
  });
  return collision;
}

function movePiece(posX, posY) {
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
  while(!checkPieceCollision(0, 1)) {
    movePiece(0, 1);
  }

  //UI border lines effect
  setStageBorderStyleEffect(10, 1)
  this.stageBorderLine.graphicsData[0].lineColor = this.blockPiece.color;

  setMatrixPieceBlocks(this.blockPiece.blockInfo.id);
  createBlockPiece();
}

function rotatePiece(rotationDirection) {
  let currentRotation = blockPiece.currentRotation;
  blockPiece.rotate(blockPiece.getNextRotation(rotationDirection));
  if (checkPieceCollision(0, 0)) {
    blockPiece.rotate(currentRotation);
  }
}

//creates sprites for each block of the piece inside the matrix
function solidifyBlocksInsideMatrix() {
  this.blockPiece.matrixPlacements[this.blockPiece.currentRotation].forEach(block => {
    let blockSprite = new Graphics();
    blockSprite.lineStyle(2, 0xBBBBBB, 1);
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
  for (let row = 0; row < blocksMatrixSize.y; row ++) {
    blocksPerLine.push(clearAll ? blocksMatrixSize.y : 0);
  }

  for(let collumn = 0; collumn < this.blocksMatrixSize.x; collumn ++) {
    if (blocksMatrix[collumn]) {
      for (let line = 0; line < this.blocksMatrixSize.y; line ++) {
        if (blocksMatrix[collumn][line]) {
          blocksPerLine[line] ++;
        }
      }
    }
  }

  //tests for number of blocks in line, or if it should clear all lines
  for (let line = 0; line < this.blocksMatrixSize.y; line ++) {
    if (blocksPerLine[line] >= this.blocksMatrixSize.x) {
      for (let collumn = 0; collumn < this.blocksMatrixSize.x; collumn ++) {
        app.stage.removeChild(blocksMatrix[collumn][line]);
        blocksMatrix[collumn][line] = undefined;
      }
      linesCleared ++;
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
  for (let line = index; line > 0; line --) {
    for (let collumn = 0; collumn < this.blocksMatrixSize.x; collumn ++) {
      blockSprite = blocksMatrix[collumn][line - 1];
      if (blockSprite) {
        blockSprite.y += this.blockPiece.blockSize;
        blocksMatrix[collumn][line] = blocksMatrix[collumn][line-1];
        blocksMatrix[collumn][line-1] = undefined;
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