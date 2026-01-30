export default class AutoMove extends Laya.Script {
    constructor() {
        super();
        /** @prop {name:name;tips:"AutoMove", type:Node,default: null}*/
        this.xx = null;
        this._onGameOver = null;
        this._onGameStart = null;
        this._onDash = null;
        this._speedX = -7;
        this._baseSpeedX = -7;
        this._dashMultiplier = 2;
        this._dashDuration = 220;
        this._isDashing = false;
        this._isGameOver = false;
        this._rigidBody = null;
    }
    onAwake() {
        this._rigidBody = this.owner.getComponent(Laya.RigidBody);
        this._baseSpeedX = this._speedX;
        if (this._rigidBody) {
            var started = !!Laya.stage.__gameStarted;
            this._rigidBody.linearVelocity = { x: started ? this._speedX : 0, y: 0 };
        }
        this._onGameStart = () => {
            Laya.stage.__gameStarted = true;
            this._isGameOver = false;
            if (this._rigidBody) {
                this._rigidBody.linearVelocity = { x: this._speedX, y: 0 };
            }
        };
        this._onGameOver = () => {
            this._isGameOver = true;
            if (this._rigidBody) {
                this._rigidBody.linearVelocity = { x: 0, y: 0 };
            }
        };
        this._onDash = (data) => {
            if (this._isGameOver || !Laya.stage.__gameStarted || !this._rigidBody) return;
            const multiplier = data && data.multiplier ? data.multiplier : this._dashMultiplier;
            const duration = data && data.duration ? data.duration : this._dashDuration;
            this._isDashing = true;
            this._speedX = this._baseSpeedX * multiplier;
            this._rigidBody.linearVelocity = { x: this._speedX, y: 0 };
            Laya.timer.clear(this, this._endDash);
            Laya.timer.once(duration, this, this._endDash);
        };
        Laya.stage.on("GameStart", this, this._onGameStart);
        Laya.stage.on("GameOver", this, this._onGameOver);
        Laya.stage.on("Dash", this, this._onDash);
    }
    onDestroy() {
        if (this._onGameStart) {
            Laya.stage.off("GameStart", this, this._onGameStart);
        }
        if (this._onGameOver) {
            Laya.stage.off("GameOver", this, this._onGameOver);
        }
        if (this._onDash) {
            Laya.stage.off("Dash", this, this._onDash);
        }
        Laya.timer.clear(this, this._endDash);
    }

    _endDash() {
        this._isDashing = false;
        this._speedX = this._baseSpeedX;
        if (!this._isGameOver && Laya.stage.__gameStarted && this._rigidBody) {
            this._rigidBody.linearVelocity = { x: this._speedX, y: 0 };
        }
    }
}
