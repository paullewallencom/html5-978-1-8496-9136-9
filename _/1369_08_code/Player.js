function Player(config){
    this.normalSpriteSheet = config.normalSpriteSheet;
    this.hitSpriteSheet = config.hitSpriteSheet;
    this.x = config.x;
    this.y = config.y;
    this.playerSpeed = config.playerSpeed; // px / s
    this.motions = config.motions;
    this.startMotion = config.startMotion;
    this.facingRight = config.facingRight;
    this.moving = config.moving;
    this.frameRate = config.frameRate;
    this.posRelativeToLevel = config.posRelativeToLevel;
    this.maxHealth = config.maxHealth;
    
    this.spriteSheet = this.normalSpriteSheet;
    this.vx = 0;
    this.vy = 0;
    this.spriteSize = 144;
    this.spriteSeq = 0;
    this.motion = this.startMotion;
    this.lastMotion = this.motion;
    this.airborn = false;
    this.attacking = false;
    this.canAttack = true;
    this.health = this.maxHealth;
    this.alive = true;
    this.opacity = 1;
}

Player.prototype.attack = function(){
    this.attacking = true;
    this.canAttack = false;
    var that = this;
    setTimeout(function(){
        that.canAttack = true;
    }, Constants.attackInterval);
};

Player.prototype.stop = function(){
    this.moving = false;
};

Player.prototype.isFacingRight = function(){
    return this.facingRight;
};

Player.prototype.moveRight = function(){
    this.moving = true;
    this.facingRight = true;
};

Player.prototype.moveLeft = function(){
    this.moving = true;
    this.facingRight = false;
};

Player.prototype.jump = function(){
    if (!this.airborn) {
        this.airborn = true;
        this.vy = -1;
    }
};

Player.prototype.draw = function(){
    var sourceX = this.spriteSeq * this.spriteSize;
    var sourceY = this.motion.index * this.spriteSize;
    
    context.save();
    
    if (this.posRelativeToLevel) {
        context.translate(this.x + level.x, this.y);
    }
    else {
        context.translate(this.x, this.y);
    }
    
    if (this.facingRight) {
        context.translate(this.spriteSize, 0);
        context.scale(-1, 1);
    }
    
    context.globalAlpha = this.opacity;
    context.drawImage(this.spriteSheet, sourceX, sourceY, this.spriteSize, this.spriteSize, 0, 0, this.spriteSize, this.spriteSize);
    context.restore();
};

Player.prototype.fade = function(){
    this.opacity -= 0.02;
    if (this.opacity < 0) {
        this.opacity = 0;
    }
};

Player.prototype.update = function(){

    if (this.alive) {
        if (this.health <= 0) {
            this.alive = false;
        }
        else {
            // handle gravity (+y)
            var speedIncrementEachFrame = Constants.gravity * myAnimation.getTimeInterval() / 1000; // pixels / second
            this.vy += speedIncrementEachFrame;
            
            // handle levitation (-y)
            if (this.getZone().levitating) {
                this.vy = (65 - this.y) / 200;
            }
            
            // update y position
            var oldY = this.y;
            this.y += this.vy * myAnimation.getTimeInterval();
            
            // determine if airborn
            if (this.getZone().inBounds) {
                this.airborn = true;
            }
            // set y position
            else {
                this.y = oldY;
                
                // handle case where player has fallen to the ground
                // if vy is less than zero, this means the player has just
                // hit the ceiling, in which case we can simply leave
                // this.y as oldY to prevent the player from going
                // past the celing
                if (this.vy > 0) {
                    while (this.getZone().inBounds) {
                        this.y++;
                    }
                    this.y--;
                    this.vy = 0;
                    this.airborn = false;
                }
            }
            
            // set x position
            var oldX = this.x;
            if (this.moving) {
                if (this.facingRight) {
                    this.x += this.playerSpeed * (myAnimation.getTimeInterval() / 1000);
                }
                else {
                    this.x -= this.playerSpeed * (myAnimation.getTimeInterval() / 1000);
                }
            }
            
            if (!this.getZone().inBounds) {
                this.x = oldX;
                
                while (this.getZone().inBounds) {
                    if (this.facingRight) {
                        this.x++;
                    }
                    else {
                        this.x--;
                    }
                }
                
                // reposition to nearest placement in bounds
                if (this.facingRight) {
                    this.x--;
                }
                else {
                    this.x++;
                }
            }
            
            if (this.attacking && this.spriteSeq == this.motion.numSprites - 1) {
                this.attacking = false;
            }
            
            this.setSpriteMotion();
        }
    }
    else {
        if (this.opacity > 0) {
            this.fade();
        }
    }
};

