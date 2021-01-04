var canvas = null;
var context = null;
var level = {};
var healthBar = {};
var hero = {};
var badGuys = [];
var myAnimation = null;
var boundsData = null; // image data for the boundary map
var images = {}; // hash of images
var leftKeyup = true;
var rightKeyup = true;
var state = states.INIT;

// ========================================= INITIALIZE =========================================

window.onload = function(){
    canvas = document.getElementById("myCanvas");
    context = canvas.getContext("2d");
    
    addKeyboardListeners();
    
    var sources = {
        levelBounds: "img/level_bounds.png",
        level: "img/level.png",
        heroSprites: "img/hero_sprites.png",
        heroHitSprites: "img/hero_hit_sprites.png",
        badGuySprites: "img/bad_guy_sprites.png",
        badGuyHitSprites: "img/bad_guy_hit_sprites.png",
        background: "img/background.png",
        readyScreen: "img/readyScreen.png",
        gameoverScreen: "img/gameoverScreen.png",
        winScreen: "img/winScreen.png"
    };
    
    loadImages(sources, function(){
        initGame();
    });
};

function loadImages(sources, callback){
    var loadedImages = 0;
    var numImages = 0;
    for (var src in sources) {
        numImages++;
        images[src] = new Image();
        images[src].onload = function(){
            if (++loadedImages >= numImages) {
                callback();
            }
        };
        images[src].src = sources[src];
    }
}

function setBoundsData(){
    canvas.width = 6944;
    context.drawImage(images.levelBounds, 0, 0);
    imageData = context.getImageData(0, 0, 6944, 600);
    boundsData = imageData.data;
    canvas.width = 900;
}

function initGame(){
    initLevel();
    initHero();
    initBadGuys();
    initHealthBar();
    
    // instantiate new animation object
    myAnimation = new Animation(canvas);
    
    // set updateStage method
    myAnimation.setUpdateStage(function(){
        updateStage();
    });
    
    // set drawStage method
    myAnimation.setDrawStage(function(){
        drawStage();
    });
    
    setBoundsData();
    
    // game is now ready to play
    state = states.READY;
    drawScreen(images.readyScreen);
}

function initHealthBar(){
    healthBar = new HealthBar({
        maxHealth: hero.maxHealth,
        x: 10,
        y: 10,
        maxWidth: 150,
        height: 20
    });
}

function initLevel(){
    level = new Level({
        x: 0,
        y: 0,
        leftBounds: 100,
        rightBounds: 500
    });
}

function initHero(){
    // initialize Hero
    var heroMotions = {
        STANDING: {
            index: 0,
            numSprites: 5,
            loop: true
        },
        AIRBORN: {
            index: 1,
            numSprites: 5,
            loop: false
        },
        RUNNING: {
            index: 2,
            numSprites: 6,
            loop: true
        },
        ATTACKING: {
            index: 3,
            numSprites: 5,
            loop: false
        }
    };
    
    hero = new Player({
        normalSpriteSheet: images.heroSprites,
        hitSpriteSheet: images.heroHitSprites,
        x: 30,
        y: 381,
        playerSpeed: 300,
        motions: heroMotions,
        startMotion: heroMotions.STANDING,
        facingRight: true,
        moving: false,
        frameRate: 7,
        posRelativeToLevel: false,
        maxHealth: 3
    });
}

function initBadGuys(){
    // notice that AIRBORN and RUNNING
    // both use the same sprite animation
    var badGuyMotions = {
        RUNNING: {
            index: 0,
            numSprites: 6,
            loop: true
        },
        AIRBORN: {
            index: 0,
            numSprites: 4,
            loop: false
        },
        ATTACKING: {
            index: 1,
            numSprites: 4,
            loop: false
        }
    };
    
    var badGuyStartX = [600, 1460, 2602, 3000, 6402, 6602];
    
    for (var n = 0; n < badGuyStartX.length; n++) {
        badGuys.push(new Player({
            normalSpriteSheet: images.badGuySprites,
            hitSpriteSheet: images.badGuyHitSprites,
            x: badGuyStartX[n],
            y: 381,
            playerSpeed: 100,
            motions: badGuyMotions,
            startMotion: badGuyMotions.RUNNING,
            facingRight: true,
            moving: true,
            frameRate: 10,
            posRelativeToLevel: true,
            maxHealth: 3
        }));
    }
}

