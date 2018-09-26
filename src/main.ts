import { BlockPiece } from "./block-piece";

export class Main {
    app: PIXI.Application;
    //Pieces Matrix
    blocksMatrix = [];
    blocksMatrixSize: any;
    blockPiece: any;
    blockTypes = [
        { type: "line", id: 10 },
        { type: "square", id: 20 },
        { type: "T", id: 30 },
        { type: "S", id: 40 },
        { type: "Z", id: 50 },
        { type: "left_L", id: 60 },
        { type: "right_L", id: 70 }
    ];
    //UI
    left_arrow: PIXI.Sprite;
    right_arrow: PIXI.Sprite;
    scoreUI: any;
    linesScore: number = 0;
    //Difficulty
    autoMoveTime: number = 0;
    autoMoveTimeLimit: number = 60;

    constructor(){
        var app = new PIXI.Application({
            width: 600,
            height: 600,
            antialias: true,
            transparent: true,
            resolution: 1
        });
        //Keyboard Input Handling
        document.addEventListener('keydown', this.keyDownHandler);
        //Add the canvas that Pixi automatically created for you to the HTML document
        document.body.appendChild(app.view);


        for (var i = 0; i < this.blocksMatrixSize.x; i++) {
            this.blocksMatrix[i] = [];
            for (var j = 0; j < this.blocksMatrixSize.y; j++) {
                this.blocksMatrix[i][j] = 0;
            }
        }
        //Drawing
        PIXI.loader
            .add("rsc/arrows.png")
            .load(this.setup);
    }

    //This `setup` function will run when the image has loaded
    setup() {
        var leftArrowTexCache = PIXI.utils.TextureCache["rsc/arrows.png"];
        var rightArrowTexCache = PIXI.utils.TextureCache["rsc/arrows.png"];
        leftArrowTexCache.frame = new PIXI.Rectangle(0, 0, 100, 100);
        this.left_arrow = new PIXI.Sprite(leftArrowTexCache);
        rightArrowTexCache.frame = new PIXI.Rectangle(100, 0, 100, 100);
        this.right_arrow = new PIXI.Sprite(rightArrowTexCache);
        this.left_arrow.interactive = true;
        this.left_arrow.buttonMode = true;
        this.left_arrow.on('pointerdown', this.onButtonPressLeft);
        this.right_arrow.interactive = true;
        this.right_arrow.buttonMode = true;
        this.right_arrow.on('pointerdown', this.onButtonPressRight);
        //Sprites positions
        this.left_arrow.x = 0;
        this.left_arrow.y = 500;
        this.right_arrow.x = 200;
        this.right_arrow.y = 500;
        //Add the UI elements
        this.app.stage.addChild(this.left_arrow);
        this.app.stage.addChild(this.right_arrow);
        this.scoreUI = new PIXI.Text("Lines: " + this.linesScore);
        this.scoreUI.position.set(250, 0);
        this.app.stage.addChild(this.scoreUI);
        this.createBlockPiece();
        //Render the stage   
        this.app.renderer.render(this.app.stage);
        //Start the game loop by adding the `gameLoop` function to
        //Pixi's `ticker` and providing it with a `delta` argument.
        this.app.ticker.add(delta => this.main(delta));
    }

