"use strict";

/** Connect Four game
 *
 * Two players take turns dropping a piece into a 7 x 6 grid until one player
 * achieves four in a row (horiz, vert or diagonally) or until the board fills
 * up completely.
 */

/**
 * Matching Logic Options
 * 1. Every turn check every cell in every direction from the bottom.
 * 2. Every turn check every cell up, left, right, and up diagonals.
 *
 * Optimizations
 * 1. Keep track of max height of dropped pieces (checks empty spaces).
 * 2. Keep track of coordinates of dropped pieces (and only check those, but checks invalid directions).
 * 3. Pre-generate potential matches for any valid coordinates (doesn't check invalid directions).
 *
 * Fully Optimized (but memory intensive)
 * 1. Keep track of array of valid coordinates.
 *
 * Out There
 * 1. For each coordinate in board, store an object that has:
 * a. current value (null or player number)
 * b. valid coordinates to check
 */

let game = undefined;

let startButton = document.getElementById("startGame");
startButton.addEventListener("click", startGame);

let alertContainer = document.getElementById("alertContainer");
let board = document.getElementById('board');

class Player {
  constructor(name, color) {
    this.name = name;
    this.color = color;
    this.id = generateMD5HashHex(name);
  }
}

class Game {
  constructor(playerOne, playerTwo, width = 7, height = 6) {
    this.width = width;
    this.height = height;
    this.state = this._createGameState();
    this.htmlBoard = this._createHtmlBoard();
    this.players = [playerOne, playerTwo];
    this.currPlayerIndex = 0;
    this.currPlayer = this.players[this.currPlayerIndex];
    this.placedPieces = [];
    this.gameEnded = false;
  }

  /**
   * Attempts to drop a game piece into a provided column
   * If room exists, adds that piece to the lowest open slots
   * If room does NOT exist (column is full), simply returns null
   */
  dropPiece(col) {
    if (this.gameEnded) { return; }
    // find the next available space (row) for the piece in the target column
    var targetRow = this._findEmptyCellInColumn(col);
    console.log("target row found:", targetRow);
    if (targetRow === null) { return; } // no space so ignore the click

    // add to the JS board and the HTML board
    this._addToBoard(targetRow, col);
    this._placePieceInHtml(targetRow, col);

    // check for win condition
    this._checkForGameEnd();
  }

  /**
   * Creates the initial game state represented by a matrix of game pieces
   * where each game piece has a value and an array of coord sets which are
   * valid potential winning board piece sequences.
   */
  _createGameState() {
    console.log("createGameState() called");

    const gameState = [];

    _initializeMatrix.call(this);
    _populateBoardSpaces.call(this);

    return gameState;

    /** Initializes the valid boundaries of the state */
    function _initializeMatrix() {
      console.log("_initializeMatrix() called.");
      for (let y = 0; y < this.height; y++) {
        const row = [];
        for (let x = 0; x < this.width; x++) {
          row.push(null);
        }
        gameState.push(row);
      }
      console.log("Matrix initialized.")
    }

    /** Adds board spaces to the state matrix */
    function _populateBoardSpaces() {
      console.log("_populateBoardSpaces() called.")
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          console.log("attempting to set game state for xy:", y, x);
          gameState[y][x] = {
            value: null,
            validCoordSets: _populateValidCoordSets(y, x)
          };
        }
      }

      console.log("Board spaces populated:", gameState);

