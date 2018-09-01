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
    width: 512, 
    height: 512,                       
    antialias: true, 
    transparent: true, 
    resolution: 1
  }
);

//Applies CSS to make it fullscreen
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoDensity = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
scaleToWindow(app.renderer.view);

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keypress', keyHandler);

//Variables
let stageLeftBoundary = 200;
let stageRightBoundary = 600;
let block;

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

  //Sprites positions
  block.x += stageLeftBoundary;

  this.left_arrow.x = 0;
  this.left_arrow.y = 200;
  this.right_arrow.x = stageRightBoundary;
  this.right_arrow.y = 200;

  //Pixi interactivity
  this.left_arrow.interactive = true;
  this.left_arrow.buttonMode = true;
  this.left_arrow.on('pointerdown', onButtonPress({direction: 'left'}));

  this.right_arrow.interactive = true;
  this.right_arrow.buttonMode = true;
  this.right_arrow.on('pointerdown', onButtonPress({direction: 'right'}));

  //Add the block to the stage
  app.stage.addChild(block);
  app.stage.addChild(this.left_arrow);
  app.stage.addChild(this.right_arrow);

  //let message = new Text("Hello Pixi!");
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
    //block.y += block.scale.x + block.scale.y;
  } else {
    block.scale.set(block.scale.x + 1, block.scale.y+1);
    block.y -= block.scale.x * 100;
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

function onButtonPress(buttonType) {
  console.log(buttonType);
  switch(buttonType.direction) {
    case 'left':
      block.x -=20;
      break;
    case 'right':
      block.x +=20;
      break;
  }
}