// 게임 설정
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1080,
        height: 1920,
        zoom: 1,
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    backgroundColor: '#000000'
};

const game = new Phaser.Game(config);

// 게임 변수
let gameState = {
    score: 0,
    combo: 0,
    feverCount: 0,
    isFever: false,
    feverTime: 0,
    timeLeft: 60,
    gameSpeed: 1,
    difficulty: 1, // 1 = 각 사이드 1명, 2 = 각 사이드 2명
    gameStarted: false,
    showingEnding: false,
    
    // 캐릭터 정보
    characters: ['dowoon', 'sungjin', 'wonpil', 'youngk'],
    leftCharacters: [],
    rightCharacters: [],
    
    // 음식 큐
    foodQueue: [],
    queueSize: 8,
    
    // 게임 오브젝트
    foodSprites: [],
    characterSprites: {},
    
    // UI 요소
    scoreText: null,
    comboText: null,
    timebar: null,
    fevergauge: null,
    
    // 타이머
    gameTimer: null,
    feverTimer: null,

    // 키보드 입력
    cursors: null
};

// 프리로드
function preload() {
    // 배경
    this.load.image('bg_normal', 'assets/UI/Background_normal.jfif');
    this.load.image('bg_fever', 'assets/UI/Background_fever.jfif');
    
    // UI 요소
    this.load.image('tables_normal', 'assets/UI/Tables_normal.png');
    this.load.image('tables_fever', 'assets/UI/Tables_fever.png');
    this.load.spritesheet('timebox', 'assets/UI/timebox.PNG', { frameWidth: 2997 / 3, frameHeight: 102 });
    this.load.spritesheet('timebar', 'assets/UI/timebar.PNG', { frameWidth: 2892 / 3, frameHeight: 72 });
    this.load.spritesheet('scorebox', 'assets/UI/scorebox.PNG', { frameWidth: 2160 / 3, frameHeight: 268 });
    this.load.spritesheet('combobox', 'assets/UI/combobox.PNG', { frameWidth: 924 / 3, frameHeight: 408 });
    this.load.image('fevergauge', 'assets/UI/fevergauge.PNG');
    this.load.spritesheet('leftarrow', 'assets/UI/leftarrow.PNG', { frameWidth: 462 / 3, frameHeight: 222 });
    this.load.spritesheet('bill', 'assets/UI/bill.PNG', { frameWidth: 2736 / 3, frameHeight: 1378 });

    // 캐릭터 스프라이트 로드
    const emotions = ['normal', 'happy', 'joy', 'sad'];
    const characters = ['dowoon', 'sungjin', 'wonpil', 'youngk'];
    
    characters.forEach(char => {
        this.load.spritesheet(`${char}`, `assets/Characters/${char}.png`, { frameWidth: 1600 / 8, frameHeight: 1300 / 4});
    });
    
    // 음식 스프라이트 로드
    characters.forEach(char => {
        this.load.image(`food_${char}`, `assets/Foods/food_${char}.png`);
        this.load.image(`food_${char}_outline`, `assets/Foods/food_${char}_outline.png`);
    });
    
    // 사운드 로드
    this.load.audio('good', 'assets/Sounds/good.mp3');
    this.load.audio('bad', 'assets/Sounds/bad.mp3');
    this.load.audio('button', 'assets/Sounds/button.mp3');
    this.load.audio('bgm', 'assets/Sounds/Sun, Stay Asleep.mp3');
    this.load.audio('gameover', 'assets/Sounds/gameover.mp3');
    
    // 오프닝, 엔딩
    this.load.image('opening_pic', 'assets/opening.jfif');
    this.load.video('ending_mov', 'assets/ending.mp4');
}

