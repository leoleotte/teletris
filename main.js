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

//Drawing
loader
  .add("rsc/blocks.png")
  .load(setup);

  let block;

//This `setup` function will run when the image has loaded
function setup() {

  let texture = TextureCache["rsc/blocks.png"];

  //Create a rectangle object that defines the position and
  //size of the sub-image you want to extract from the texture
  //(`Rectangle` is an alias for `PIXI.Rectangle`)
  let rectangle = new Rectangle(0, 0, 145, 90);

  //Tell the texture to use that rectangular section
  texture.frame = rectangle;

  //Create the sprite from the texture
  block = new Sprite(texture);

  //Add the block to the stage
  app.stage.addChild(block);
  
  //Render the stage   
  app.renderer.render(app.stage);

  //Start the game loop by adding the `gameLoop` function to
  //Pixi's `ticker` and providing it with a `delta` argument.
  app.ticker.add(delta => main(delta));
}

  //Main Loop
  function main(delta){
    if(block.y <= 400) {
      block.y += block.scale.x + block.scale.y;
    } else {
      block.scale.set(block.scale.x + 1, block.scale.y+1);
      block.y -= block.scale.x * 100;
    }
  }