    //Main Loop
    main(delta) {
        this.autoMoveTime += delta;
        if (this.autoMoveTime >= this.autoMoveTimeLimit) {
            this.movePiece(0, 1);
            this.autoMoveTime = 0;
        }
    }
    createBlockPiece() {
        if (this.blockPiece) {
            this.solidifyBlocksInsideMatrix();
            this.app.stage.removeChild(this.blockPiece.rectangles);
            this.clearLines();
        }
        this.blockPiece = new BlockPiece(this.blockTypes[this.randomInt(0, 1)], 4, 0);
        this.app.stage.addChild(this.blockPiece.rectangles);
        if (this.blockPiece && this.checkPieceCollision(0, 0)) {
            console.log("GAME OVER");
            //let message = new PIXI.Text("GAME OVER");
            //app.stage.addChild(message);
            return false;
        }
    }
    //////Input
    keyDownHandler(event) {
        if (event.keyCode == 39) {
            this.onButtonPressRight();
        }
        else if (event.keyCode == 37) {
            this.onButtonPressLeft();
        }
        else if (event.keyCode == 40) {
            this.onButtonPressDown();
        }
    }
    onButtonPressLeft() {
        this.movePiece(-1, 0);
    }
    onButtonPressRight() {
        this.movePiece(1, 0);
    }
    onButtonPressDown() {
        this.dropPiece();
    }
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    setMatrixPieceBlocks(value) {
        this.blockPiece.matrixPlacements[this.blockPiece.currentRotation].forEach(block => {
            this.blocksMatrix[this.blockPiece.posX + block.col][this.blockPiece.posY + block.row] = value;
        });
    }
     checkPieceCollision(offsetX, offsetY) {
        var collision = false;
        var posx = this.blockPiece.posX + offsetX;
        var posy = this.blockPiece.posY + offsetY;
        //checks for collision with other blocks and stage boundaries
        this.blockPiece.matrixPlacements[this.blockPiece.currentRotation].forEach(block => {
            if (posx + block.col >= this.blocksMatrixSize.x || block.col + posx < 0 ||
                posy + block.row > this.blocksMatrixSize.y) {
                collision = true;
            }
            else if (this.blocksMatrix[posx + block.col][posy + block.row]) {
                if (this.blocksMatrix[posx + block.col][posy + block.row]) {
                    collision = true;
                }
            }
        });
        return collision;
    }
     movePiece(posX, posY) {
        var canMove = true;
        if (this.checkPieceCollision(posX, posY)) {
            canMove = false;
        }
        if (canMove) {
            this.blockPiece.move(posX, posY);
        }
        else if (posY > 0) {
            this.dropPiece();
        }
        return canMove;
    }
     dropPiece() {
        while (!this.checkPieceCollision(0, 1)) {
            this.movePiece(0, 1);
        }
        this.setMatrixPieceBlocks(this.blockPiece.blockInfo.id);
        this.createBlockPiece();
    }
    //creates sprites for each block of the piece inside the matrix
    solidifyBlocksInsideMatrix() {
        this.blockPiece.matrixPlacements[this.blockPiece.currentRotation].forEach(block => {
            var blockSprite = new PIXI.Graphics();
            blockSprite.lineStyle(2, 0xBBBBBB, 1);
            blockSprite.beginFill(this.blockPiece.color);
            blockSprite.drawRect(block.col * this.blockPiece.blockSize, block.row * this.blockPiece.blockSize, this.blockPiece.blockSize, this.blockPiece.blockSize); //size
            blockSprite.endFill();
            blockSprite.x = this.blockPiece.posX * this.blockPiece.blockSize;
            blockSprite.y = this.blockPiece.posY * this.blockPiece.blockSize;
            this.app.stage.addChild(blockSprite);
            this.blocksMatrix[this.blockPiece.posX + block.col][this.blockPiece.posY + block.row] = blockSprite;
        });
    }
    clearLines() {
        var blocksInLine = 0;
        for (var line = 0; line <= this.blocksMatrixSize.y; line++) {
            for (var j = 0; j < this.blocksMatrixSize.x; j++) {
                if (this.blocksMatrix[j][line]) {
                    blocksInLine++;
                }
            }
            if (blocksInLine >= this.blocksMatrixSize.x) {
                for (var collumn = 0; collumn < this.blocksMatrixSize.x; collumn++) {
                    this.app.stage.removeChild(this.blocksMatrix[collumn][line]);
                    this.blocksMatrix[collumn][line] = undefined;
                }
                this.pullLinesDown(line);
                this.addScore(1);
            }
            blocksInLine = 0;
        }
    }
    //moves down every line above the deleted one
    pullLinesDown(index) {
        for (var line = index; line > 0; line--) {
            for (var collumn = 0; collumn < this.blocksMatrixSize.x; collumn++) {
                let blockSprite = this.blocksMatrix[collumn][line - 1];
                if (blockSprite) {
                    index = line - 1;
                    blockSprite.y += this.blockPiece.blockSize;
                    this.blocksMatrix[collumn][line] = this.blocksMatrix[collumn][line - 1];
                    this.blocksMatrix[collumn][line - 1] = undefined;
                }
            }
        }
    }
    addScore(score) {
        this.linesScore += score;
        this.scoreUI.text = ("Lines: " + this.linesScore);
    }
}