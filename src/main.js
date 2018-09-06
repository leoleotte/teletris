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
    Rectangle = PIXI.Rectangle,
    Sprite = PIXI.Sprite;

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
document.addEventListener('keypress', keyHandler);

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);


//Variables
let blockFallingSpeed = 1;
let blockStartPosition = 100;
let block;
let left_arrow, right_arrow;


//Drawing
loader
  .add("rsc/blocks.png")
  .add("rsc/arrows.png")
  .load(setup);


//This `setup` function will run when the image has loaded
function setup() {

  let blocksTexture = TextureCache["rsc/blocks.png"];
  let leftArrowTexCache = TextureCache["rsc/arrows.png"];
  let rightArrowTexCache = TextureCache["rsc/arrows.png"];

  blocksTexture.frame = new Rectangle(0, 0, 145, 90);
  block = new Sprite(blocksTexture);

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
  block.x = blockStartPosition;
  this.left_arrow.x = 0;
  this.left_arrow.y = 500;
  this.right_arrow.x = 200;
  this.right_arrow.y = 500;


  //Add the block to the stage
  app.stage.addChild(block);
  app.stage.addChild(this.left_arrow);
  app.stage.addChild(this.right_arrow);

  //let message = new Text("Teletris");
  //app.stage.addChild(message);
  
  //Render the stage   
  app.renderer.render(app.stage);

  //Start the game loop by adding the `gameLoop` function to
  //Pixi's `ticker` and providing it with a `delta` argument.
  app.ticker.add(delta => main(delta));
}

//Main Loop
function main(delta){
  if(block.y <= 400) {
    block.y += blockFallingSpeed;
  }
}

function keyDownHandler(event) {
  if(event.keyCode == 39) {
    block.x +=20;
  }
  else if(event.keyCode == 37) {
    block.x -=20;
  }
}

function keyHandler(event) {
  if(event.keyCode == 40) {
    block.y +=20;
  }
}

function onButtonPressLeft() {
  block.x -=20;
}

function onButtonPressRight() {
  block.x +=20;
}

function debugHandler(){
  console.log("Loucura amigo");
}