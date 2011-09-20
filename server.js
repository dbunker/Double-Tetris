var fs = require('fs');
var http = require("http");
var url = require("url");

var server = http.createServer(function(req, response){
	
	var pathname = url.parse(req.url).pathname;
    	console.log("Request for " + pathname + " received.");
	var contType = 'text/html'

	if(pathname === '/page.html')
		contType = 'text/html'
	else if(pathname === '/run.js')
		contType = 'text/javascript'
	else if(pathname === '/look.css')
		contType = 'text/css'
	else{
		response.writeHead(404, {'Content-Type':'text/html'});
		response.end();
		return;
	}

	fs.readFile(__dirname + pathname, function(err, data){
		response.writeHead(200, {'Content-Type':contType}); 
		response.write(data);  
		response.end();
	});
});
server.listen(8585);

var nowjs = require("now");
var everyone = nowjs.initialize(server);
var oddPlayer = null;

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

