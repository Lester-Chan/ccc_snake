import { Common } from "./Common";
import Main from "./Main";

const {ccclass, property} = cc._decorator

@ccclass
export default class Head extends cc.Component {
    @property(cc.Prefab)
    private bodyPrefab: cc.Prefab = null;
    @property(Boolean)
    private canControl:boolean = false;
    @property(String)
    snakeName:string = '';
    @property(cc.Vec2)
    private vec:cc.Vec2 = cc.v2(0, 0);
    @property(Boolean)
    private isDead:boolean = false;
    @property(Number)
    private speed:number = 0;
    @property(Boolean)
    private canCtrl:boolean = true;

    private _growingWeight:number = 0 // 增长的体重满10则增加一个节点

    onLoad () {
        //碰撞检测
        let manager = cc.director.getCollisionManager();
        manager.enabled = true;
        manager.enabledDrawBoundingBox = true;
    }

    init(name){
        this.snakeName = name;
    }
    setVec(vec){
        this.vec = vec;
    }

    setCanControl(canCtrl) {
        this.canCtrl = canCtrl;
    }

       //碰撞事件监听
    onCollisionEnter (other:cc.Collider, self:cc.Collider) {
        let group = other.node.group;

        if(group === 'food'){
            let foodScript = other.node.getComponent('Food');
            this._growingWeight += foodScript.weight;
            
            Common.gameData.foodPool.put(other.node);
            if(this._growingWeight/10 > 0){
                let size = this._growingWeight / 10;
                for(let i = 0; i < Math.floor(size); i++){
                    let body = cc.instantiate(this.bodyPrefab);//生成身体
                    
                    //根据最后两个节点的向量的确定新增节点的坐标
                    let arr = Common.gameData.snakeMap[this.snakeName];
                    let lastp = arr[arr.length-1].getPosition();
                    let lastp2 = arr[arr.length-2].getPosition();

                    body.getComponent('Body').init(this.snakeName, arr.length);

                    let subVec = cc.pSub(lastp, lastp2);
                

                    let currp = cc.pAdd(lastp, subVec);

                    body.setPosition(currp);
                    Main.instance.addBody(body);

                    arr.push(body);
                }

                this._growingWeight = this._growingWeight % 10;//增加节点后，修改重量为余数
            }
        }
        if(group === 'body out'){//遇到其他蛇则躲闪
            // 是自己则不处理
            let bodyScript = other.node.parent.getComponent('Body');
            if(bodyScript){
                if(this.snakeName == bodyScript.snakeName)
                    return;
            }

            let arr = Common.gameData.snakeMap[this.snakeName];
            if(arr){
                let p1 = arr[0].getPosition();
                let p2 = arr[1].getPosition();

                let subVec = cc.pSub(p1, p2);
                // let prepVec = cc.pPerp(subVec);//逆时针90度

                let x = -subVec.x;
                let y = cc.randomMinus1To1()*subVec.y;

                let v = cc.v2(x, y);
                this.vec = v;
            }
        }
        if(group === 'body'){
            // 是自己则不处理
            let bodyScript = other.node.getComponent('Body');
            if(bodyScript){
                if(this.snakeName == bodyScript.snakeName)
                    return;
            }

            this.isDead = true;
            
            let arr = Common.gameData.snakeMap[this.snakeName];
            if(arr){
                for(let i = 0; i < arr.length; i++){
                    let prefab = arr[i];
                    let bodyScript = prefab.getComponent('Body');
                    if(bodyScript){
                        bodyScript.isDead = true;
                    }

                    //死蛇变成食物
                    Main.instance.addFood(prefab.getPosition(), 10);
                    
                    //回收蛇
                    if(i == 0)
                        Common.gameData.headPool.put(prefab);
                    else
                        Common.gameData.bodyPool.put(prefab);
                }
                Common.gameData.snakeMap[this.snakeName] = null;
            }
        }
    }

    // called every frame, uncomment this function to activate update callback
    update (dt:number) {
        if(!this.isDead){
            let speed = Common.gameData.snakeSpeedMap[this.snakeName];
            if(!speed){
                speed = this.speed;
                Common.gameData.snakeSpeedMap[this.snakeName] = speed;
            }

            let vvv = cc.pNormalize(this.vec);

            // console.log(vvv.x, ',', vvv.y);
            let backRect = cc.rect(0, 0, Common.gameData.backWidth, Common.gameData.backHeight);
            let pos = cc.v2(this.node.x + vvv.x*this.node.width/speed *dt, this.node.y + vvv.y*this.node.width/speed *dt);
            if (backRect.contains(pos)) {
                this.node.setPosition(pos);
            }

            if(Math.abs(this.node.x) >= Common.gameData.backWidth/2){
                this.vec.x = -this.vec.x;
            }
            if(Math.abs(this.node.y) >= Common.gameData.backHeight/2){
                this.vec.y = - this.vec.y;
            }
        }
    }

}