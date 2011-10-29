
$(document).ready(function(){

	$("#hold").html("Wait for opponent.<br><br>To test, go to this same address from another tab or browser window.");
	running = 1;
	
	now.start = function(){
		if(running == 0)
			return;
		begin();
	}
	
	now.recVar = function(otherVars){
		if(running == 0)
			return;
		recVar(otherVars);
	}
	
	now.recWin = function(){
		running = 0;
		recWin();
	}
});

function begin(){

	// main board
	board = [];

	// my piece (sent to now)
	// when it hits black, indicate stuck, must be unstuck by partner
	// y and piece are set by server after unstick occurs
	// frame must match, if not, increase frame, increase y
	myVars = { 	
		'x' 		: 0,
		'y' 		: 0,
		'piece' 	: 0,
		'rot' 		: 0,
		'stuck'		: 0,
		'frame'		: 0
	};

	// enemies piece (recieved from now)
	// recognize the stick when it occurs and then unstick partner
	partnerVars = { 
		'x' 		: 0,
		'y' 		: 0,
		'piece' 	: 0,
		'rot' 		: 0,
		'stuck'		: 0,
		'frame'		: 0
	};

	defPiece();
	maxX = 32;
	maxY = 10;
	timeMili = 300;
	curTimeMili = 300;

	randomPiece();	
	initBoard();
	addPiece();
	showBoard();

	timedCount();
}

function recWin(){
	newStr = ("You Won!<br><br>Refresh to find another opponent.");
	newStr += "<br><br>Steps completed: " + myVars.frame;
	$("#hold").html(newStr);
}

function recVar(otherVars){
	
	if(partnerVars.stuck == 0)
		setReversePiece(1);
	
	partnerVars = otherVars;
	setReversePiece(0);
	
	showBoard();
}

function randomPiece(){

	var newPiece = Math.floor(Math.random() * 4);
	var newRot = Math.floor(Math.random() * (piece[newPiece].length));

	myVars = { 	
		'x' 		: -3,
		'y' 		: 3,
		'piece' 	: newPiece,
		'rot' 		: newRot,
		'stuck'		: 0,
		'frame'		: myVars.frame
	};
}

function timedCount(){

	if(running == 0)
		return;

	// the frames should match between the clients, if I am too much faster, slow down a bit
	if(myVars.frame - partnerVars.frame > 1){
		setTimeout("timedCount()",curTimeMili);
		return;
	}

	// move right
	remPiece();
	if(fitBounds(myVars.rot,1,0)){		
		
		myVars.x++;
		addPiece();
		now.sendVar(myVars);
	}
	else{
		myVars.stuck = 1;
		addPiece();
		now.sendVar(myVars);
		randomPiece();

		// check if lost
		if(!fitBounds(myVars.rot,0,0)){
			running = 0;
			now.sendLoss();
			newStr =  "You Lost.<br><br>Refresh to find another opponent."
			newStr += "<br><br>Steps completed: " + myVars.frame;
			$("#hold").html(newStr);
			return;
		}
	}

	showBoard();
	myVars.frame++;

	// make game harder as time passes
	curTimeMili = timeMili - Math.floor(myVars.frame/100)

	if(running == 1)
		setTimeout("timedCount()",curTimeMili);
}

function setReversePiece(toSet){
	arr = piece[partnerVars.piece][partnerVars.rot];

	for(var y=0;y<4;y++){
		for(var x=0;x<4;x++){
			if(arr[y][x] == 1 && partnerVars.x+x >= 0)
				board[partnerVars.y+y][maxX-1-(partnerVars.x+x)] = toSet;
		}
	}
}

function setPiece(toSet){
	arr = piece[myVars.piece][myVars.rot];

	for(var y=0;y<4;y++){
		for(var x=0;x<4;x++){
			if(arr[y][x] == 1 && myVars.x+x >= 0)
				board[myVars.y+y][myVars.x+x] = toSet;
		}
	}
}

function addPiece(){
	setPiece(1);
}

function remPiece(){
	setPiece(0);
}

function keydown(evt){

	if(running == 0)
		return;

	var KEY_LEFT = 37;
	var KEY_RIGHT = 39;
	var KEY_UP = 38;
	var KEY_DOWN = 40;

	switch(evt.keyCode){
		case KEY_LEFT: rotate(); break;
		case KEY_UP: moveUp(); break;
		case KEY_DOWN: moveDown(); break;
	}

	showBoard();
}

