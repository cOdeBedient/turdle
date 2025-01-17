// Global Variables
var winningWord = '';
var currentRow = 1;
var guess = '';
var words = [];

// Query Selectors
var inputs = document.querySelectorAll('input');
var guessButton = document.querySelector('#guess-button');
var keyLetters = document.querySelectorAll('span');
var errorMessage = document.querySelector('#error-message');
var viewRulesButton = document.querySelector('#rules-button');
var viewGameButton = document.querySelector('#play-button');
var viewStatsButton = document.querySelector('#stats-button');
var gameBoard = document.querySelector('#game-section');
var letterKey = document.querySelector('#key-section');
var rules = document.querySelector('#rules-section');
var stats = document.querySelector('#stats-section');
var gameOverWinBox = document.querySelector('#game-over-win-section');
var gameOverLoseBox = document.querySelector('#game-over-lose-section');
var gameOverGuessCount = document.querySelector('#game-over-guesses-count');
var gameOverGuessGrammar = document.querySelector('#game-over-guesses-plural');
var totalGamesText = document.querySelector('#stats-total-games');
var percentCorrectText = document.querySelector('#stats-percent-correct');
var averageGuessesText = document.querySelector('#stats-average-guesses');

// Event Listeners
window.addEventListener('load', setGame);

// keyup fires when key is released. Go to next row?
for (var i = 0; i < inputs.length; i++) {
  inputs[i].addEventListener('keyup', function() { moveToNextInput(event) });
}

for (var i = 0; i < keyLetters.length; i++) {
  keyLetters[i].addEventListener('click', function() { clickLetter(event) });
}

guessButton.addEventListener('click', submitGuess);

viewRulesButton.addEventListener('click', viewRules);

viewGameButton.addEventListener('click', viewGame);

viewStatsButton.addEventListener('click', handleStats);

// Functions
function setGame() {
  getWordList()
      .then(wordList => {
        words = wordList;
        currentRow = 1;
        winningWord = getRandomWord(words);
        updateInputPermissions();
      });
}

function handleStats() {
  fetch('http://localhost:3001/api/v1/games')
    .then(response => response.json())
    .then(stats => {
      changeStatsInfo(stats);
      viewStats();
    })
  
}

function getWordList() {
  return fetch('http://localhost:3001/api/v1/words')
    .then(response => {
      return response.json()
    });
}

function getRandomWord(dataSet) {
  var randomIndex = Math.floor(Math.random() * 2500);

  return dataSet[randomIndex];
}

function updateInputPermissions() {
  for(var i = 0; i < inputs.length; i++) {
    if(!inputs[i].id.includes(`-${currentRow}-`)) {
      inputs[i].disabled = true;
    } else {
      inputs[i].disabled = false;
    }
  }

  // look at this more. Could we add where to focus after guess?
  inputs[0].focus();
}

// focus onto guess button. Then to next line.
// if all full, don't moveToNextInput
function moveToNextInput(e) {
  var key = e.keyCode || e.charCode;

  if( key !== 8 && key !== 46 ) {
    var indexOfNext = parseInt(e.target.id.split('-')[2]) + 1;
    if(indexOfNext !== 30) {
      inputs[indexOfNext].focus();
    }
  }
}

function clickLetter(e) {
  var activeInput = null;
  var activeIndex = null;

  for (var i = 0; i < inputs.length; i++) {
    if(inputs[i].id.includes(`-${currentRow}-`) && !inputs[i].value && !activeInput) {
      activeInput = inputs[i];
      activeIndex = i;
    }
  }

  activeInput.value = e.target.innerText;
  inputs[activeIndex + 1].focus();
}

// nested if not good. Pull out into separate function?
function submitGuess() {
  if (checkIsWord()) {
    errorMessage.innerText = '';
    compareGuess();
    if (checkForWin()) {
      setTimeout(function() {processGameEnd(true)}, 1000);
    } else if(!checkForWin() && currentRow === 6) {
      setTimeout(function() {processGameEnd(false)}, 1000);
    } else {
      changeRow(); 
    }
  } else {
    errorMessage.innerText = 'Not a valid word. Try again!';
  }
}

// this is checking to see if word is in the array.
// then compareGuess will check to see if it is THE word.
function checkIsWord() {
  guess = '';

  for(var i = 0; i < inputs.length; i++) {
    if(inputs[i].id.includes(`-${currentRow}-`)) {
      guess += inputs[i].value;
    }
  }

  return words.includes(guess);
}

