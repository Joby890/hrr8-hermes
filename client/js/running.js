function Running(){
  this.name = "running";
  this.isRunning = false; 
  this.isBoosting = false; 
}

Running.prototype._input = function(serverData,robot){
  var parsed = {}; 
  parsed.position =  new BABYLON.Vector3(serverData.robotModel.position.x, robot.pivot.position.y, serverData.robotModel.position.z);
  parsed.rotation = new BABYLON.Vector3(0, serverData.robotModel.facing * 2  * Math.PI + Math.PI * 0.5, 0);
  parsed.velocity = serverData.robotModel.velocity;
  parsed.energy = serverData.robotModel.energy;
  return parsed; 
};

Running.prototype._runCheck = function(robot){
  if(!robot.isRunning && robot.velocity !== 0){
    robot.startRunning();
    return;  
  }
  if(robot.isRunning && robot.velocity === 0){
    robot.stopRunning(); 
  }
};
  
Running.prototype.run = function(robot, parsedInput) {
  // var shouldAnimateCam = false; 
  // if((!robot.pivot.rotation.equals(parsedInput.rotation) ||
  //   !robot.pivot.position.equals(parsedInput.position)) &&
  //   robot.id === socket.id){a
  //   shouldAnimateCam = true; 
  // }
  robot.pivot.position = parsedInput.position; 
  robot.pivot.rotation = parsedInput.rotation; 
  robot.velocity = parsedInput.velocity;
  if(robot.id === socket.id) {
    document.getElementById('energy').innerHTML = parsedInput.energy;
    document.getElementById('energy').style.clip = 'rect(0, '+parsedInput.energy+'px, 100px, 0)';
    camera.position = robot.camPivot.getAbsolutePosition();
    camera.setTarget(robot.pivot.position); 
  } 
  
  
  // if(shouldAnimateCam){
  //   //robot.camPivot.lookAt(robot.pivot,0,0,0);
  //   //camera.rotation = robot.camPivot.rotation;
  //   console.log(camera);
  // }
};


Running.prototype.update = function(robot,serverData){
  var parsedInput = this._input(serverData,robot); 
  this.run(robot, parsedInput); 
  this._runCheck(robot); 
};

Running.prototype.enterState = function(robot) {
  if(robot.velocity === 0){
    robot.stopRunning();
  }
  else{
    robot.startRunning();
  }
};

Running.prototype.exitState = function(robot) {
  robot.isRunning = false; 
};
