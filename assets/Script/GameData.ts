class Snake extends Array<cc.Node> {
    
}

export class SnakeMap {
    player:Snake = new Snake();
    snakes:Snake = new Snake();
}

export class GameData {
    snakeMap:SnakeMap = null;
    snakeSpeedMap:any = null;
    foodPool:cc.NodePool = null;
    bodyPool:cc.NodePool = null;
    headPool:cc.NodePool = null;
    backWidth:number = 0;
    backHeight:number = 0;
}