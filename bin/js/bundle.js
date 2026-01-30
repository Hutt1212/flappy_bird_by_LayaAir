(function () {
    'use strict';

    class AutoMove extends Laya.Script {
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

    class RepeatingBg extends Laya.Script {
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

    let isGameover = false;
    let isStarted = false;
    class BirdCrtl extends Laya.Script {
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
                Laya.SoundManager.playSound("audio/sound1.mp3");
            }
        }
        onTriggerEnter(other) {
            if (isGameover) return;
            if (other.owner.name == "TopCollider") return;
            this.owner.autoAnimation = "red2";
            isGameover = true;
            Laya.SoundManager.playSound("audio/sound2.mp3");

            Laya.stage.event("GameOver");
        }
    }

    class ColumnSpawn extends Laya.Script {
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
                ranValue = Math.random() * (max - min);
                ranValue += min;
            } else {
                ranValue = Math.random() * (min - max);
                ranValue += max;
            }
            return ranValue;
        }
    }

    /**This class is automatically generated by LayaAirIDE, please do not make any modifications. */

    class GameConfig {
        static init() {
            //注册Script或者Runtime引用
            let reg = Laya.ClassUtils.regClass;
    		reg("scripts/AutoMove.js",AutoMove);
    		reg("scripts/RepeatingBg.js",RepeatingBg);
    		reg("scripts/BirdCtrl.js",BirdCrtl);
    		reg("scripts/ColumnSpawn.js",ColumnSpawn);
        }
    }
    GameConfig.width = 1920;
    GameConfig.height = 1080;
    GameConfig.scaleMode ="fixedwidth";
    GameConfig.screenMode = "none";
    GameConfig.alignV = "top";
    GameConfig.alignH = "left";
    GameConfig.startScene = "page.scene";
    GameConfig.sceneRoot = "";
    GameConfig.debug = false;
    GameConfig.stat = false;
    GameConfig.physicsDebug = false;
    GameConfig.exportSceneToJson = true;

    GameConfig.init();

    const SCORE_KEY = "flappy_best_score";

    class GameManager extends Laya.Script {
        constructor() {
            super();
            this._score = 0;
            this._best = 0;
            this._state = "ready";
            this._scoreLabel = null;
            this._bestLabel = null;
            this._startLabel = null;
            this._gameOverLabel = null;
            this._replayBtn = null;
            this._onAddScore = null;
            this._onGameStart = null;
            this._onGameOver = null;
            this._onResize = null;
            this._onReplayClick = null;
            this._isRestarting = false;
            this._startText = "NHẤN ĐỂ BẮT ĐẦU ĐI CỨ LÈ NHÀ LÈ NHÈ MÃI";
        }

        onAwake() {
            Laya.stage.__gameStarted = false;
            
            Laya.loader.load(
                [{ url: "res/font/SVN-Determination Sans.ttf", type: Laya.Loader.TTF }],
                Laya.Handler.create(this, this._initUI)
            );

            this._scoreLabel = this._ensureLabel("ScoreLabel", {
                font: "SVN-Determination Sans",
                text: "0",
                fontSize: 64,
                color: "#ffffff",
                stroke: 4,
                strokeColor: "#000000",
                bold: true,
                align: "left",
                valign: "top"
            });
            this._bestLabel = this._ensureLabel("BestLabel", {
                text: "Điểm cao nhất: 0",
                font: "SVN-Determination Sans",
                fontSize: 32,
                color: "#ffffff",
                stroke: 3,
                strokeColor: "#000000",
                bold: true,
                align: "left",
                valign: "top"
            });
            this._startLabel = this._ensureLabel("StartLabel", {
                text: this._startText,
                font: "SVN-Determination Sans",
                fontSize: 48,
                color: "#ffffff",
                stroke: 4,
                strokeColor: "#000000",
                bold: true,
                align: "center",
                valign: "middle"
            });
            this._gameOverLabel = this._ensureLabel("GameOverLabel", {
                text: "Ngu quá HAHAHAHAHHA",
                font: "SVN-Determination Sans",
                fontSize: 64,
                color: "#ff3333",
                stroke: 4,
                strokeColor: "#000000",
                bold: true,
                align: "center",
            });
            this._replayBtn = this.owner.getChildByName("replay");
            if (this._replayBtn) {
                this._replayBtn.visible = false;
            }
            this._best = Number(Laya.LocalStorage.getItem(SCORE_KEY)) || 0;
            this._updateLabels();
            this._layoutLabels();
            this._showStartScreen();

            this._onAddScore = this._handleAddScore.bind(this);
            this._onGameStart = this._handleGameStart.bind(this);
            this._onGameOver = this._handleGameOver.bind(this);
            this._onResize = this._layoutLabels.bind(this);
            this._onReplayClick = this._handleReplayClick.bind(this);

            Laya.stage.on("AddScore", this, this._onAddScore);
            Laya.stage.on("GameStart", this, this._onGameStart);
            Laya.stage.on("GameOver", this, this._onGameOver);
            Laya.stage.on(Laya.Event.RESIZE, this, this._onResize);
            if (this._replayBtn) {
                this._replayBtn.on(Laya.Event.CLICK, this, this._onReplayClick);
            }
        }

        onDestroy() {
            if (this._onAddScore) {
                Laya.stage.off("AddScore", this, this._onAddScore);
            }
            if (this._onGameStart) {
                Laya.stage.off("GameStart", this, this._onGameStart);
            }
            if (this._onGameOver) {
                Laya.stage.off("GameOver", this, this._onGameOver);
            }
            if (this._onResize) {
                Laya.stage.off(Laya.Event.RESIZE, this, this._onResize);
            }
            if (this._replayBtn && this._onReplayClick) {
                this._replayBtn.off(Laya.Event.CLICK, this, this._onReplayClick);
            }
        }

        _showStartScreen() {
            
            if (this._startLabel) {
                const startText = this._startText || "NHAN DE BAT DAU";
                this._startLabel.text = startText;
            }

            if (this._startLabel) this._startLabel.visible = true;
            if (this._gameOverLabel) this._gameOverLabel.visible = false;
            if (this._replayBtn) this._replayBtn.visible = false;
        }

        _handleGameStart() {
            if (this._state === "playing") return;
            this._state = "playing";
            this._score = 0;
            this._updateLabels();
            Laya.stage.__gameStarted = true;
            if (this._startLabel) this._startLabel.visible = false;
            if (this._gameOverLabel) this._gameOverLabel.visible = false;
            if (this._replayBtn) this._replayBtn.visible = false;
        }

        _handleAddScore() {
            if (this._state !== "playing") return;
            this._score += 1;
            if (this._score > this._best) {
                this._best = this._score;
                Laya.LocalStorage.setItem(SCORE_KEY, String(this._best));
            }
            this._updateLabels();
        }

        _handleGameOver() {
            if (this._state !== "playing") return;
            this._state = "gameover";
            if (this._gameOverLabel) this._gameOverLabel.visible = true;
            if (this._replayBtn) this._replayBtn.visible = true;
        }

        _updateLabels() {
            if (this._scoreLabel) this._scoreLabel.text = String(this._score);
            if (this._bestLabel) this._bestLabel.text = "Điểm cao nhất: " + this._best;
        }

        _ensureLabel(name, defaults) {
            let label = this.owner.getChildByName(name);
            let created = false;
            if (!label) {
                label = new Laya.Label();
                label.name = name;
                this.owner.addChild(label);
                created = true;
            }
            if (created && defaults) {
                if (defaults.font) label.font = defaults.font;
                if (defaults.text !== undefined) label.text = defaults.text;
                if (defaults.fontSize !== undefined) label.fontSize = defaults.fontSize;
                if (defaults.color !== undefined) label.color = defaults.color;
                if (defaults.stroke !== undefined) label.stroke = defaults.stroke;
                if (defaults.strokeColor !== undefined) label.strokeColor = defaults.strokeColor;
                if (defaults.bold !== undefined) label.bold = defaults.bold;
                if (defaults.align !== undefined) label.align = defaults.align;
                if (defaults.valign !== undefined) label.valign = defaults.valign;
            }
            label.zOrder = 1000;
            label.mouseEnabled = false;
            return label;
        }

        _layoutLabels() {
            const stageWidth = Laya.stage.width;
            const stageHeight = Laya.stage.height;
            const margin = Math.max(24, Math.round(stageWidth * 0.02));

            if (this._scoreLabel) {
                this._scoreLabel.pos(margin, margin);
            }
            if (this._bestLabel) {
                const scoreHeight = this._scoreLabel ? this._scoreLabel.fontSize : 48;
                this._bestLabel.pos(margin, margin + scoreHeight + 8);
            }
            if (this._startLabel) {
                this._startLabel.width = stageWidth;
                this._startLabel.pos(0, Math.round(stageHeight * 0.4));
            }
            if (this._gameOverLabel) {
                this._gameOverLabel.width = stageWidth;
                this._gameOverLabel.pos(0, Math.round(stageHeight * 0.4) + 80);
            }
        }
        _handleReplayClick() {
            if (this._state !== "gameover" || this._isRestarting) return;
            this._isRestarting = true;
            const sceneUrl = (this.owner && this.owner.url) ? this.owner.url : "page.scene";
            Laya.Scene.open(
                sceneUrl,
                true,
                null,
                Laya.Handler.create(this, (scene) => {
                    this._isRestarting = false;
                    if (scene && !scene.getComponent(GameManager)) {
                        scene.addComponent(GameManager);
                    }
                })
            );
        }

    }

    class Main {
    	constructor() {
    		//根据IDE设置初始化引擎		
    		if (window["Laya3D"]) Laya3D.init(GameConfig.width, GameConfig.height);
    		else Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
    		Laya["Physics"] && Laya["Physics"].enable();
    		Laya["DebugPanel"] && Laya["DebugPanel"].enable();
    		Laya.stage.scaleMode = GameConfig.scaleMode;
    		Laya.stage.screenMode = GameConfig.screenMode;
    		Laya.stage.alignV = GameConfig.alignV;
    		Laya.stage.alignH = GameConfig.alignH;
    		//兼容微信不支持加载scene后缀场景
    		Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;

    		//打开调试面板（通过IDE设置调试模式，或者url地址增加debug=true参数，均可打开调试面板）
    		if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true") Laya.enableDebugPanel();
    		if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"]) Laya["PhysicsDebugDraw"].enable();
    		if (GameConfig.stat) Laya.Stat.show();
    		Laya.alertGlobalError(true);

    		//激活资源版本控制，version.json由IDE发布功能自动生成，如果没有也不影响后续流程
    		Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
    	}

    	onVersionLoaded() {
    		//激活大小图映射，加载小图的时候，如果发现小图在大图合集里面，则优先加载大图合集，而不是小图
    		Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
    	}

    	onConfigLoaded() {
    		//加载IDE指定的场景
    		if (GameConfig.startScene) {
    			Laya.Scene.open(
    				GameConfig.startScene,
    				false,
    				null,
    				Laya.Handler.create(this, (scene) => {
    					if (scene && !scene.getComponent(GameManager)) {
    						scene.addComponent(GameManager);
    					}
    				})
    			);
    		}
    	}
    }
    //激活启动类
    new Main();

}());
