//Modules for server
var express = require("./server");
var Game = require('./game');
var server = require('http').Server(express);
var io = require('socket.io')(server);
var PNG = require('pngjs2').PNG;
var fs = require('fs');

//For now one game; instantiated in loadMap


//The list of games in the server
var games = {};
var nextGameId = 1;
var maps = {
  circle: {
    name: 'Circle of Iniquity',
    path: 'server/assets/scaledCircleMap.png',
    width: null,
    height: null,
    grid: null
  }
};
//Load up a map grid for collision detection and start a game
initialize();
//loadMap('server/assets/scaledCircleMap.png');

//load the map grid, as soon as that's complete, use it to instantiate a Game
function initialize() {
  loadMapGrid('circle', createGame);
  console.log(games);
}

function loadMapGrid(mapName, callback) {
  var mapObj = maps[mapName]; 
  fs.createReadStream(mapObj.path)
    .pipe(new PNG({
      filterType: 4
    }))
    .on('parsed', function() {
      mapObj.grid = processImageIntoBitArray(this.data, this.width, this.height);
      mapObj.width = this.width;
      mapObj.height = this.height;
      callback();
    }); 
}

function createGame() {
  game = new Game(nextGameId, io, maps.circle);
  games[nextGameId] = game;
  nextGameId++;
}

//Listen to connections from socket.io
io.on('connection', function(socket) {

  //add this player to the first open game
  var currentGame;
  for (var i = 1; i < nextGameId; i++)  {
    console.log(i);
    if (games[i].numPlayers < games[i].maxPlayers) {
      currentGame = games[i];
      break;
    }
  }
  currentGame.addPlayer(socket.id);
  //Gets the recently added player from game object
  var currentPlayer = currentGame.getPlayer(socket.id);
  //Let all the players know about the new player
  socket.broadcast.emit("playerConnected", currentPlayer);


  //receive input from players, hand off to the appropriate game object to calculate positions
  socket.on('movementInput', function(inputObj) {
    getGameBySocketId(socket.id).parseInput(inputObj, socket.id);
  }); 
  
  //send all player info to recently connected player
  setTimeout(function() {
    socket.emit("connected", game.players);
  }, 500);

  //Handle when a player disconnects from server
  socket.on('disconnect', function() {
    currentGame.removePlayer(socket.id);
    console.log('dc');
    //Tell all other players that he is disconnected
    io.sockets.emit('playerDisconnected', currentPlayer);
  });
});

//Finds the game a socket is connected to.
function getGameBySocketId(socketId) {
  var result;
  for (var gameId in games) {
    games[gameId].players.forEach(function(player) {
      if(player.socketId === socketId) {
        result = games[gameId];
      }
    });
  }
  return result;
}

//Start up express and socket io
var port = process.env.PORT || 3000;
server.listen(port);


//converts data from png of the map into a multidimensional array of 1s and 0s, 
//representing white and black pixels resepectively
function processImageIntoBitArray(imageDataArray, width, height) {
  var bitArrayGrid = [];
  var numRows = height;
  var rowLength = width;
  for (var i = 0; i < numRows; i++) {
    var row = [];
    for (var j = 0; j < rowLength; j++) {
      var currentIndex = (j * 4) + (rowLength * i * 4);
      var startOfPixel = imageDataArray[currentIndex];
      //if imageDataArray[index] is the start of a white pixel, push a 1
      if (startOfPixel === 255) {
        row.push(1);    
      } else {
        //else, it is a black pixel, so push a 0
        row.push(0);
      }
    }
    bitArrayGrid.push(row);  
  }
  //findWhiteZone(bitArrayGrid);
  return bitArrayGrid;
}

//used for testing that our bitArrayGrid is correct
//keep this in the file until our track is finalized
function findWhiteZone(grid) {
  var count = 0;
  var breaking = false;
  for (var i = 0; i < grid.length; i++) {
    for (var j = 0; j < grid.length; j++) {
      if (grid[i][j] === 1) {
        console.log('first white pixel: row: ' + i + 'column: ' + j );
        count++;
        breaking = (count > 0); 
        if (breaking) break;
      }  
    }
    if (breaking) break;
  } 
  return [i, j];
}  
