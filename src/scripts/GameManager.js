const SCORE_KEY = "flappy_best_score";

export default class GameManager extends Laya.Script {
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
