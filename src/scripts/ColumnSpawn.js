export default class ColumnSpawn extends Laya.Script {
    constructor() {
        super();
        /** @prop {name: columnPre, tips: "Column Prefab", type: Prefab} */
        this.columnPre = null;
        this._timer = 0;
        this._ranTime = 2000;
        this._isGameover = false;
        this._isStarted = false;
        this._columnParent = null;
        this._bird = null;
        this._scoreColumns = [];
        this._cleanupX = -600;
        this._onGameOver = null;
        this._onGameStart = null;
    }

    onAwake() {
        this._columnParent = this.owner.getChildByName("ColumnParent");
        this._bird = this.owner.getChildByName("bird");
        this._onGameStart = () => {
            this._isStarted = true;
            this._isGameover = false;
            this._timer = 0;
            this._scoreColumns = [];
        };
        this._onGameOver = () => { this._isGameover = true; };
        Laya.stage.on("GameStart", this, this._onGameStart);
        Laya.stage.on("GameOver", this, this._onGameOver);
    }
    onDestroy() {
        if (this._onGameStart) {
            Laya.stage.off("GameStart", this, this._onGameStart);
        }
        if (this._onGameOver) {
            Laya.stage.off("GameOver", this, this._onGameOver);
        }
    }
    onUpdate() {
        if (!this._isStarted) return;
        if (this._isGameover) {
            this._timer = 0;
            return;
        }
        this._timer += Laya.timer.delta;
        if (this._timer >= this._ranTime) {
            this._timer = 0;
            this._ranTime = this.getRandom(1000, 1700);
            this.spawn();
        }
        this._checkScore();
    }

    spawn() {
        var bottomColumn = this.columnPre.create();
        this._columnParent.addChild(bottomColumn);
        var bottomY = this.getRandom(400, 800);
        var bottomX = 1745;
        bottomColumn.pos(bottomX, bottomY);

        var cha = this.getRandom(150, 300);

        var topY = bottomY - cha;

        var topColumn = this.columnPre.create();
        this._columnParent.addChild(topColumn);
        topColumn.rotation = 180;
        var topX = 2079;
        topColumn.pos(topX, topY);
        bottomColumn._scored = false;
        bottomColumn._pair = topColumn;
        this._scoreColumns.push(bottomColumn);
    }

    _checkScore() {
        if (!this._bird) return;
        var birdX = this._bird.x;
        for (var i = 0; i < this._scoreColumns.length; i++) {
            var col = this._scoreColumns[i];
            if (!col || col.destroyed) {
                this._scoreColumns.splice(i, 1);
                i--;
                continue;
            }
            if (!col._scored && (col.x + col.width) < birdX) {
                col._scored = true;
                Laya.stage.event("AddScore");
            }
            if (col.x < this._cleanupX) {
                this._scoreColumns.splice(i, 1);
                i--;
                if (col.parent) col.removeSelf();
                if (col._pair && col._pair.parent) col._pair.removeSelf();
            }
        }
    }

    getRandom(min, max) {
        var ranValue = 0;
        if (max > min) {
            ranValue = Math.random() * (max - min)
            ranValue += min;
        } else {
            ranValue = Math.random() * (min - max)
            ranValue += max;
        }
        return ranValue;
    }
}
