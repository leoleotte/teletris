//PIXI Aliases
var Application = PIXI.Application,
    loader = PIXI.Loader.shared,
    resources = PIXI.Loader.shared.resources,
    TextureCache = PIXI.utils.TextureCache,
    Graphics = PIXI.Graphics,
    Rectangle = PIXI.Rectangle,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text;

var gameRunning = true;
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
let blocksMatrix = [];
for (let i = 0; i < this.blocksMatrixSize.x; i++) {
  blocksMatrix[i] = [];
  for (let j = 0; j < this.blocksMatrixSize.y; j++) {
    blocksMatrix[i][j] = 0;
  }
}

//UI
var left_arrow, right_arrow;
var stageBorderLine;
var stageBorderDefaultWidth = 4;
var stageBorderDefaultColor = 0x444444;
var linesScore = 0;
//Difficulty
let autoMoveTime = 0;
let autoMoveTimeLimit = 60;


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
document.addEventListener('keydown', keyDownHandler);

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
  this.left_arrow.on('pointerdown', onButtonPressLeft);

  this.right_arrow.interactive = true;
  this.right_arrow.buttonMode = true;
  this.right_arrow.on('pointerdown', onButtonPressRight);

  //Sprites positions
  this.left_arrow.x = 5;
  this.left_arrow.y = 10;
  this.right_arrow.x = 105;
  this.right_arrow.y = 10;

  drawUI();
  createBlockPiece();
  
  //Render the stage   
  app.renderer.render(app.stage);

  //Start the game loop by adding the `gameLoop` function to
  //Pixi's `ticker` and providing it with a `delta` argument.
  app.ticker.add(delta => main(delta));
}

function drawUI() {
  app.stage.addChild(this.left_arrow);
  app.stage.addChild(this.right_arrow);
  scoreUI = new Text("Lines: " + this.linesScore);
  this.scoreUI.position.set(250, 0);
  app.stage.addChild(this.scoreUI);

  //stage borders
  let stageBorderPadding = 2;
  stageBorder = new Graphics();
  stageBorder.lineStyle(stageBorderDefaultWidth, stageBorderDefaultColor, 1);
  stageBorder.moveTo(0, 1);
  stageBorder.lineTo((this.blocksMatrixSize.x * this.blockSize) + stageBorderPadding, 1);
  stageBorder.lineTo((this.blocksMatrixSize.x * this.blockSize) + stageBorderPadding, (this.blocksMatrixSize.y * this.blockSize) + this.blockSize + stageBorderPadding);
  stageBorder.lineTo(0, (this.blocksMatrixSize.y * this.blockSize) + this.blockSize + stageBorderPadding);
  stageBorder.lineTo(0, 1);
  stageBorder.x = 0;
  stageBorder.y = 0;
  app.stage.addChild(stageBorder);

  //stage line to add effects to
  this.stageBorderLine = new Graphics();
  this.stageBorderLine.lineStyle(stageBorderDefaultWidth, stageBorderDefaultColor, 1);
  this.stageBorderLine.moveTo(0, 1);
  this.stageBorderLine.lineTo((this.blocksMatrixSize.x * this.blockSize) + stageBorderPadding, 1);
  this.stageBorderLine.lineTo((this.blocksMatrixSize.x * this.blockSize) + stageBorderPadding, (this.blocksMatrixSize.y * this.blockSize) + this.blockSize + stageBorderPadding);
  this.stageBorderLine.lineTo(0, (this.blocksMatrixSize.y * this.blockSize) + this.blockSize + stageBorderPadding);
  this.stageBorderLine.lineTo(0, 1);
  this.stageBorderLine.x = 0;
  this.stageBorderLine.y = 0;
  this.stageBorderLine.alpha = 0;
  app.stage.addChild(this.stageBorderLine);
}

//Main Loop
function main(delta){
  if (!this.gameRunning) {
    return;
  }

  autoMoveTime += delta;
  if (autoMoveTime >= autoMoveTimeLimit) {
    movePiece(0, 1);
    autoMoveTime = 0;
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
    clearLines();
  }
  this.blockPiece = new BlockPiece(this.blockTypes[randomInt(0,2)], 4, 0, this.blockSize);
  app.stage.addChild(this.blockPiece.rectangles);

  if (checkPieceCollision(0, 0)) {
    console.log("GAME OVER");
    let message = new Text("GAME OVER");
    app.stage.addChild(message);
    message.position.set(50, 450);
    this.gameRunning = false;
    return false;
  }

}

//////Input
function keyDownHandler(event) {
  if(event.keyCode == 39) {
    onButtonPressRight();
  }
  else if(event.keyCode == 37) {
    onButtonPressLeft();
  } 
  else if(event.keyCode == 40) {
    onButtonPressDown();
  }
}

function onButtonPressLeft() {
  movePiece(-1, 0);
}

function onButtonPressRight() {
  movePiece(1, 0);
}

function onButtonPressDown() {
  dropPiece();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
          posy + block.row > this.blocksMatrixSize.y) {
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
  if (!this.gameRunning) {
    return;
  }

  let canMove = true;

  if (checkPieceCollision(posX, posY)) {
    canMove = false;
  }

  if (canMove) { //clear old positions and fill matrix witch current piece blocks
    this.blockPiece.move(posX, posY);
  } else if (posY > 0) {
    dropPiece();
  }

  return canMove;
}

function dropPiece() {
  if (!this.gameRunning) {
    return;
  }

  while(!checkPieceCollision(0, 1)) {
    movePiece(0, 1);
  }

  //UI border lines effect
  setStageBorderStyleEffect(10, 1)
  this.stageBorderLine.graphicsData[0].lineColor = this.blockPiece.color;

  setMatrixPieceBlocks(this.blockPiece.blockInfo.id);
  createBlockPiece();
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

function clearLines() {
  let blocksInLine = 0;
  for(let line = 0; line <= this.blocksMatrixSize.y; line ++) {
    for (let j = 0; j < this.blocksMatrixSize.x; j ++) {
      if (blocksMatrix[j][line]) {
        blocksInLine ++;
      }      
    }
    if (blocksInLine >= this.blocksMatrixSize.x) {
      for (let collumn = 0; collumn < this.blocksMatrixSize.x; collumn ++) {
        app.stage.removeChild(blocksMatrix[collumn][line]);
        blocksMatrix[collumn][line] = undefined;
      }
      pullLinesDown(line);
      addLinesScore(1);

      setStageBorderStyleEffect(this.stageBorderLine.graphicsData[0].lineWidth + 10, 1);
    }
    blocksInLine = 0;
  }
}

//moves down every line above the deleted one
function pullLinesDown(index) {
  for (let line = index; line > 0; line --) {
    for (let collumn = 0; collumn < this.blocksMatrixSize.x; collumn ++) {
      blockSprite = blocksMatrix[collumn][line-1];
      if (blockSprite) {
        index = line -1;
        blockSprite.y += this.blockPiece.blockSize;
        blocksMatrix[collumn][line] = blocksMatrix[collumn][line-1];
        blocksMatrix[collumn][line-1] = undefined;
      }
    }        
  }
}

function addLinesScore(score) {
  this.linesScore += score;
  this.scoreUI.text = ("Lines: " + this.linesScore);
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