// 생성
function create() {
    // UI 애니메이션
    this.anims.create({
        key: 'timebox_default',
        frames: this.anims.generateFrameNumbers('timebox', { start: 0, end: 2 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'timebar_default',
        frames: this.anims.generateFrameNumbers('timebar', { start: 0, end: 2 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'scorebox_default',
        frames: this.anims.generateFrameNumbers('scorebox', { start: 0, end: 2 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'combobox_default',
        frames: this.anims.generateFrameNumbers('combobox', { start: 0, end: 2 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'leftarrow_default',
        frames: this.anims.generateFrameNumbers('leftarrow', { start: 0, end: 2 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'bill_default',
        frames: this.anims.generateFrameNumbers('bill', { start: 0, end: 2 }),
        frameRate: 5,
        repeat: -1
    });

    // 캐릭터 애니메이션
    const emotions = ['normal', 'happy', 'joy', 'sad'];
    const characters = ['dowoon', 'sungjin', 'wonpil', 'youngk'];
    
    characters.forEach(char => {
        let emotion_idx = 0;

        emotions.forEach(emotion => {
            this.anims.create({
                key: `${char}_${emotion}`,
                frames: this.anims.generateFrameNumbers(`${char}`, { start: emotion_idx * 8, end: (emotion_idx + 1) * 8 - 1}),
                frameRate: 10,
                repeat: -1
            });

            emotion_idx += 1;
        });
    });

    // 오프닝 시퀀스 표시
    showOpening.call(this);
}

// 오프닝 표시
function showOpening() {
    const openingImage = this.add.image(540, 960, 'opening_pic');
    openingImage.setScale(Math.max(1080 / openingImage.width, 1920 / openingImage.height));
    
    // "Press Anywhere" 텍스트
    const pressText = this.add.text(540, 540, 'PRESS ANYWHERE', {
        fontFamily: 'DNFBitBitv2',
        fontSize: '72px',
        fill: '#fff',
    }).setOrigin(0.5);
    
    // 깜빡이는 효과
    this.tweens.add({
        targets: pressText,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1
    });
    
    // 화면 클릭/터치로 게임 시작
    this.input.once('pointerdown', () => {
        this.sound.play('button');
        openingImage.destroy();
        pressText.destroy();
        startGame.call(this);
    });
}

// 게임 시작
function startGame() {
    gameState.gameStarted = true;
    
    // 배경
    gameState.background = this.add.image(540, 960, 'bg_normal');
    
    // 테이블
    this.add.image(540, 960, 'tables_normal').setDepth(1);;
    
    // UI 설정
    setupUI.call(this);
    
    // 게임 초기화
    initializeGame.call(this);
    
    // 입력 설정
    setupInput.call(this);
    
    // BGM 재생
    gameState.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
    gameState.bgm.play();
    
    // 게임 타이머 시작
    gameState.gameTimer = this.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: this,
        loop: true
    });
}

// UI 설정
function setupUI() {
    // 점수판
    const scorebox = this.add.sprite(370, 300, 'scorebox').play('scorebox_default');
    gameState.scoreText = this.add.text(650, 300, '0', {
        fontFamily: 'DNFBitBitv2',
        fontSize: '100px',
        fill: '#fff',
    }).setOrigin(1, 0.5);
    
    // 시간 표시
    const timebox = this.add.sprite(540, 100, 'timebox').play('timebox_default');
    gameState.timebar = this.add.sprite(540, 100, 'timebar').play('timebar_default');
    
    // 콤보 & 피버
    const combobox = this.add.sprite(890, 370, 'combobox').play('combobox_default');
    gameState.comboText = this.add.text(925, 410, '0', {
        fontFamily: 'DNFBitBitv2',
        fontSize: '100px',
        fill: '#fff',
    }).setOrigin(1, 0.5);

    gameState.fevergauge = this.add.image(890, 370, 'fevergauge').setCrop(0, 408, 924 / 3, 408);

    // 가이드 화살표
    const leftarrow = this.add.sprite(300, 1600, 'leftarrow').play('leftarrow_default');
    const rightarrow = this.add.sprite(780, 1600, 'leftarrow').setScale(-1, 1).play('leftarrow_default');
}

// 게임 초기화
function initializeGame() {
    // 캐릭터 배치
    placeCharacters.call(this);
    
    // 음식 큐 초기화
    initializeFoodQueue.call(this);
}

// 캐릭터 배치
function placeCharacters() {
    // 기존 캐릭터 제거
    Object.values(gameState.characterSprites).forEach(sprite => {
        if(sprite) sprite.destroy();
    });
    
    gameState.leftCharacters = [];
    gameState.rightCharacters = [];
    gameState.characterSprites = {};
    
    // 난이도에 따라 캐릭터 수 결정
    const charsPerSide = gameState.difficulty;
    const availableChars = [...gameState.characters];
    
    // 왼쪽 캐릭터
    for(let i = 0; i < charsPerSide; i++) {
        const randomIndex = Phaser.Math.Between(0, availableChars.length - 1);
        const char = availableChars.splice(randomIndex, 1)[0];
        gameState.leftCharacters.push(char);
        
        const xPos = charsPerSide === 1 ? 200 : 100 + i * 180;
        const sprite = this.add.sprite(xPos, 1080, `${char}`).play(`${char}_normal`);
        sprite.setScale(1.5);
        gameState.characterSprites[`left_${i}`] = sprite;
    }
    
    // 오른쪽 캐릭터
    for(let i = 0; i < charsPerSide; i++) {
        const randomIndex = Phaser.Math.Between(0, availableChars.length - 1);
        const char = availableChars.splice(randomIndex, 1)[0];
        gameState.rightCharacters.push(char);
        
        const xPos = charsPerSide === 1 ? 880 : 780 + i * 180;
        const sprite = this.add.sprite(xPos, 1080, `${char}`).play(`${char}_normal`);
        sprite.setScale(1.5);
        sprite.setFlipX(true);
        gameState.characterSprites[`right_${i}`] = sprite;
    }    
}

// 음식 큐 초기화
function initializeFoodQueue() {
    // 기존 음식 제거
    gameState.foodSprites.forEach(sprite => sprite.destroy());
    gameState.foodSprites = [];
    gameState.foodQueue = [];
    
    // 큐 생성
    for(let i = 0; i < gameState.queueSize; i++) {
        const foodType = getRandomFood.call(this);
        gameState.foodQueue.push(foodType);
    }
    
    // 음식 스프라이트 생성
    updateFoodDisplay.call(this);
}

// 랜덤 음식 선택
function getRandomFood() {
    const allChars = [...gameState.leftCharacters, ...gameState.rightCharacters];
    
    // Fever 모드에서는 같은 음식이 나올 확률 증가
    if(gameState.isFever && gameState.foodQueue.length > 0) {
        const lastFood = gameState.foodQueue[gameState.foodQueue.length - 1];
        if(Math.random() < 0.6) { // 60% 확률로 같은 음식
            return lastFood;
        }
    }
    
    const randomIndex = Phaser.Math.Between(0, allChars.length - 1);
    return allChars[randomIndex];
}

// 음식 디스플레이 업데이트
function updateFoodDisplay() {
    if(!gameState.gameStarted || gameState.showingEnding) return;

    // 기존 스프라이트 제거
    gameState.foodSprites.forEach(sprite => sprite.destroy());
    gameState.foodSprites = [];
    
    // 컨베이어 벨트 위치
    const endY = 1400;
    const spacing = 70;
    
    // 음식 스프라이트 생성
    for(let i = Math.min(gameState.foodQueue.length, gameState.queueSize) - 1; i >= 0; i--) {
        const foodType = gameState.foodQueue[i];
        const isFirst = i === 0;
        const imageKey = isFirst ? `food_${foodType}_outline` : `food_${foodType}`;
        
        const sprite = this.add.image(540, endY - i * spacing, imageKey);
        sprite.setScale(0.8);
        
        if(isFirst) {
            // 첫 번째 음식은 강조
            sprite.setScale(0.9);
            
            // 펄스 효과
            this.tweens.add({
                targets: sprite,
                scaleX: 1,
                scaleY: 1,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
        
        gameState.foodSprites.push(sprite);
    }
}

// 입력 설정
function setupInput() {
    // 왼쪽 클릭 영역
    const leftZone = this.add.zone(0, 0, 540, 1920).setOrigin(0);
    leftZone.setInteractive();
    leftZone.on('pointerdown', () => sortFood.call(this, 'left'));
    
    // 오른쪽 클릭 영역
    const rightZone = this.add.zone(540, 0, 540, 1920).setOrigin(0);
    rightZone.setInteractive();
    rightZone.on('pointerdown', () => sortFood.call(this, 'right'));

    // 키보드 입력 설정
    gameState.cursors = this.input.keyboard.createCursorKeys();
}

// 음식 분류
function sortFood(direction) {
    if(!gameState.gameStarted || gameState.showingEnding) return;
    if(gameState.foodQueue.length === 0) return;
    
    const currentFood = gameState.foodQueue[0];
    const correctChars = direction === 'left' ? gameState.leftCharacters : gameState.rightCharacters;
    
    // 정답 확인
    const isCorrect = correctChars.includes(currentFood);
    
    if(isCorrect) {
        // 정답
        this.sound.play('good');
        gameState.score += gameState.isFever ? 30 : 10;
        gameState.combo++;
        gameState.feverCount++;
        
        // 캐릭터 표정 변경
        showCharacterEmotion.call(this, direction, currentFood, 'happy');
        
        // Fever 모드 진입 확인
        if(!gameState.isFever && gameState.feverCount >= 10) {
            enterFeverMode.call(this);
        }
        
    } else {
        // 오답
        this.sound.play('bad');
        gameState.combo = 0;
        gameState.feverCount = 0;
        gameState.timeLeft -= 5;
        updateTimer.call(this);
        
        if(gameState.isFever) {
            exitFeverMode.call(this);
        }
        
        // 캐릭터 표정 변경
        showCharacterEmotion.call(this, direction, currentFood, 'sad');
    }
    
    // 음식 제거 및 추가
    gameState.foodQueue.shift();
    gameState.foodQueue.push(getRandomFood.call(this));
    
    // UI 업데이트
    updateUI.call(this);
    updateFoodDisplay.call(this);
    
    // 난이도 증가 (점수에 따라)
    if(gameState.score >= 2000 && gameState.difficulty === 1) {
        gameState.difficulty = 2;
        placeCharacters.call(this);
        initializeFoodQueue.call(this);
    }
}

// 캐릭터 표정 표시
function showCharacterEmotion(direction, foodType, emotion) {
    const chars = direction === 'left' ? gameState.leftCharacters : gameState.rightCharacters;
    const charIndex = chars.indexOf(foodType);
    
    if(charIndex !== -1) {
        const spriteKey = `${direction}_${charIndex}`;
        const sprite = gameState.characterSprites[spriteKey];
        
        if(sprite) {
            sprite.play(`${foodType}_${emotion}`);
            
            // 일정 시간 후 normal로 복귀
            this.time.delayedCall(1000, () => {
                if(sprite.active) {
                    sprite.play(`${foodType}_normal`);
                }
            });
        }
    }
}

// Fever 모드 진입
function enterFeverMode() {
    gameState.isFever = true;
    gameState.feverTime = 15; // 15초
    gameState.feverCount = 0;
    
    // 배경 변경
    gameState.background.setTexture('bg_fever');
    
    // BGM 변경
    gameState.bgm.setRate(160/120);
    
    // Fever 타이머
    if(gameState.feverTimer) {
        gameState.feverTimer.remove();
    }
    
    gameState.feverTimer = this.time.addEvent({
        delay: 1000,
        callback: updateFeverTimer,
        callbackScope: this,
        loop: true
    });
}

// Fever 모드 종료
function exitFeverMode() {
    gameState.isFever = false;
    gameState.feverTime = 0;
    gameState.feverCount = 0;
    
    // 배경 복귀
    gameState.background.setTexture('bg_normal');
    
    // BGM 복귀
    gameState.bgm.setRate(1);
    
    // Fever 타이머 제거
    if(gameState.feverTimer) {
        gameState.feverTimer.remove();
        gameState.feverTimer = null;
    }
}

// Fever 타이머 업데이트
function updateFeverTimer() {
    gameState.feverTime--;
    
    if(gameState.feverTime <= 0) {
        exitFeverMode.call(this);
    }
}

// UI 업데이트
function updateUI() {
    // 점수 업데이트
    gameState.scoreText.setText(gameState.score.toString());

    // 콤보 업데이트
    gameState.comboText.setText(gameState.combo.toString());
    
    // 피버 게이지 업데이트
    const feverProgress = Math.min(gameState.feverCount / 10, 1);
    gameState.fevergauge.setCrop(0, 408 - 408 * feverProgress, 924 / 3, 408);
}

// 게임 타이머 업데이트
function updateTimer() {
    gameState.timeLeft--;
    gameState.timebar.setCrop(0, 0, 2892 / 3 * (gameState.timeLeft / 60), 72);
    
    if(gameState.timeLeft <= 0) {
        endGame.call(this);
    }
}

// 게임 종료
function endGame() {
    // 타이머 정지
    if(gameState.gameTimer) {
        gameState.gameTimer.remove();
    }
    if(gameState.feverTimer) {
        gameState.feverTimer.remove();
    }
    
    // BGM 정지
    gameState.bgm.stop();
    this.sound.play('gameover');

    showEnding.call(this);
}

// 엔딩 표시
function showEnding() {
    gameState.showingEnding = true;
    
    // 모든 게임 오브젝트 숨기기
    this.children.list.forEach(child => {
        child.setVisible(false);
    });
    
    // 엔딩 영상 재생
    const endingVideo = this.add.video(540, 960, 'ending_mov');
    endingVideo.play(false);
    
    // 영상이 끝나면 결과 화면 표시
    endingVideo.on('complete', () => {
        endingVideo.destroy();
        showGameOverScreen.call(this);
    });
}

// 게임 오버 화면 표시
function showGameOverScreen() {
    this.add.image(540, 960, 'bg_fever');
    const bill = this.add.sprite(540, 960, 'bill').play('bill_default');
    
    const gameOverText = this.add.text(540, 800, 'GAME OVER', {
        fontFamily: 'DNFBitBitv2',
        fontSize: '72px',
        fill: '#222222',
    }).setOrigin(0.5);
    
    const finalScoreText = this.add.text(540, 920, `Final Score: ${gameState.score}`, {
        fontFamily: 'DNFBitBitv2',
        fontSize: '72px',
        fill: '#222222',
    }).setOrigin(0.5);
    
    const restartButton = this.add.text(540, 1100, 'RESTART', {
        fontFamily: 'DNFBitBitv2',
        fontSize: '48px',
        fill: '#222222',
    }).setOrigin(0.5);
    
    restartButton.setInteractive({ useHandCursor: true });
    
    // 호버 효과
    restartButton.on('pointerover', () => {
        restartButton.setScale(1.1);
    });
    
    restartButton.on('pointerout', () => {
        restartButton.setScale(1);
    });
    
    // 재시작
    restartButton.on('pointerdown', () => {
        location.reload(true);
    });
}

// 업데이트
function update() {
    // 키보드 입력 처리
    if(gameState.gameStarted && !gameState.showingEnding && gameState.cursors) {
        // 왼쪽 방향키
        if(Phaser.Input.Keyboard.JustDown(gameState.cursors.left)) {
            sortFood.call(this, 'left');
        }
        
        // 오른쪽 방향키
        if(Phaser.Input.Keyboard.JustDown(gameState.cursors.right)) {
            sortFood.call(this, 'right');
        }
    }
}
