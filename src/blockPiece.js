class BlockPiece {
  constructor(blockInfo, posX, posY, blockSize) {
    this.blockInfo = blockInfo;
    this.posX = posX;
    this.posY = posY;    
    this.currentRotation = 0;
    this.matrixPlacements = [];
    this.blockSize = blockSize;
    this.initPiece();
  }

  initPiece() {
    switch(this.blockInfo.type) {
      case "line":
        this.matrixPlacements = [
          [{row:0,col:1}, {row:1,col:1}, {row:2,col:1}, {row:3,col:1}],
          [{row:1,col:0}, {row:1,col:1}, {row:1,col:2}, {row:1,col:3}],
          [{row:0,col:2}, {row:1,col:2}, {row:2,col:2}, {row:3,col:2}],
          [{row:2,col:0}, {row:2,col:1}, {row:2,col:2}, {row:2,col:3}]
        ];
        this.color = 0x66CCFF;
      break;
      case "square":
        this.matrixPlacements = [
          [{row:0,col:1}, {row:0,col:2}, {row:1,col:1}, {row:1,col:2}],
          [{row:0,col:1}, {row:0,col:2}, {row:1,col:1}, {row:1,col:2}],
          [{row:0,col:1}, {row:0,col:2}, {row:1,col:1}, {row:1,col:2}],
          [{row:0,col:1}, {row:0,col:2}, {row:1,col:1}, {row:1,col:2}]
        ];
        this.color = 0xFFFF00;
      break;
      case "left_L":
        this.matrixPlacements = [
          [{row:0,col:0}, {row:1,col:0}, {row:1,col:1}, {row:1,col:2}],
          [{row:0,col:2}, {row:0,col:1}, {row:1,col:1}, {row:2,col:1}],
          [{row:1,col:0}, {row:1,col:1}, {row:1,col:2}, {row:2,col:2}], 
          [{row:0,col:1}, {row:1,col:1}, {row:2,col:1}, {row:2,col:0}]
        ];
        this.color = 0xFFFF00;
      break;
      case "right_L":
        this.matrixPlacements = [
          [{row:1,col:0}, {row:1,col:1}, {row:1,col:2}, {row:0,col:2}],
          [{row:0,col:1}, {row:1,col:1}, {row:2,col:1}, {row:2,col:2}],
          [{row:2,col:0}, {row:1,col:0}, {row:1,col:1}, {row:1,col:2}], 
          [{row:0,col:0}, {row:0,col:1}, {row:1,col:1}, {row:2,col:1}]
        ];
        this.color = 0xFF2200;
      break;
      case "T":
        this.matrixPlacements = [
          [{row:1,col:0}, {row:1,col:1}, {row:1,col:2}, {row:0,col:1}],
          [{row:0,col:1}, {row:1,col:1}, {row:2,col:1}, {row:1,col:2}],
          [{row:1,col:0}, {row:1,col:1}, {row:1,col:2}, {row:2,col:1}], 
          [{row:0,col:1}, {row:1,col:1}, {row:2,col:1}, {row:1,col:0}]
        ];
        this.color = 0xBB2200;
      break;
      case "S":
      this.matrixPlacements = [
        [{row:1,col:0}, {row:1,col:1}, {row:0,col:1}, {row:0,col:2}],
        [{row:0,col:1}, {row:1,col:1}, {row:1,col:2}, {row:2,col:2}],
        [{row:2,col:0}, {row:2,col:1}, {row:1,col:1}, {row:1,col:2}],
        [{row:0,col:0}, {row:1,col:0}, {row:1,col:1}, {row:2,col:1}]
      ];
      this.color = 0x888800;
      break;
      case "Z":
      this.matrixPlacements = [
        [{row:0,col:0}, {row:0,col:1}, {row:1,col:1}, {row:1,col:2}],
        [{row:0,col:2}, {row:1,col:2}, {row:1,col:1}, {row:2,col:1}],
        [{row:1,col:0}, {row:1,col:1}, {row:2,col:1}, {row:2,col:2}],
        [{row:0,col:1}, {row:1,col:1}, {row:1,col:0}, {row:2,col:0}]
      ];
      this.color = 0xFF8866;
      break;
    }

    this.drawBlocks();
  }

  drawBlocks() {
    if (this.rectangles) {
      app.stage.removeChild(this.rectangles);
    }
    this.rectangles = new Graphics();
    this.rectangles.lineStyle(2, 0xBBBBBB, 1);

    this.rectangles.beginFill(this.color);

    this.matrixPlacements[this.currentRotation].forEach(block => {
      this.rectangles.drawRect(
        block.col * this.blockSize, 
        block.row * this.blockSize,
        this.blockSize, this.blockSize); //size
    });
    this.rectangles.endFill();

    this.rectangles.x = this.posX * this.blockSize;
    this.rectangles.y = this.posY * this.blockSize;
    app.stage.addChild(this.rectangles);
  }

  move(x, y) {
    this.rectangles.x += x * this.blockSize;
    this.rectangles.y += y * this.blockSize;

    this.posX += x;
    this.posY += y;
  }

  rotate(rotation) {
    this.currentRotation = rotation;
    this.drawBlocks();
  }

  getNextRotation(side) {
    let nextRotation = this.currentRotation + (side == "left" ? -1 : 1);
    if (nextRotation > 3) {
      nextRotation = 0;
    } else if (nextRotation < 0) {
      nextRotation = 3;
    }
    return nextRotation;
  }
}