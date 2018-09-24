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
let left_arrow, right_arrow;
let blockPiece;
let blockContainer; //container for all rectangles in the current block piece
let blocksMatrixSize = {x:10, y:20};

let blocksMatrix = [];
for (let i = 0; i < blocksMatrixSize.x; i++) {
  blocksMatrix[i] = [];
  for (let j = 0; j < blocksMatrixSize.y; j++) {
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


  //Add the buttons to the stage
  app.stage.addChild(this.left_arrow);
  app.stage.addChild(this.right_arrow);

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
  if (blockPiece) {
    solidifyBlocksInsideMatrix();
    app.stage.removeChild(blockPiece.rectangles);
    clearLines();
  }
  blockPiece = new BlockPiece(blockTypes[randomInt(0,1)], 4, 0);
  app.stage.addChild(blockPiece.rectangles);

  if (blockPiece && checkPieceCollision(0, 0)) {
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
  blockPiece.matrixPlacements[blockPiece.currentRotation].forEach(block => {
    blocksMatrix[blockPiece.posX + block.col][blockPiece.posY + block.row] = value;
  });
}

function checkPieceCollision(offsetX, offsetY) {
  let collision = false;
  let posx = blockPiece.posX + offsetX;
  let posy = blockPiece.posY + offsetY;

  //checks for collision with other blocks and stage boundaries
  blockPiece.matrixPlacements[blockPiece.currentRotation].forEach(block => {
      if (posx + block.col >= blocksMatrixSize.x || block.col + posx < 0 ||
          posy + block.row > blocksMatrixSize.y) {
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
    blockPiece.move(posX, posY);
  } else if (posY > 0) {
    dropPiece();
  }

  return canMove;
}

function dropPiece() {
  while(!checkPieceCollision(0, 1)) {
    movePiece(0, 1);
  }
  setMatrixPieceBlocks(blockPiece.blockInfo.id);
  createBlockPiece();
}

//creates sprites for each block of the piece inside the matrix
function solidifyBlocksInsideMatrix() {
  blockPiece.matrixPlacements[blockPiece.currentRotation].forEach(block => {
    let blockSprite = new Graphics();
    blockSprite.lineStyle(2, 0xBBBBBB, 1);
    blockSprite.beginFill(blockPiece.color);

    blockSprite.drawRect(
      block.col * blockPiece.blockSize, 
      block.row * blockPiece.blockSize,
      blockPiece.blockSize, blockPiece.blockSize); //size

    blockSprite.endFill();
    blockSprite.x = blockPiece.posX * blockPiece.blockSize;
    blockSprite.y = blockPiece.posY * blockPiece.blockSize;
    app.stage.addChild(blockSprite);
    blocksMatrix[blockPiece.posX + block.col][blockPiece.posY + block.row] = blockSprite;
  });
}

function clearLines() {
  let blocksInLine = 0;
  for(let i = 0; i < blocksMatrixSize.y; i ++) {
    for (let j = 0; j < blocksMatrixSize.x; j ++) {
      if (blocksMatrix[j][i]) {
        blocksInLine ++;
      }      
    }
    if (blocksInLine >= blocksMatrixSize.x - 1) {
      console.log(blocksInLine);
      for (let collumn = 0; collumn < blocksMatrixSize.x; collumn ++) {
        app.stage.removeChild(blocksMatrix[collumn][i]);
        blocksMatrix[collumn][i] = undefined;
      }
    }
    blocksInLine = 0;
  }
}