// checks side bounds and if the space to the sides is occupied
function fitBounds(newRot,addX,addY){
	arr = piece[myVars.piece][newRot];

	for(var y=0;y<4;y++){
		for(var x=0;x<4;x++){
			if(arr[y][x] == 1){
				var testY = myVars.y+y+addY;
				var testX = myVars.x+x+addX;
				if(testY < 0 || testY >= maxY || testX >= maxX || (testX >= 0 && board[testY][testX] == 1)){
					return false;
				}
			}
		}
	}
	return true;
}

function moveUp(){
	remPiece();
	if(fitBounds(myVars.rot,0,-1)){
		myVars.y--;
		now.sendVar(myVars);	
	}
	addPiece();
}

function moveDown(){
	remPiece();
	if(fitBounds(myVars.rot,0,1)){
		myVars.y++;
		now.sendVar(myVars);		
	}
	addPiece();
}

function rotate(){
	remPiece();
	newRot = (myVars.rot + 1) % (piece[myVars.piece].length);
	if(fitBounds(newRot,0,0)){
		myVars.rot = newRot;
		now.sendVar(myVars);		
	}
	addPiece();
}

// display
function showBoard(){

	var str = '<table>'
	for(var y=0;y<maxY;y++){
		str += '<tr>'

		for(var x=0;x<maxX;x++){
			if(board[y][x] == 1)
				str += '<td id="set"></td>';
			else
				str += '<td></td>';
		}
		str += '</tr>'
	}
	str += '</table>'
	$("#hold").html(str);
}

// half, and then its inversion
function initBoard(){

	for(var y=0;y<maxY;y++){
		board[y] = [];
		for(var x=0;x<maxX/2;x++){
			board[y][x] = 0;
		}
		for(var x=maxX/2;x<maxX;x++){
			board[y][x] = 1;
		}
	}
}

// each piece is [piece number][rotation)][y][x]
function defPiece(){

	piece = [

		// I
		[[	[0,0,0,0],
			[1,1,1,1],
			[0,0,0,0],
			[0,0,0,0]],

		 [	[0,1,0,0],
			[0,1,0,0],
			[0,1,0,0],
			[0,1,0,0]]],

		// T
		[[	[0,0,0,0],
			[1,1,1,0],
			[0,1,0,0],
			[0,0,0,0]],

		 [	[0,1,0,0],
			[1,1,0,0],
			[0,1,0,0],
			[0,0,0,0]],

		 [	[0,1,0,0],
			[1,1,1,0],
			[0,0,0,0],
			[0,0,0,0]],

		 [	[0,1,0,0],
			[0,1,1,0],
			[0,1,0,0],
			[0,0,0,0]]],

		// L
		[[	[0,0,0,0],
			[1,1,1,0],
			[1,0,0,0],
			[0,0,0,0]],

		 [	[1,1,0,0],
			[0,1,0,0],
			[0,1,0,0],
			[0,0,0,0]],

		 [	[0,0,1,0],
			[1,1,1,0],
			[0,0,0,0],
			[0,0,0,0]],

		 [	[0,1,0,0],
			[0,1,0,0],
			[0,1,1,0],
			[0,0,0,0]]],

		// J
		[[	[1,0,0,0],
			[1,1,1,0],
			[0,0,0,0],
			[0,0,0,0]],

		 [	[0,1,1,0],
			[0,1,0,0],
			[0,1,0,0],
			[0,0,0,0]],

		 [	[0,0,0,0],
			[1,1,1,0],
			[0,0,1,0],
			[0,0,0,0]],

		 [	[0,1,0,0],
			[0,1,0,0],
			[1,1,0,0],
			[0,0,0,0]]],

		// Z
		[[	[0,0,0,0],
			[1,1,0,0],
			[0,1,1,0],
			[0,0,0,0]],

		 [	[0,0,1,0],
			[0,1,1,0],
			[0,1,0,0],
			[0,0,0,0]]],

		// S
		[[	[0,0,0,0],
			[0,1,1,0],
			[1,1,0,0],
			[0,0,0,0]],

		 [	[0,1,0,0],
			[0,1,1,0],
			[0,0,1,0],
			[0,0,0,0]]],

		// O
		[[	[0,1,1,0],
			[0,1,1,0],
			[0,0,0,0],
			[0,0,0,0]]]]
}
