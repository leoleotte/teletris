//main.js
let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
}

//Aliases
let Application = PIXI.Application,
    loader = PIXI.Loader.shared,
    resources = PIXI.Loader.shared.resources,
    TextureCache = PIXI.utils.TextureCache,
    Graphics = PIXI.Graphics,
    Rectangle = PIXI.Rectangle,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text;

let blockTypes = [
  {type:"line", id:10}, 
  {type:"square", id:20}, 
  {type:"T", id:30}, 
  {type:"S", id:40}, 
  {type:"Z", id:50}, 
  {type:"left_L", id:60}, 
  {type:"right_L", id:70}
];

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


//Variables
var left_arrow, right_arrow;
var blockPiece;
var blocksMatrixSize = {x:10, y:20};
linesScore = 0;

let blocksMatrix = [];
for (let i = 0; i < this.blocksMatrixSize.x; i++) {
  blocksMatrix[i] = [];
  for (let j = 0; j < this.blocksMatrixSize.y; j++) {
    blocksMatrix[i][j] = 0;
  }
}


//Drawing
loader
  .add("rsc/arrows.png")
  .load(setup);


//This `setup` function will run when the image has loaded
function setup() {

  let leftArrowTexCache = TextureCache["rsc/arrows.png"];
  let rightArrowTexCache = TextureCache["rsc/arrows.png"];

  leftArrowTexCache.frame = new Rectangle(0, 0, 100, 100);
  this.left_arrow = new Sprite(leftArrowTexCache);
  rightArrowTexCache.frame = new Rectangle(100, 0, 100, 100);
  this.right_arrow = new Sprite(rightArrowTexCache);

  this.left_arrow.interactive = true;
  this.left_arrow.buttonMode = true;
  this.left_arrow.on('pointerdown', onButtonPressLeft);

  this.right_arrow.interactive = true;
  this.right_arrow.buttonMode = true;
  this.right_arrow.on('pointerdown', onButtonPressRight);

  //Sprites positions
  this.left_arrow.x = 0;
  this.left_arrow.y = 500;
  this.right_arrow.x = 200;
  this.right_arrow.y = 500;


  //Add the UI elements
  app.stage.addChild(this.left_arrow);
  app.stage.addChild(this.right_arrow);

  scoreUI = new Text("Lines: " + linesScore);
  this.scoreUI.position.set(250, 0);
  app.stage.addChild(this.scoreUI);


  createBlockPiece();
  
  //Render the stage   
  app.renderer.render(app.stage);

  //Start the game loop by adding the `gameLoop` function to
  //Pixi's `ticker` and providing it with a `delta` argument.
  app.ticker.add(delta => main(delta));
}

let autoMoveTime = 0;
let autoMoveTimeLimit = 60;
//Main Loop
function main(delta){
  autoMoveTime += delta;
  if (autoMoveTime >= autoMoveTimeLimit) {
    movePiece(0, 1);
    autoMoveTime = 0;
  }
}

function createBlockPiece() {
  if (this.blockPiece) {
    solidifyBlocksInsideMatrix();
    app.stage.removeChild(this.blockPiece.rectangles);
    clearLines();
  }
  this.blockPiece = new BlockPiece(blockTypes[randomInt(0,1)], 4, 0);
  app.stage.addChild(this.blockPiece.rectangles);

  if (this.blockPiece && checkPieceCollision(0, 0)) {
    console.log("GAME OVER");
    //let message = new Text("GAME OVER");
    //app.stage.addChild(message);
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
  while(!checkPieceCollision(0, 1)) {
    movePiece(0, 1);
  }
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
      addScore(1);
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

function addScore(score) {
  this.linesScore += score;
  this.scoreUI.text = ("Lines: " + this.linesScore);
}