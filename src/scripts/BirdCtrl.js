let isGameover = false;
let isStarted = false;
export default class BirdCrtl extends Laya.Script {
    constructor() {
        super();
        /** @prop {name:name;tips:"AutoMove", type:Node,default: null}*/
        this.xx = null;
        this._onMouseDown = null;
        this._onKeyDown = null;
        this._onGameStart = null;
        this._onGameOver = null;
        this._rigidBody = null;
        this._gravityScale = 0;
        this._lastDashTime = -999999;
        this._dashDuration = 220;
        this._dashCooldown = 300;
        this._dashMultiplier = 2;
    }
    onAwake() {
        isGameover = false;
        isStarted = false;
        this._rigidBody = this.owner.getComponent(Laya.RigidBody);
        if (this._rigidBody) {
            this._gravityScale = this._rigidBody.gravityScale;
            this._rigidBody.gravityScale = 0;
            this._rigidBody.linearVelocity = { x: 0, y: 0 };
        }
        this._onMouseDown = this.mouseDown.bind(this);
        Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this._onMouseDown);
        this._onKeyDown = this._handleKeyDown.bind(this);
        Laya.stage.on(Laya.Event.KEY_DOWN, this, this._onKeyDown);
        this._onGameStart = () => {
            isStarted = true;
            isGameover = false;
            if (this._rigidBody) {
                this._rigidBody.gravityScale = this._gravityScale;
            }
        };
        this._onGameOver = () => { isGameover = true; };
        Laya.stage.on("GameStart", this, this._onGameStart);
        Laya.stage.on("GameOver", this, this._onGameOver);
    }
    onDestroy() {
        if (this._onMouseDown) {
            Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this._onMouseDown);
        }
        if (this._onKeyDown) {
            Laya.stage.off(Laya.Event.KEY_DOWN, this, this._onKeyDown);
        }
        if (this._onGameStart) {
            Laya.stage.off("GameStart", this, this._onGameStart);
        }
        if (this._onGameOver) {
            Laya.stage.off("GameOver", this, this._onGameOver);
        }
    }
    mouseDown() {
        if (isGameover) return;
        if (!isStarted) {
            Laya.stage.event("GameStart");
        }
        this.owner.getComponent(Laya.RigidBody).linearVelocity = { x: 0, y: -10 };
        this.owner.autoAnimation = "red1";
        this.owner.loop = false;
    }
    _handleKeyDown(e) {
        if (e && (e.keyCode === 32 || e.keyCode === Laya.Keyboard.SPACE)) {
            this._dashForward();
        }
    }
    _dashForward() {
        if (isGameover) return;
        if (!isStarted) {
            Laya.stage.event("GameStart");
        }
        const now = Laya.timer.currTimer;
        if ((now - this._lastDashTime) < this._dashCooldown) return;
        this._lastDashTime = now;
        Laya.stage.event("Dash", {
            multiplier: this._dashMultiplier,
            duration: this._dashDuration
        });
    }
    onUpdate() {
        if (isGameover || !isStarted) return;
        if (this.owner.isPlaying == false) {
            this.owner.autoAnimation = "red1";
            Laya.SoundManager.playSound("audio/sound1.mp3")
        }
    }
    onTriggerEnter(other) {
        if (isGameover) return;
        if (other.owner.name == "TopCollider") return;
        this.owner.autoAnimation = "red2";
        isGameover = true;
        Laya.SoundManager.playSound("audio/sound2.mp3")

        Laya.stage.event("GameOver");
    }
}
