export class BlockPiece {
    blockInfo: any;
    posX: any;
    posY: any;
    blockSize: number;
    currentRotation: number;
    matrixPlacements: any[];
    color: number;
    rectangles: any;

    constructor (blockInfo: {type:string, id:number}, posX: number, posY: number) {
        this.blockInfo = blockInfo;
        this.posX = posX;
        this.posY = posY;
        this.blockSize = 20;
        this.currentRotation = 0;
        this.matrixPlacements = [];
        this.initPiece();
    }

    initPiece () {
        switch (this.blockInfo.type) {
            case "line":
                this.matrixPlacements = [
                    [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }],
                    [{ row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }],
                    [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
                    [{ row: 0, col: 3 }, { row: 1, col: 3 }, { row: 2, col: 3 }, { row: 3, col: 3 }],
                ];
                this.color = 0x66CCFF;
                break;
            case "square":
                this.matrixPlacements = [
                    [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
                    [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
                    [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
                    [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
                ];
                this.color = 0xFFFF00;
                break;
            default:
                this.matrixPlacements = [
                    [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }],
                    [{ row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }],
                    [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
                    [{ row: 0, col: 3 }, { row: 1, col: 3 }, { row: 2, col: 3 }, { row: 3, col: 3 }],
                ];
                this.color = 0x000000;
                break;
        }
        this.rectangles = new PIXI.Graphics();
        this.rectangles.lineStyle(2, 0xBBBBBB, 1);
        this.rectangles.beginFill(this.color);
        this.matrixPlacements[this.currentRotation].forEach(block => {
            this.rectangles.drawRect(block.col * this.blockSize, block.row * this.blockSize, 
                this.blockSize, this.blockSize);
        });
        this.rectangles.endFill();
        this.rectangles.x = this.posX * this.blockSize;
        this.rectangles.y = this.posY * this.blockSize;
    }

    move (x, y) {
        this.rectangles.x += x * this.blockSize;
        this.rectangles.y += y * this.blockSize;
        this.posX += x;
        this.posY += y;
    }
}
