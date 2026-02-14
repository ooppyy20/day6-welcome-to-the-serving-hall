// API 설정 (구글 폼 및 시트 URL을 여기에 입력하세요)
const API_CONFIG = {
    FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSedkgqcVKUXZbW64qAon3xzAnMDeECvHScQO4yEEEgWltlIIQ/formResponse', // 구글 폼 제출 URL
    SHEET_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTS1t7Q4XpK2ISwW7yuy2R4GzDVvY9PaHaOW-yOAodVixvfPn14MUdsUYyg6INGxz-n5dh68HpCqzvr/pub?output=csv', // 구글 시트 CSV 내보내기 URL
    ENTRY_NICK: 'entry.1963889324', // 구글 폼의 닉네임 필드 entry ID
    ENTRY_SCORE: 'entry.1300941228' // 구글 폼의 점수 필드 entry ID
};

// 게임 설정
const config = {
    type: Phaser.CANVAS,
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
    backgroundColor: '#000000',
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
    availableChars: ['dowoon', 'sungjin', 'wonpil', 'youngk'],
    leftCharacters: [],
    rightCharacters: [],
    
    // 음식 큐
    foodQueue: [],
    queueSize: 8,
    
    // 게임 오브젝트
    foodSprites: [],
    characterSprites: {},
    
    // UI 요소
    fontColorDark: '#584847',
    fontColorLight: '#FFFFE6',
    scoreText: null,
    comboText: null,
    timebar: null,
    fevergauge: null,
    
    // 타이머
    gameTimer: null,
    feverTimer: null,

    // 키보드 입력
    cursors: null,
    
    // 리더보드 관련
    leaderboardData: [],
    isSubmittingScore: false
};

// 프리로드
function preload() {
    // 배경
    this.load.image('bg_normal', 'assets/UI/Background_normal.jfif');
    this.load.image('bg_fever', 'assets/UI/Background_fever.jfif');
    this.load.image('opening_pic', 'assets/opening.jfif');
    
    // UI 요소
    this.load.image('tables_normal', 'assets/UI/Tables_normal.png');
    this.load.image('tables_fever', 'assets/UI/Tables_fever.png');
    this.load.image('ui', 'assets/UI/UI.PNG');
    this.load.image('title', 'assets/UI/title.PNG');
    this.load.image('timebar', 'assets/UI/timebar.PNG');
    this.load.image('fevergauge', 'assets/UI/fevergauge.PNG');
    this.load.spritesheet('bill', 'assets/UI/Bill.PNG', { frameWidth: 2736 / 3, frameHeight: 1378 });

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
}

// 생성
function create() {
    // UI 애니메이션
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

            emotion_idx ++;
        });
    });

    // 오프닝 시퀀스 표시
    showOpening.call(this);
}

// 오프닝 표시
function showOpening() {
    const openingImage = this.add.image(540, 960, 'opening_pic');
    const title = this.add.image(540, 500, 'title');

    // 확대 효과
    this.tweens.add({
        targets: title,
        scale: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1
    });
   
    // "Press Anywhere" 텍스트
    const pressText = this.add.text(540, 1550, 'PRESS ANYWHERE', {
        fontFamily: 'DNFBitBitv2',
        fontSize: '75px',
        fill: gameState.fontColorLight,
    }).setOrigin(0.5);
    
    // 깜빡이는 효과
    this.tweens.add({
        targets: pressText,
        alpha: 0.3,
        duration: 400,
        yoyo: true,
        repeat: -1
    });
    
    // 화면 클릭/터치로 게임 시작
    this.input.once('pointerdown', () => {
        this.sound.play('button', {volume: 0.3});
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
    gameState.tables = this.add.image(540, 960, 'tables_normal').setDepth(1);
    
    // UI 설정
    setupUI.call(this);
    
    // 게임 초기화
    initializeGame.call(this);
    
    // 입력 설정
    setupInput.call(this);
    
    // BGM 재생
    gameState.bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });
    gameState.bgm.play();
    
    // 게임 타이머 시작
    gameState.gameTimer = this.time.addEvent({
        delay: 10,
        callback: updateTimer,
        callbackScope: this,
        loop: true
    });
}