// ========================================= GAME ENGINE =========================================

function addKeyboardListeners(){
    document.onkeydown = function(evt){
        handleKeydown(evt);
    };
    document.onkeyup = function(evt){
        handleKeyup(evt);
    };
}

function handleKeyup(evt){
    keycode = ((evt.which) || (evt.keyCode));
    
    switch (keycode) {
        case 37: // left 
            leftKeyup = true;
            if (leftKeyup && rightKeyup) {
                hero.stop();
            }
            break;
            
        case 38: // up
            break;
            
        case 39: // right
            rightKeyup = true;
            if (leftKeyup && rightKeyup) {
                hero.stop();
            }
            break;
    }
}

function handleKeydown(evt){
    keycode = ((evt.which) || (evt.keyCode));
    switch (keycode) {
        case 13: // enter
            if (state == states.READY) {
                state = states.PLAYING;
                // start animation
                myAnimation.start();
            }
            else if (state == states.GAMEOVER || state == states.WON) {
                resetGame();
                state = states.PLAYING;
            }
            break;
        case 37: // left 
            leftKeyup = false;
            hero.moveLeft();
            break;
            
        case 38: // up
            hero.jump();
            break;
            
        case 39: // right
            rightKeyup = false;
            hero.moveRight();
            break;
            
        case 65: // A [attack] key
            hero.attack();
            setTimeout(function(){
                for (var n = 0; n < badGuys.length; n++) {
                    (function(){
                        var thisBadGuy = badGuys[n];
                        if (hero.nearby(thisBadGuy)) {
                            thisBadGuy.damage();
                        }
                    })();
                }
            }, Constants.attackInterval);
            break;
    }
}

function drawStage(){
    if (state == states.PLAYING || state == states.GAMEOVER || state == states.WON) {
        level.draw();
        for (var n = 0; n < badGuys.length; n++) {
            var thisBadGuy = badGuys[n];
            thisBadGuy.draw();
        }
        hero.draw();
        healthBar.draw();
        
        if (state == states.GAMEOVER) {
            drawScreen(images.gameoverScreen);
        }
        else if (state == states.WON) {
            drawScreen(images.winScreen);
        }
    }
    else if (state == states.READY) {
        drawScreen(images.readyScreen);
    }
}

function updateStage(){
    // if player's health goes to zero, then set state to GAMEOVER
    if (hero.health == 0 && states.PLAYING) {
        state = states.GAMEOVER;
    }
    
    // if all bad guys defeated, change state to WON
    if (allBadGuysDefeated()) {
        state = states.WON;
    }
    
    handleAI();
    level.update();
    hero.update();
    healthBar.setHealth(hero.health);
    
    // if hero falls into a hole
    if (hero.y > canvas.height - hero.spriteSize * 2 / 3) {
        hero.health = 0;
    }
}

function handleAI(){
    for (var n = 0; n < badGuys.length; n++) {
        var thisBadGuy = badGuys[n];
        
		// check if this bad guy can attack hero
        if (thisBadGuy.alive && hero.alive && !thisBadGuy.attacking && thisBadGuy.canAttack && thisBadGuy.nearby(hero)) {
            thisBadGuy.attack();
            setTimeout(function(){
                hero.damage();
            }, Constants.attackInterval);
        }
        thisBadGuy.update();
        
		// control bad guy movement
        if (thisBadGuy.alive) {
            if (thisBadGuy.isFacingRight()) {
                thisBadGuy.x += 5;
                if (!thisBadGuy.getZone().inBounds) {
                    thisBadGuy.facingRight = false;
                }
                thisBadGuy.x -= 5;
            }
            
            else {
                thisBadGuy.x -= 5;
                if (!thisBadGuy.getZone().inBounds) {
                    thisBadGuy.facingRight = true;
                }
                thisBadGuy.x += 5;
            }
        }
    }
}

function drawScreen(screenImg){
    context.drawImage(screenImg, 0, 0, canvas.width, canvas.height);
}

function resetGame(){
    level = {};
    hero = {};
    badGuys = [];
    healthBar = {};
    
    initLevel();
    initHero();
    initBadGuys();
    initHealthBar();
}

function allBadGuysDefeated(){
    for (var n = 0; n < badGuys.length; n++) {
        if (badGuys[n].alive) {
            return false;
        }
    }
    return true;
}
