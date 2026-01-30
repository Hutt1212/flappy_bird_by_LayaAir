export default class RepeatingBg extends Laya.Script {
    constructor() {
        super();
        this._width = 0;
    }
    onAwake() {
        this._width = this.owner.width;
    }
    onUpdate(){
        if (this.owner.x <= -this._width) {
            this.owner.x += this._width * 2;
        }
    }
}
