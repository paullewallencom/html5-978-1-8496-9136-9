function Animation(canvas){
    // Stage vars
    this.canvas = canvas;
    this.fps = 60;
    this.context = canvas.getContext("2d");
    this.updateStage = undefined;
    this.drawStage = undefined;
    
    this.t = 0;
    this.timeInterval = 1000 / this.fps;
    this.intervalId = null;
    this.frame = 0;
}

Animation.prototype.setDrawStage = function(func){
    this.drawStage = func;
};

Animation.prototype.drawStage = function(){
    if (this.drawStage !== undefined) {
        this.clearCanvas();
        this.drawStage();
    }
};

Animation.prototype.setUpdateStage = function(func){
    this.updateStage = func;
};

Animation.prototype.getContext = function(){
    return this.context;
};

Animation.prototype.clearCanvas = function(){
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

Animation.prototype.getFrame = function(){
    return this.frame;
};

Animation.prototype.start = function(){
    var that = this;
    if (this.drawStage !== undefined) {
        this.drawStage();
    }
    this.intervalId = setInterval(function(){
        that.animationLoop();
    }, this.timeInterval);
};

Animation.prototype.stop = function(){
    this.clearInterval(intervalId);
};

Animation.prototype.getTimeInterval = function(){
    return this.timeInterval;
};

Animation.prototype.getTime = function(){
    return this.t;
};

Animation.prototype.animationLoop = function(){
    this.frame++;
    this.t += this.timeInterval;
    this.clearCanvas();
    if (this.updateStage !== undefined) {
        this.updateStage();
    }
    if (this.drawStage !== undefined) {
        this.drawStage();
    }
};