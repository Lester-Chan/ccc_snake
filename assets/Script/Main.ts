import { GameData, SnakeMap } from "./GameData";
import { Common } from "./Common";
import Food from "./Food";


const {ccclass, property} = cc._decorator

@ccclass
export default class Main extends cc.Component {
    @property(cc.Prefab)
    headPrefab:cc.Prefab = null;
    @property(cc.Prefab)
    bodyPrefab:cc.Prefab = null;
    @property(cc.Prefab)
    foodPrefab:cc.Prefab = null;
    @property(cc.Node)
    controlNode:cc.Node = null;
    @property(cc.Node)
    controlSprite:cc.Node = null;
    @property(cc.Node)
    speedNode:cc.Node = null;
    @property(cc.Node)
    cameraNode:cc.Node = null;
    @property(cc.Node)
    backNode:cc.Node = null;
    @property(cc.Vec2)
    controlCenterVec:cc.Vec2 = cc.v2(0, 0);
    @property({type:cc.Float})
    speed:number = 0.12;
    @property({type:cc.Float})
    speedUp:number = 0.06;

    private static _instance:Main = null;

    private _gd:GameData = Common.gameData;

    static get instance():Main {
        return this._instance;
    }

    onLoad() {
        Main._instance = this;

        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.controlMoveCallBack, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.controlEndCallBack, this);

        this.speedNode.on(cc.Node.EventType.TOUCH_START, this.speedStartCallBack, this);
        this.speedNode.on(cc.Node.EventType.TOUCH_END, this.speedEndCallBack, this);

        this.controlCenterVec = new cc.Vec2(this.controlNode.width/2, this.controlNode.height/2);

        this._gd.snakeMap = new SnakeMap();
        this._gd.snakeSpeedMap = {};
        this._gd.foodPool = new cc.NodePool(Food);//创建食物的对象池并指定脚本、这样会调用 unuse reuse方法
        this._gd.bodyPool = new cc.NodePool();
        this._gd.headPool = new cc.NodePool();
        this._gd.backWidth = this.backNode.width;
        this._gd.backHeight = this.backNode.height;

        //摄像机，跟随小蛇移动
        let camera = this.cameraNode.getComponent(cc.Camera);
       

        this.initFood();

        for(let i = 0; i < 10; i++){
            this.createSnake('snake' + i, camera);
        }

        this.createSnake('player', camera);//可控制的小蛇
    }

    lateUpdate (dt:number) {
        
        if(this._gd.snakeMap.player){
            // camera跟踪蛇头 关键代码！！！
            let targetPos = this._gd.snakeMap.player[0].convertToWorldSpaceAR(cc.Vec2.ZERO);
            let range = this.backNode.getBoundingBoxToWorld();
            range.height -= cc.director.getVisibleSize().height / 2;
            range.width -= cc.director.getVisibleSize().width / 2;
            if (range.contains(targetPos)) {
                this.cameraNode.position = this.cameraNode.parent.convertToNodeSpaceAR(targetPos);
            }
        }
    }

    controlMoveCallBack(event:cc.Event.EventTouch) {
        let touches = event.getTouches();
        let touchLoc = touches[0].getLocation();
        let touchPoint = this.controlNode.convertToNodeSpace(touchLoc);

        // 设置控制点 限制超出父节点
        let subVec = cc.pSub(touchPoint, this.controlCenterVec);
        if(cc.pDistance(touchPoint, this.controlCenterVec) > this.controlNode.width/2){
            let nv = cc.pNormalize(subVec);
            this.controlSprite.x = this.controlCenterVec.x + nv.x * this.controlNode.width/2;
            this.controlSprite.y = this.controlCenterVec.y + nv.y * this.controlNode.width/2;
        }else{
            this.controlSprite.setPosition(touchPoint);
        }


        let playerSnakeArr = this._gd.snakeMap.player;
        if(playerSnakeArr && playerSnakeArr[0]){
            let headScript = playerSnakeArr[0].getComponent('Head');
            if(headScript){
                headScript.setVec(subVec);
            }
        }
    }

    controlEndCallBack(event:cc.Event.EventTouch){
        // 恢复控制点位置控制点
        this.controlSprite.setPosition(this.controlCenterVec);
    }

    speedStartCallBack(){

        let speed = this._gd.snakeSpeedMap['player'];
        if(speed)
        this._gd.snakeSpeedMap['player'] = this.speedUp; 
    }
    speedEndCallBack(){        
        let speed = this._gd.snakeSpeedMap['player'];
        if(speed)
        this._gd.snakeSpeedMap['player'] = this.speed; 
    }

    createSnake(name:string, camera:cc.Camera) {
        let x = 960/2 * cc.randomMinus1To1();
        let y = 640/2 * cc.randomMinus1To1();

        let snakeArr = new Array();

        // 蛇头
        let headPrefab:cc.Node = cc.instantiate(this.headPrefab);
        let headScript = headPrefab.getComponent('Head');
        headScript.init(name);
        headScript.setVec(new cc.Vec2(100*cc.randomMinus1To1(), 100*cc.randomMinus1To1()));

        snakeArr.push(headPrefab);

        //  蛇身
        for(let i = 0; i < 5; i++){
            let bodyPrefab = cc.instantiate(this.bodyPrefab);
            bodyPrefab.getComponent('Body').init(name, i+1);
            snakeArr.push(bodyPrefab);
        }

        for(let i = 0; i < snakeArr.length; i++){
            let bodyPrefab = snakeArr[i];

            this.node.addChild(bodyPrefab);
            bodyPrefab.setPosition(cc.p(i*bodyPrefab.width + x, 0 + y));

            camera.addTarget(bodyPrefab);
        }

        this._gd.snakeMap[name] = snakeArr;
    }

    initFood(){
        let camera = this.cameraNode.getComponent(cc.Camera);

        for(let i = 0; i < 100; i++){
            let food = cc.instantiate(this.foodPrefab);
            this.node.addChild(food);
            camera.addTarget(food);
        }
    }

    addFood(position:cc.Vec2, sideLen:number) {
        let food:cc.Node;
        if(this._gd.foodPool.size()>0)
            food = this._gd.foodPool.get();
        else
            food = cc.instantiate(this.foodPrefab);

        this.node.addChild(food);
        food.setPosition(position);
        food.getComponent(Food).setSideLength(sideLen);

        let camera = this.cameraNode.getComponent(cc.Camera);
        camera.addTarget(food);
    }

    addBody(body:cc.Node){
        this.node.addChild(body);
        let camera = this.cameraNode.getComponent(cc.Camera);
        camera.addTarget(body);
    }
}