Player.prototype.setSpriteMotion = function(){
    if (this.attacking) {
        this.motion = this.motions.ATTACKING;
    }
    else {
        if (this.airborn) {
            this.motion = this.motions.AIRBORN;
        }
        else {
            this.vy = 0;
            if (this.moving) {
                this.motion = this.motions.RUNNING;
            }
            else {
                this.motion = this.motions.STANDING;
            }
        }
    }
    
    // update sprite seq num
    if (myAnimation.getFrame() % this.frameRate === 0) {
        if (this.spriteSeq < this.motion.numSprites - 1) {
            this.spriteSeq++;
        }
        else {
            if (this.motion.loop) {
                this.spriteSeq = 0;
            }
        }
    }
    
    if (this.motion != this.lastMotion) {
        this.spriteSeq = 0;
        this.lastMotion = this.motion;
    }
};

/**
 * returns position of player x relative to level
 */
Player.prototype.getPlayerX = function(){
    return this.posRelativeToLevel ? this.x : this.x - level.x;
};

Player.prototype.getZone = function(){
    var thisX = Math.round(this.getPlayerX()) + this.spriteSize / 2;
    var thisY = Math.round(this.y - level.y) + this.spriteSize / 2;
    
    var red = boundsData[((6944 * thisY) + thisX) * 4];
    var green = boundsData[((6944 * thisY) + thisX) * 4 + 1];
    var blue = boundsData[((6944 * thisY) + thisX) * 4 + 2];
    
    var inBounds = false;
    var levitating = false;
    
    /*
     * COLOR KEY
     *
     * PINK: 	  255   0 162
     * TURQUOISE:   0 255 246
     *
     * COLOR NOTATION
     *
     * PINK: player is in bounds and can jump
     * TURQUOISE: player is in bounds and is levitating
     */
    if ((red == 255 && green === 0 && blue == 162) || (red == 0 && green == 255 && blue == 246)) {
        inBounds = true;
    }
    if (red == 0 && green === 255 && blue == 246) {
        levitating = true;
    }
    
    return {
        inBounds: inBounds,
        levitating: levitating
    };
};

Player.prototype.isPlayerNearbyLeft = function(player){
    return player.getPlayerX() > this.getPlayerX() - Constants.attackRange && player.getPlayerX() < this.getPlayerX();
};

Player.prototype.isPlayerNearbyRight = function(player){
    return (player.getPlayerX() > this.getPlayerX() && player.getPlayerX() < this.getPlayerX() + Constants.attackRange);
};

Player.prototype.isPlayerVerticallyNear = function(player){
    return ((player.y > this.y - 10) && (player.y < this.y + 10)) ? true : false;
};

Player.prototype.nearby = function(player){

    if (this.isFacingRight() && this.isPlayerNearbyRight(player) && this.isPlayerVerticallyNear(player)) {
        return true;
    }
    else if (!this.isFacingRight() && this.isPlayerNearbyLeft(player) && this.isPlayerVerticallyNear(player)) {
        return true;
    }
    
    return false;
};

Player.prototype.damage = function(){
    this.health = this.health <= 0 ? 0 : this.health - 1;
    
    this.spriteSheet = this.hitSpriteSheet;
    var that = this;
    setTimeout(function(){
        that.spriteSheet = that.normalSpriteSheet;
    }, 200);
};