      /** Accepts board coordinates and return array of valid coord sets */
      function _populateValidCoordSets(y, x) {
        console.log("_populateValidCoordSets called with yx:", y, x);
        const vcs = [];
        let coordSet = [];

        /**
         * check each direction to see if a valid set of coords exist.
         * since we can't lookup column values for rows which are undefined,
         * we will check if the row exists before checking anything else
        */

        // does a row existing 4 rows above?
        if (gameState[y-3] !== undefined) {
          // check up and diagonals

          // check up
          if (gameState[y-3][x] !== undefined) {
            coordSet = [];
            coordSet.push([y, x]);
            coordSet.push([y-1, x]);
            coordSet.push([y-2, x]);
            coordSet.push([y-3, x]);
            vcs.push(coordSet);
          }

          // check upLeft
          if (gameState[y-3][x-3] !== undefined) {
            coordSet = [];
            coordSet.push([y, x]);
            coordSet.push([y-1, x-1]);
            coordSet.push([y-2, x-2]);
            coordSet.push([y-3, x-3]);
            vcs.push(coordSet);
          }

          // check upRight
          if (gameState[y-3][x+3] !== undefined) {
            coordSet = [];
            coordSet.push([y, x]);
            coordSet.push([y-1, x+1]);
            coordSet.push([y-2, x+2]);
            coordSet.push([y-3, x+3]);
            vcs.push(coordSet);
          }
        }

        // check left and right

        // check left
        if (gameState[y][x-3] !== undefined) {
          coordSet = [];
          coordSet.push([y, x]);
          coordSet.push([y, x-1]);
          coordSet.push([y, x-2]);
          coordSet.push([y, x-3]);
          vcs.push(coordSet);
        }

        // check right
        if (gameState[y][x+3] !== undefined) {
          coordSet = [];
          coordSet.push([y, x]);
          coordSet.push([y, x+1]);
          coordSet.push([y, x+2]);
          coordSet.push([y, x+3]);
          vcs.push(coordSet);
        }

        console.log("Valid coord sets populated:", vcs)
        return vcs;
      }
    }
  }

  /** Creates and adds the HTML to the DOM representing the game board */
  _createHtmlBoard() {
    // grab the DOM element where the board will live
    const htmlBoard = document.getElementById('board');

    // create the top row where chips will be dropped
    const topRow = document.createElement("tr");
    topRow.setAttribute("id", "top-row");
    topRow.addEventListener("click", handlePieceDrop);

    // add each cell to the top row with and ID for reference in event handling
    for (let x = 0; x < this.width; x++) {
      const topRowCell = document.createElement("td");
      topRowCell.setAttribute("id", `top-row-cell-${x}`);
      topRow.append(topRowCell);
    }

    // add the top row to the board html
    htmlBoard.append(topRow);

    // now create the main rows
    for (let y = 0; y < this.height; y++) {
      const gameRow = document.createElement("tr");
      for (let x = 0; x < this.width; x++) {
        const gameCell = document.createElement("td");
        gameCell.setAttribute("id", `game-cell-${y}-${x}`);
        gameRow.append(gameCell);
      }
      htmlBoard.append(gameRow);
    }
  }

  /**
   * Given a column, return the row lowest empty cell (has a null value)
   * If the column is full (has no null values), returns null
   */
  _findEmptyCellInColumn(col) {
    console.log("attempting to find empty cell at col:", col);
    // check if the column is full and return 'null' if true
    if (this.state[0][col].value !== null) { return null; }

    let row = 0; // start a first row

    // loop through rows top to bottom until we either:
    // -- find a non-null cell (and return the slot above)
    // -- reach the last cell and return it
    while (row < this.height) {
      if (this.state[row][col].value !== null) {
        console.log("column was full");
        return row - 1;
      }
      row++;
    }
    return this.height - 1;
  }

  /** Adds the players numbers to the JS board state where they dropped a piece */
  _addToBoard(y, x) {
    this.state[y][x].value = this.currPlayer.id;
    this.placedPieces.push([y, x]);
    console.log("added to board");
  }

  /**
   * Place a game piece at the specified coordinates in the HTML game table
   */
  _placePieceInHtml(y, x){
    console.log("placing piece in html at yx:", y, x);
    // create the game piece and add classes to support styling
    const gamePiece = document.createElement("div");
    gamePiece.classList.add("gamePiece");
    gamePiece.style.backgroundColor = this.currPlayer.color;

    // select the game cell where the piece will be placed and place it
    const gameCell = document.getElementById(`game-cell-${y}-${x}`);
    gameCell.append(gamePiece);
  }

  /** End the game and announce results */
  _endGame(msg) {
    this.gameEnded = true;
    alertContainer.innerText = msg;
    alertContainer.style.display = '';
 }

  /** Checks for whether the game has ended and notifies the user if so */
  _checkForGameEnd() {
    console.log("checking for game end");
    // check for tie
    if(this.state[0].every(cell => cell.value !== null)) {
      return endGame("It's a tie!");
    }

    // check if it's a win
    // check each placed piece
    for (let i = 0; i < this.placedPieces.length; i++) {
      const px = this.placedPieces[i][0];
      const py = this.placedPieces[i][1];
      console.log("checking placed piece at xy", px, py);
      // check each valid coord set for this piece
      for (let j = 0; j < this.state[px][py].validCoordSets.length; j++) {
        const validCoordSets = this.state[px][py].validCoordSets[j];
        if(validCoordSets.every(c => this.state[c[0]][c[1]].value === this.currPlayer.id)) {
          return this._endGame(`Player ${this.currPlayer.name} has won!`);
        }
      }
    }

    // switch players
    this._switchPlayers();
  }

  /** Switches to the next player */
  _switchPlayers() {
    console.log("switching players")
    if (this.currPlayerIndex >= this.players.length - 1) {
      this.currPlayerIndex = 0;
      this.currPlayer = this.players[0]
      console.log("current player now:", this.currPlayer);
      return;
    }
    this.currPlayerIndex++;
    this.currPlayer = this.players[this.currPlayerIndex];
    console.log("current player now:", this.currPlayer);
  }

}

/** Starts a new game (and restarts any existing games) */
function startGame(evt) {
  board.innerHTML = "";
  alertContainer.style.display = 'none';

  let playerOneName = document.getElementById("playerOneName").value;
  let playerOneColor = document.getElementById("playerOneColor").value;
  let playerTwoName = document.getElementById("playerTwoName").value;
  let playerTwoColor = document.getElementById("playerTwoColor").value;

  if (playerOneName === playerTwoName) {
    alertContainer.innerText = "Player names must be unique!";
    alertContainer.style.display = '';
    return;
  }

  let playerOne = new Player(playerOneName, playerOneColor);
  let playerTwo = new Player(playerTwoName, playerTwoColor);

  game = new Game(playerOne, playerTwo);
  startButton.innerText = "Restart Game";
}


/** Handle click associated with dropping a game piece */
function handlePieceDrop(evt) {
  // get the target element's ID
  const targetId = evt.target.id;

  // extract the column number from the ID ('top-row-cell-x') using regex
  const regex = /(\d+)/;
  const targetColumn = Number(targetId.match(regex)[0]);
  console.log("target col using regex:", targetColumn);

  // extract the column number from the ID using charAt()
  console.log("id using charAt(targetId.length-1)", targetId.charAt(targetId.length - 1));
  // extract the column number from the ID using slice(-2)
  console.log("id using slice(-2)", targetId.slice(-2));

  game.dropPiece(targetColumn);
}