// UI 설정
function setupUI() {
    // UI 표시
    const ui = this.add.image(540, 960, 'ui').setDepth(2);
    
    // 동적 요소 표시
    gameState.timebar = this.add.image(539, 1785, 'timebar').setDepth(2);
    gameState.fevergauge = this.add.image(907, 500, 'fevergauge').setCrop(0, 0, 0, 57).setDepth(2); // 226 x 57

    gameState.scoreText = this.add.text(660, 450, '0', {
        fontFamily: 'DNFBitBitv2',
        fontSize: '100px',
        fill: gameState.fontColorDark,
    }).setOrigin(1, 0.5).setDepth(2);

    gameState.comboText = this.add.text(905, 410, '0', {
        fontFamily: 'DNFBitBitv2',
        fontSize: '100px',
        fill: gameState.fontColorDark,
    }).setOrigin(0.5, 0.5).setDepth(2);
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
    // 난이도에 따라 캐릭터 수 결정
    const charsPerSide = gameState.difficulty;
    
    // 난이도 2일 때 기존 캐릭터 위치 조정
    if(charsPerSide === 2) {
        // 기존 왼쪽 캐릭터 이동
        if(gameState.characterSprites['left_0']) {
            gameState.characterSprites['left_0'].x = 100;
        }
        // 기존 오른쪽 캐릭터 이동
        if(gameState.characterSprites['right_0']) {
            gameState.characterSprites['right_0'].x = 780;
        }
    }
    
    // 이미 배치된 캐릭터 수 확인
    const leftCount = gameState.leftCharacters.length;
    const rightCount = gameState.rightCharacters.length;
    
    // 왼쪽에 추가 캐릭터가 필요한 경우
    if(leftCount < charsPerSide && gameState.availableChars.length > 0) {
        const randomIndex = Phaser.Math.Between(0, gameState.availableChars.length - 1);
        const char = gameState.availableChars.splice(randomIndex, 1)[0];
        
        const xPos = charsPerSide === 1 ? 200 : 280;
        const sprite = this.add.sprite(xPos, 1080, `${char}`).play(`${char}_normal`);
        if(gameState.isFever)
            sprite.play(`${char}_joy`);
        sprite.setScale(1.5);
        gameState.characterSprites[`left_${leftCount}`] = sprite;
        gameState.leftCharacters.push(char);
    }
    
    // 오른쪽에 추가 캐릭터가 필요한 경우
    if(rightCount < charsPerSide && gameState.availableChars.length > 0) {
        const randomIndex = Phaser.Math.Between(0, gameState.availableChars.length - 1);
        const char = gameState.availableChars.splice(randomIndex, 1)[0];
        
        const xPos = charsPerSide === 1 ? 880 : 960;
        const sprite = this.add.sprite(xPos, 1080, `${char}`).play(`${char}_normal`);
        if(gameState.isFever)
            sprite.play(`${char}_joy`);
        sprite.setScale(1.5);
        gameState.characterSprites[`right_${rightCount}`] = sprite;
        gameState.rightCharacters.push(char);
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
        this.sound.play('good', {volume: 0.3});
        gameState.score += gameState.isFever ? 100 : 50;
        gameState.combo++;
        gameState.feverCount++;
        gameState.timeLeft += 0.1;
        
        // 캐릭터 표정 변경
        if(gameState.isFever) {
            // 피버 모드: 이미 joy 재생 중이므로 아무것도 안 함
        } else {
            // 일반 모드: 해당 음식의 당사자만 happy
            showCharacterEmotionByFood.call(this, direction, currentFood, 'happy');
        }
        
        // Fever 모드 진입 확인
        if(!gameState.isFever && gameState.feverCount >= 10) {
            enterFeverMode.call(this);
        }
        
    } else {
        // 오답
        this.sound.play('bad', {volume: 0.3});
        gameState.combo = 0;
        gameState.feverCount = 0;
        gameState.timeLeft -= 5;
        
        // 캐릭터 표정 변경
        if(gameState.isFever) {
            // 피버 모드 종료 (이때만 표정이 바뀜)
            exitFeverMode.call(this);
        } else {
            // 일반 모드: 잘못 받은 테이블의 사람들만 sad
            showCharacterEmotionByDirection.call(this, direction, 'sad');
        }
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
function showCharacterEmotionByFood(direction, foodType, emotion) {
    const chars = direction === 'left' ? gameState.leftCharacters : gameState.rightCharacters;
    const charIndex = chars.indexOf(foodType);
    
    if(charIndex !== -1) {
        const spriteKey = `${direction}_${charIndex}`;
        const sprite = gameState.characterSprites[spriteKey];
        
        if(sprite) {
            sprite.play(`${foodType}_${emotion}`);
            
            // 일정 시간 후 normal로 복귀 (실행 시점에 상태 체크)
            this.time.delayedCall(2000, () => {
                // 피버 모드가 아니고, 스프라이트가 살아있을 때만 복귀
                if(sprite.active && !gameState.isFever) {
                    sprite.play(`${foodType}_normal`);
                }
            });
        }
    }
}

function showCharacterEmotionByDirection(direction, emotion) {
    const chars = direction === 'left' ? gameState.leftCharacters : gameState.rightCharacters;
    
    for(let char of chars) {
        const charIndex = chars.indexOf(char);
        const spriteKey = `${direction}_${charIndex}`;
        const sprite = gameState.characterSprites[spriteKey];
        
        if(sprite) {
            const targetAnim = `${char}_${emotion}`;
            
            // 이미 해당 애니메이션이 재생 중이면 스킵
            if(sprite.anims.currentAnim && sprite.anims.currentAnim.key === targetAnim) {
                continue;
            }
            
            sprite.play(targetAnim);

            // normal이 아닌 경우에만 타이머 설정 (실행 시점에 상태 체크)
            if(emotion !== 'normal') {
                this.time.delayedCall(2000, () => {
                    // 피버 모드가 아니고, 스프라이트가 살아있을 때만 복귀
                    if(sprite.active && !gameState.isFever) {
                        sprite.play(`${char}_normal`);
                    }
                });
            }
        }
    }
}

// Fever 모드 진입
function enterFeverMode() {
    gameState.isFever = true;
    gameState.feverTime = 15; // 15초
    
    // 배경 변경
    gameState.background.setTexture('bg_fever');

    // 테이블 변경
    gameState.tables.setTexture('tables_fever');
    
    // BGM 변경
    gameState.bgm.setRate(160/120);
    
    // 모든 캐릭터 joy 표정으로 변경
    showCharacterEmotionByDirection.call(this, 'left', 'joy');
    showCharacterEmotionByDirection.call(this, 'right', 'joy');
    
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

    // 테이블 복귀
    gameState.tables.setTexture('tables_normal');
    
    // BGM 복귀
    gameState.bgm.setRate(1);
    
    // Fever 타이머 제거
    if(gameState.feverTimer) {
        gameState.feverTimer.remove();
        gameState.feverTimer = null;
    }

    // 캐릭터 표정 normal로 복귀
    showCharacterEmotionByDirection.call(this, 'left', 'normal');
    showCharacterEmotionByDirection.call(this, 'right', 'normal');
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
    const feverProgress = Math.min(Math.floor(gameState.feverCount / 2) * 0.2, 1);
    gameState.fevergauge.setCrop(0, 0, 226 * feverProgress, 57);
}

// 게임 타이머 업데이트
function updateTimer() {
    gameState.timeLeft -= 0.01;
    gameState.timebar.setCrop(0, 0, 2892 / 3 * (gameState.timeLeft / 60), 72);
    
    // 시간 종료
    if(gameState.timeLeft <= 0) {
        gameState.timeLeft = 0; // 정확히 0으로 설정
        endGame.call(this);
    }
}

// 게임 종료
function endGame() {
    // 이미 종료 중이면 무시
    if (gameState.showingEnding) return;
    
    gameState.showingEnding = true;
    
    // 타이머 정지
    if(gameState.gameTimer) {
        gameState.gameTimer.remove();
        gameState.gameTimer = null;
    }
    if(gameState.feverTimer) {
        gameState.feverTimer.remove();
        gameState.feverTimer = null;
    }
    
    // BGM 정지
    gameState.bgm.stop();
    this.sound.play('gameover', {volume: 0.3});

    showEnding.call(this);
}

// 엔딩 표시
function showEnding() {    
    // 모든 게임 오브젝트 숨기기
    this.children.list.forEach(child => {
        child.setVisible(false);
    });
    
    showGameOverScreen.call(this);
}

// 게임 오버 화면 표시
function showGameOverScreen() {
    this.add.image(540, 960, 'bg_fever');
    const bill = this.add.sprite(540, 960, 'bill').play('bill_default');
        
    // 리더보드 섹션
    const leaderboardTitle = this.add.text(540, 450, `--------------------\n** RECEIPT **\n--------------------`, {
        fontFamily: 'DNFBitBitv2',
        fontSize: '48px',
        fill: gameState.fontColorDark,
        align: 'center',
    }).setOrigin(0.5);
    
    // 리더보드 컨테이너
    const leaderboardContainer = this.add.container(540, 580);
    gameState.leaderboardContainer = leaderboardContainer;
    
    // 초기 로딩 메시지
    const loadingText = this.add.text(0, 0, '점수 가져오는 중...', {
        fontFamily: 'DNFBitBitv2',
        fontSize: '48px',
        fill: gameState.fontColorDark,
    }).setOrigin(0.5);
    leaderboardContainer.add(loadingText);
    
    // 리더보드 로드
    loadLeaderboard.call(this);

    // 최종 점수
    const finalScoreText = this.add.text(540, 1300, `--------------------\n${gameState.score.toLocaleString()} \n\n\n--------------------`, {
        fontFamily: 'DNFBitBitv2',
        fontSize: '48px',
        fill: gameState.fontColorDark,
        align: 'right',
    }).setOrigin(0.5);
    
    // 플레이어 이름 입력
    let showCursor = true;
    const nicknameInput = this.add.text(243, 1239, `닉네임 입력`, {
        fontFamily: 'DNFBitBitv2',
        fontSize: '48px',
        fill: gameState.fontColorDark,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    const nicknameEvent = this.time.addEvent({
        delay: 500,
        loop: true,
        callback: () => {
            nicknameInput.setColor(showCursor ? gameState.fontColorDark : gameState.fontColorLight);
            nicknameInput.setBackgroundColor(showCursor ? null : gameState.fontColorDark);

            showCursor = !showCursor;
        }
    });

    nicknameInput.on('pointerdown', async () => {
        getNickname((nickname) => {
            if(!nickname || nickname == '') {
                nicknameInput.setText('닉네임 입력');
            } else {
                nickname = nickname.slice(0, 8);
                localStorage.setItem("day6_wttd_nickname", nickname);
                nicknameInput.setText(nickname);
            }
        });
    });
    
    // 제출 버튼
    const submitButton = this.add.text(540, 1350, '> 점수 등록하기 <', {
        fontFamily: 'DNFBitBitv2',
        fontSize: '48px',
        fill: gameState.fontColorDark,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    // 버튼 호버 효과
    submitButton.on('pointerover', () => {
        submitButton.setScale(1.1);
    });
    
    submitButton.on('pointerout', () => {
        submitButton.setScale(1);
    });
    
    // 점수 제출
    submitButton.on('pointerdown', async () => {
        let nickname = localStorage.getItem("day6_wttd_nickname");
        if (!nickname || nickname == '') {
            const now = new Date();

            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');

            nickname = `마데_${hh}:${mm}`;
            localStorage.setItem("day6_wttd_nickname", nickname);
        }
        
        if (gameState.isSubmittingScore) return;
        
        gameState.isSubmittingScore = true;
        submitButton.setText('점수 등록 중...');
        submitButton.disableInteractive();
        
        const success = await submitScore(nickname, gameState.score);
        
        if (success) {
            submitButton.destroy();
            nicknameEvent.remove();
            nicknameInput.setText(localStorage.getItem("day6_wttd_nickname"));
            nicknameInput.disableInteractive();
            nicknameInput.setColor(gameState.fontColorDark);
            nicknameInput.setBackgroundColor(null);

            await loadLeaderboard.call(this);
        } else {
            submitButton.setText('> 점수 등록하기 <');
            submitButton.setInteractive({ useHandCursor: true });
            gameState.isSubmittingScore = false;
        }
    });
    
    // 재시작 버튼
    const restartButton = this.add.text(540, 1500, '> 다시하기 <', {
        fontFamily: 'DNFBitBitv2',
        fontSize: '48px',
        fill: gameState.fontColorDark,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    restartButton.on('pointerover', () => {
        restartButton.setScale(1.1);
    });
    
    restartButton.on('pointerout', () => {
        restartButton.setScale(1);
    });
    
    restartButton.on('pointerdown', () => {
        // HTML 요소 정리
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => input.parentElement?.remove());
        location.reload(true);
    });
}

function getNickname(callback) {
  const nickname = prompt("닉네임을 입력해 주세요. (8자 이하)\n캐시로 인해 최신 점수판이 바로 조회되지 않을 수 있습니다.");
  callback(nickname); // 입력된 값을 인자로 콜백 호출
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

// ============== 리더보드 API 함수들 ==============

// 점수 제출
async function submitScore(nickname, score) {
    try {
        const body = new URLSearchParams({
            [API_CONFIG.ENTRY_NICK]: nickname,
            [API_CONFIG.ENTRY_SCORE]: score
        });
        
        await fetch(API_CONFIG.FORM_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: body
        });
        
        return true;
    } catch (error) {
        console.error('점수 제출 실패:', error);
        alert('점수 제출에 실패했습니다. 다시 시도해 주세요.');
        return false;
    }
}

// 리더보드 로드
async function loadLeaderboard() {
    if (!gameState.leaderboardContainer) return;
    
    gameState.leaderboardContainer.removeAll(true);
    
    const loadingText = this.add.text(0, 0, '점수 가져오는 중...', {
        fontFamily: 'DNFBitBitv2',
        fontSize: '48px',
        fill: gameState.fontColorDark,
    }).setOrigin(0.5);
    gameState.leaderboardContainer.add(loadingText);
    
    try {
        // 캐시 무효화 (헤더 없이)
        const cacheBuster = `&_=${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const url = API_CONFIG.SHEET_URL + cacheBuster;
        
        // ✅ 헤더 제거, cache 옵션만 사용
        const response = await fetch(url, {
            cache: 'no-store'
        });
        
        const csvText = await response.text();
        
        // 오늘 날짜 구하기
        const today = new Date();
        const todayString = `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}`;
        
        const rows = csvText.split('\n').slice(1);
        const data = rows
            .map(row => {
                const columns = row.replace(/["\r]/g, '').split(',');
                if (columns.length < 3) return null;
                
                const timestamp = columns[0];
                
                // 수정된 정규식: "오전/오후" 앞까지만 매칭
                const dateMatch = timestamp.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
                
                if (!dateMatch) {
                    console.log('매칭 실패:', timestamp); // 디버깅용
                    return null;
                }
                
                const rowDate = `${dateMatch[1]}. ${parseInt(dateMatch[2])}. ${parseInt(dateMatch[3])}`;
                                
                // 오늘 날짜와 일치하는 데이터만 필터링
                if (rowDate !== todayString) return null;
                
                return {
                    nickname: columns[1],
                    score: parseInt(columns[2]),
                    timestamp: timestamp
                };
            })
            .filter(item => item && !isNaN(item.score))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        
        gameState.leaderboardData = data;
        renderLeaderboard.call(this, data);
        
    } catch (error) {
        console.error('점수판 로딩 실패:', error);
        gameState.leaderboardContainer.removeAll(true);
        const errorText = this.add.text(0, 0, '점수판 로딩 실패', {
            fontFamily: 'DNFBitBitv2',
            fontSize: '48px',
            fill: gameState.fontColorDark,
        }).setOrigin(0.5);
        gameState.leaderboardContainer.add(errorText);
    }
}

// 리더보드 렌더링
function renderLeaderboard(data) {
    if (!gameState.leaderboardContainer) return;
    
    gameState.leaderboardContainer.removeAll(true);
    
    if (data.length === 0) {
        const emptyText = this.add.text(0, 0, '오늘은 아직 기록이 없어요!', {
            fontFamily: 'DNFBitBitv2',
            fontSize: '48px',
            fill: gameState.fontColorDark,
        }).setOrigin(0.5);
        gameState.leaderboardContainer.add(emptyText);
        return;
    }
    
    // 리더보드 항목들 생성
    data.forEach((item, index) => {
        const yPos = index * 60; // 10개 항목을 세로로 배치
        
        // 닉네임
        const nicknameText = this.add.text(-300, yPos, `${item.nickname}`, {
            fontFamily: 'DNFBitBitv2',
            fontSize: '48px',
            fill: gameState.fontColorDark,
        }).setOrigin(0, 0.5);
                
        // 점수
        const scoreText = this.add.text(300, yPos, `${item.score.toLocaleString()}`, {
            fontFamily: 'DNFBitBitv2',
            fontSize: '48px',
            fill: gameState.fontColorDark,
            align: 'left',
        }).setOrigin(1, 0.5);

        gameState.leaderboardContainer.add([nicknameText, scoreText]);
    });
}