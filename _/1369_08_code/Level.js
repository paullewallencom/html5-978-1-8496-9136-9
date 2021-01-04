function Level(config){
    this.x = config.x;
    this.y = config.y;
    this.leftBounds = config.leftBounds;
    this.rightBounds = config.rightBounds;
}

Level.prototype.draw = function(){
    context.drawImage(images.background, 0, 0);
    context.drawImage(images.level, level.x, level.y);
};

Level.prototype.update = function(){
    // adjust level position
    if (hero.isFacingRight() && hero.x > this.rightBounds) {
        this.x -= (hero.x - this.rightBounds);
        hero.x = this.rightBounds;
    }
    else if (!hero.isFacingRight() && hero.x < this.leftBounds && this.x < -5) {
        this.x += (this.leftBounds - hero.x);
        hero.x = this.leftBounds;
    }
};


