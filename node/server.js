// multiplayer tetris node.js/now.js app

var fs = require('fs');
var http = require("http");
var url = require("url");

var port = process.argv[2];
var server = http.createServer();
server.listen(port);

var nowjs = require("now");
var everyone = nowjs.initialize(server);
var oddPlayer = null;

console.log("Start Tetris Port: " + port);

function tryConn(clientId){

	if(oddPlayer == null){
		console.log("Odd: " + clientId);
		oddPlayer = clientId;
	}
	else{
		console.log("Created: " + oddPlayer + " " + clientId);
		var partnerId = oddPlayer;
		oddPlayer = null;

		nowjs.getClient(partnerId,function(){
			this.now.partnerId = clientId;
			this.now.start();
		});

		nowjs.getClient(clientId,function(){
			this.now.partnerId = partnerId;
			this.now.start();
		});		
	}
}

// link people to games
nowjs.on('connect', function(){
	clientId = this.user.clientId;
 	tryConn(clientId);
});

function loss(clientId,partnerId){

	nowjs.getClient(partnerId,function(){
		this.now.recWin();
	});
	console.log("Win: " + partnerId + " Loss: " + clientId);
}

nowjs.on('disconnect', function(){
	if(this.user.clientId === oddPlayer)
		oddPlayer = null;
	else
		loss(this.user.clientId,this.now.partnerId);
});

everyone.now.sendLoss = function(){
	loss(this.user.clientId,this.now.partnerId);
}

// most game interaction  occurs through this function, which acts as a proxy between 2 clients
everyone.now.sendVar = function(clientVar){
	partnerId = this.now.partnerId;

	nowjs.getClient(partnerId,function(){
		this.now.recVar(clientVar);
	});
}

