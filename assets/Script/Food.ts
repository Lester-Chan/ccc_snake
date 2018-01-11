import { Common } from "./Common";

const {ccclass, property} = cc._decorator

@ccclass
export default class Food extends cc.Component {
    @property({type:cc.Float})
    private sideLen:number = 0;

    onLoad () {
        this.init();
    }

    init(){
        this.setSideLength(cc.random0To1() * 20);
        
        this.node.setPosition(cc.randomMinus1To1()*Common.gameData.backWidth/2, cc.randomMinus1To1()*Common.gameData.backHeight/2);

        var circleCollider = this.getComponent(cc.CircleCollider);
        circleCollider.radius = this.sideLen;//碰撞组件的半径大小
    }

    setSideLength(sideLen:number){
        this.sideLen = sideLen;
        this.node.width = this.sideLen;
        this.node.height = this.sideLen;
    }

    unuse () {
        
    }

    reuse () {
        this.init();
    }
}