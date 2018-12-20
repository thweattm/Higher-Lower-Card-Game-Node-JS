//Path setup
const path = require('path');

//Express Setup
var express = require('express');
var app = express();

//Express-Handlebars Setup
var handlebars = require('express-handlebars').create({defaultLayout:'index'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

//Body-Parser Setup (allow urlencoded and json)
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Express-Session Setup
var session = require('express-session');
app.use(session({
		secret: 'SecretPassword',
		resave: true,
		saveUninitialized: true
}));

//Request Setup
var request = require('request');

//Define port to listen on
app.set('port', 8000);

//Define public folder
app.use(express.static(path.join(__dirname, '/public/')));



//Load cardGame
app.get('/',function(req, res){
	var newObject = {};
	newObject.pageTitle = "cardGame";
	//If there is no current session, show start screen
	if(!req.session.deck_id){
		res.render('newGame', newObject);
	
	//Resume game
	} else {
		//Set object variables for page display
		newObject.remaining = req.session.remaining;
		newObject.yourScore = req.session.yourScore;
		newObject.compScore = req.session.compScore;
		newObject.yourCardImg = req.session.yourCardImg
		newObject.compCardImg = "http://chetart.com/blog/wp-content/uploads/2012/05/playing-card-back.jpg"
		newObject.yourCard = req.session.yourCard;
		newObject.compCard = req.session.compCard;
		newObject.remaining = req.session.remaining;
		newObject.text = "Is your card higher or lower than the computer's card (ACE is high)?"
		res.render('gameBoard', newObject);
	}
	
});

app.post('/', function(req, res){
	var reqURL = 'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1'
	var newObject = {};
	
	//Starting new game
	if(req.body['newgame']){
		request(reqURL, getNewDeck);
		
	//Guess Higher
	} else if (req.body['higher']){
			
		//Set all common variables
		newObject.yourCardImg = req.session.yourCardImg
		newObject.compCardImg = req.session.compCardImg
		newObject.yourCard = req.session.yourCard;
		newObject.compCard = req.session.compCard;
		newObject.remaining = req.session.remaining;
		newObject.yourScore = req.session.yourScore;
		newObject.compScore = req.session.compScore;
		
		//Winner
		if (parseInt(req.session.yourCard,10) > parseInt(req.session.compCard,10)){
			req.session.yourScore++;
			newObject.text = "You guessed Higher - You WIN!"
		//Loser
		} else if (parseInt(req.session.yourCard,10) < parseInt(req.session.compCard,10)){
			req.session.compScore++;
			newObject.text = "You guessed Higher - You LOSE!"
		//Tie
		} else {
			newObject.text = "You TIE!"
		}
		
		//Game over
		if (req.session.remaining < 2){
			newObject.remaining = "Game Over!";
			newObject.text += " Game Over!";
		}
		
		//Load scores
		newObject.yourScore = req.session.yourScore;
		newObject.compScore = req.session.compScore;
		
		//Debug
		//console.log("Guess Higher | You: " + req.session.yourCard + "(" + newObject.yourCard + ")" +
			//" Comp: " + req.session.compCard + "(" + newObject.compCard + ") " + newObject.text);
			
		//Load page
		res.render('gameBoard', newObject);
	
	//Guess Lower
	} else if (req.body['lower']){
		
		//Set all common variables
		newObject.yourCardImg = req.session.yourCardImg
		newObject.compCardImg = req.session.compCardImg
		newObject.yourCard = req.session.yourCard;
		newObject.compCard = req.session.compCard;
		newObject.remaining = req.session.remaining;
		newObject.yourScore = req.session.yourScore;
		newObject.compScore = req.session.compScore;
		
		//Winner
		//Not exactly sure why, but without using 'partInt' on the comarisons
		//10 almost always caused a problem and gave the wrong result
		if (parseInt(newObject.yourCard,10) < parseInt(newObject.compCard,10)){
			req.session.yourScore++;
			newObject.text = "You guessed Lower - You WIN!"
		//Loser
		} else if (parseInt(newObject.yourCard,10) > parseInt(newObject.compCard,10)){
			req.session.compScore++;
			newObject.text = "You guessed Lower - You LOSE!"
		//Tie
		} else {
			newObject.text = "You TIE!"
		}
		
		//Game over
		if (req.session.remaining < 2){
			newObject.remaining = "Game Over!";
			newObject.text += " Game Over!";
		}
		
		//Load scores
		newObject.yourScore = req.session.yourScore;
		newObject.compScore = req.session.compScore;
		
		//Debug
		//console.log("Guess Lower | You: " + req.session.yourCard + "(" + newObject.yourCard + ")" +
			//" Comp: " + req.session.compCard + "(" + newObject.compCard + ") " + newObject.text);
			
		//Load page
		res.render('gameBoard', newObject);
	
	//Get next card
	} else if (req.body['nextCard']){
		//New game if less than 2 cards remaining
		if (req.session.remaining < 2){
			request(reqURL, getNewDeck);
		//Get two new cards
		} else {
			//Request two cards from the deck
			reqURL = 'https://deckofcardsapi.com/api/deck/' + req.session.deck_id + '/draw/?count=2'
			request(reqURL, getTwoCards);
		}
	
	//New Game
	} else if (req.body['newGame']){
		request(reqURL, getNewDeck);
	
	} else {
		//Something weird, go back to the home page
		res.render('newGame', newObject);
	}
	
	function getNewDeck(error, response, body){
		var deck = JSON.parse(body);
		//Proceed if we were successful
		if (deck.success){
			//Assign items to session
			req.session.deck_id = deck.deck_id;
			req.session.yourScore = 0;
			req.session.compScore = 0;
			req.session.remaining = deck.remaining;
			//Request two cards from the deck
			reqURL = 'https://deckofcardsapi.com/api/deck/' + req.session.deck_id + '/draw/?count=2'
			request(reqURL, getTwoCards);
		} else {
			//WAS NOT A SUCESS
			console.log(error);
		}
	};
	
	function getTwoCards(error, response, body){
		var getCards = JSON.parse(body);
		if (getCards.success){
			//Set session variables
			req.session.remaining = getCards.remaining;
			req.session.yourCard = getValue(getCards.cards[0].value);
			req.session.yourCardImg = getCards.cards[0].image;
			req.session.compCard = getValue(getCards.cards[1].value);
			req.session.compCardImg = getCards.cards[1].image;
			//Set object variables for page display
			newObject.remaining = req.session.remaining;
			newObject.yourScore = req.session.yourScore;
			newObject.compScore = req.session.compScore;
			newObject.yourCardImg = req.session.yourCardImg
			newObject.compCardImg = "https://i276.photobucket.com/albums/kk3/mtdg311/playing-card-back_zpsp3u3dres.jpg"
			newObject.yourCard = req.session.yourCard;
			newObject.compCard = req.session.compCard;
			newObject.remaining = req.session.remaining;
			newObject.text = "Is your card higher or lower than the computer's card (ACE is high)?"
			res.render('gameBoard', newObject);
		
		} else {
			//WAS NOT A SUCCESS
			console.log(error);
		}
	};
	
});

//Convert face cards to number values
function getValue(value){
	if (value == "ACE")
		return 14;
	else if (value == "KING")
		return 13;
	else if (value == "QUEEN")
		return 12;
	else if(value == "JACK")
		return 11;
	else
		return value;
};

//Start server
app.listen(app.get('port'), function(){
  console.log('Express listening on port: ' + app.get('port'));
  console.log('Press Ctrl-C to terminate.')
});
