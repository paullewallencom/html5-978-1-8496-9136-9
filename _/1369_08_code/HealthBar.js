function HealthBar(config){
    this.maxHealth = config.maxHealth;
    this.x = config.x;
    this.y = config.y;
    this.maxWidth = config.maxWidth;
    this.height = config.height;
    
    this.health = this.maxHealth;
}

HealthBar.prototype.setHealth = function(health){
    this.health = health;
};

HealthBar.prototype.draw = function(){
    context.beginPath();
    context.save();
    context.globalAlpha = 0.9;
    var width = this.maxWidth * this.health / this.maxHealth;
    context.rect(this.x, this.y, width, this.height);
    context.fillStyle = "red";
    context.fill();
    context.restore();
    context.closePath();
};