// maybe split winning word at top of function?
function compareGuess() {
  var guessLetters = guess.split('');

  for (var i = 0; i < guessLetters.length; i++) {

    if (winningWord.includes(guessLetters[i]) && winningWord.split('')[i] !== guessLetters[i]) {
      updateBoxColor(i, 'wrong-location');
      updateKeyColor(guessLetters[i], 'wrong-location-key');
    } else if (winningWord.split('')[i] === guessLetters[i]) {
      updateBoxColor(i, 'correct-location');
      updateKeyColor(guessLetters[i], 'correct-location-key');
    } else {
      updateBoxColor(i, 'wrong');
      updateKeyColor(guessLetters[i], 'wrong-key');
    }
  }
}

function updateBoxColor(letterLocation, className) {
  var row = [];

  for (var i = 0; i < inputs.length; i++) {
    if(inputs[i].id.includes(`-${currentRow}-`)) {
      row.push(inputs[i]);
    }
  }

  row[letterLocation].classList.add(className);
}

// correct location key update is weird and not fully working
function updateKeyColor(letter, className) {
  var keyLetter = null;

  for (var i = 0; i < keyLetters.length; i++) {
    if (keyLetters[i].innerText === letter) {
      keyLetter = keyLetters[i];
    }
  }

  keyLetter.classList.add(className);
}

function checkForWin() {
  return guess === winningWord;
}

function changeRow() {
  currentRow++;
  updateInputPermissions();
}

function processGameEnd(wonGame) {
  recordGameStats(wonGame);
  if(wonGame){
    changeWinMessageText();
  }
  viewGameOverMessage(wonGame);
  setTimeout(startNewGame, 4000);
}

function recordGameStats(wonGame) {
  const result = {};
  if (wonGame) {
    result.solved = true
    result.guesses = currentRow;
  } else {
      result.solved = false;
      result.guesses = 6;
  }
    fetch('http://localhost:3001/api/v1/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(result)
    })
    .then(response => response.json())
    .then(json => console.log(json))
    .catch(err => console.log(err));
}

function changeWinMessageText() {
    gameOverGuessCount.innerText = currentRow;
    if (currentRow < 2) {
      gameOverGuessGrammar.classList.add('collapsed');
    } else {
      gameOverGuessGrammar.classList.remove('collapsed');
    }
}

function startNewGame() {
  clearGameBoard();
  clearKey();
  setGame();
  viewGame();
  inputs[0].focus();
}

function clearGameBoard() {
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].value = '';
    inputs[i].classList.remove('correct-location', 'wrong-location', 'wrong');
  }
}

function clearKey() {
  for (var i = 0; i < keyLetters.length; i++) {
    keyLetters[i].classList.remove('correct-location-key', 'wrong-location-key', 'wrong-key');
  }
}

function computeStatsData(data) {
  var totalGamesPlayed = data.length;
  var gamesWon = data.filter(game => game.solved);
  var percentGamesWon = (gamesWon.length / totalGamesPlayed) * 100;
  var totalGuesses = gamesWon.reduce((guesses, game) => {
    guesses += game.numGuesses;

    return guesses
  }, 0);
  var averageGuesses = (totalGuesses / gamesWon.length).toFixed(1);
 

  return {
    totalGamesPlayed: totalGamesPlayed,
    percentGamesWon: percentGamesWon,
    averageGuesses: averageGuesses
  };
}

function changeStatsInfo(data) {
  var stats = computeStatsData(data);
  totalGamesText.innerText = `${stats.totalGamesPlayed}`;
  percentCorrectText.innerText = `${stats.percentGamesWon}`
  averageGuessesText.innerText = `${stats.averageGuesses}`
}

// Change Page View Functions

function viewRules() {
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.remove('collapsed');
  stats.classList.add('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.add('active');
  viewStatsButton.classList.remove('active');
}

function viewGame() {
  letterKey.classList.remove('hidden');
  gameBoard.classList.remove('collapsed');
  rules.classList.add('collapsed');
  stats.classList.add('collapsed');
  gameOverWinBox.classList.add('collapsed')
  gameOverLoseBox.classList.add('collapsed')
  viewGameButton.classList.add('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.remove('active');
}

function viewStats() {
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.add('collapsed');
  stats.classList.remove('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.add('active');
}

function viewGameOverMessage(wonGame) {
  if(wonGame) {
    gameOverWinBox.classList.remove('collapsed')
  } else {
    gameOverLoseBox.classList.remove('collapsed')
  }
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
}

