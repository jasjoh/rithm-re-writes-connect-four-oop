"use strict";

/** AI Player Class Algo
 * Basic algo approach:
 * - pick a random column
 * - attempt to drop a piece
 * - if unsuccessful, pick a different random column
 *
 * Psuedo code:
 * 0. wait 5 seconds to pretend thinking about move
 * 1. create an array to keep track of available column
 * 2. generate a random number between 0 and array length
 * 3. keep track of that number and splice out that number from avail
 * 4. call _findEmptyCellInColumn() for that col
 * - if null, generate repeat steps 2 to 4
 * - if not null, call dropPiece() for that col
 */

const delayInMs = 200;

function delay(ms) {
  /**
   * This creates a new Promise for delay purposes.
   * The Promise constructor takes two functions as parameters:
   * - resolve function (a function which if called resolves promise successfully)
   * - reject function (a function which if called resolves promise unsuccessfully)
   * In this case, we are only providing it the resolve function we will call
   * Our resolve function is an anonymous function which calls itself after a set time
   */

  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * A class representing a Player
 * Requires providing a name and color (in hex) for the player
 * Optionally allows specifying if the player is AI or not
 */
class Player {
  constructor(name, color, aiFlag=false) {
    this.name = name;
    this.color = color;
    this.ai = aiFlag;
    this.id = generateMD5HashHex(name);
  }
}

/**
 * Extends the Player class to represent an AI player
 * Has a takeTurn() method which attempts to drop a piece in a random col
 * Pauses delayInMs before taking it's turn after takeTurn() is called
 */
class AiPlayer extends Player {
  constructor(name, color) {
    super(name, color);
    this.availCols = [];
  }

  async takeTurn() {
    console.log("I am taking my turn. I am:", this.name);
    await this._aiDropPiece();
  }

  /** Let's AI know it's a new game */
  newGame() {
    this.availCols = this._aiInitAvailCols();
  }

  _aiInitAvailCols() {
    let availCols = []
    let startCol = 0;
    while (startCol < game.width) {
      availCols.push(startCol);
      startCol++;
    }
    return availCols;
  }

  async _aiDropPiece() {
    console.log("_aiDropPiece() called for player:", this.name);
    await delay(delayInMs);
    let colToAttempt = Math.floor(Math.random() * this.availCols.length);
    if (await game.dropPiece(this.availCols[colToAttempt])) { return; }
    console.log("col was full so we're removing it from avail:", colToAttempt);
    this.availCols.splice(colToAttempt, 1);
    console.log("updated availCols after splice:", this.availCols);
    await this._aiDropPiece();
    return;
  }
}

/** Keeps track of a unique instance of the game */
class Game {
  constructor(width = 7, height = 6) {
    this.width = width;
    this.height = height;
    this.players = [];
    this.placedPieces = [];
    this.gameStarted = false;
    this.gameEnded = false;
  }

  /** Adds a player to an initialized game */
  addPlayer(player) {
    this.players.push(player);
  }

  /** Removes a player from an initialized game by passing their ID */
  removePlayer(playerId) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].id === playerId) {
        this.players.splice(i, 1);
      }
    }
  }

  /** Starts a game onces at least two players have been added */
  async startGame() {
    this.state = this._createGameState();
    this.htmlBoard = this._createHtmlBoard();

    // let AI players know it's a new game
    for (let player of this.players) {
      if (player instanceof AiPlayer) {
        player.newGame();
      }
    }

    // select starting player
    await this._updateCurrPlayer(true);

    console.log("game players:", this.players);
    console.log("current player:", this.currPlayer);

    this.gameEnded = false;
    this.gameStarted = true;
  }

  /**
   * Attempts to drop a game piece into a provided column
   * If room exists, adds that piece to the lowest open slots and returns true
   * If room does NOT exist (column is full), returns false
   */
  async dropPiece(col) {
    console.log("dropPiece() called for col:", col);
    if (this.gameEnded) { return; }
    // find the next available space (row) for the piece in the target column
    var targetRow = this._findEmptyCellInColumn(col);
    console.log("target row found:", targetRow);
    if (targetRow === null) {
      console.log("col was full, returning false to dropPiece()")
      return false;
    } // no space so ignore the click

    // add to the JS board and the HTML board
    this._addToBoard(targetRow, col);
    this._placePieceInHtml(targetRow, col);

    // check for win condition
    await this._checkForGameEnd();
    return true;
  }

  /**
   * Creates the initial game state represented by a matrix of game pieces
   * where each game piece has a value and an array of coord sets which are
   * valid potential winning board piece sequences.
   */
  _createGameState() {
    console.log("createGameState() called");

    const gameState = [];
    this.placedPieces = [];

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
    if (this.state[0][col].value !== null) {
      console.log("this col was full");
      return null;
    }

    let row = 0; // start at first row

    // loop through rows top to bottom until we either:
    // -- find a non-null cell (and return the slot above)
    // -- reach the last cell and return it
    while (row < this.height) {
      if (this.state[row][col].value !== null) {
        console.log("found a piece at row, col", row, " ", col);
        console.log("returning the row above:", row - 1);
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
  async _checkForGameEnd() {
    console.log("checking for game end");
    // check for tie
    if(this.state[0].every(cell => cell.value !== null)) {
      setTimeout(this._endGame("It's a tie!"), 10);
      return;
    }

    // check if it's a win
    // check each placed piece
    for (let i = 0; i < this.placedPieces.length; i++) {
      const px = this.placedPieces[i][0];
      const py = this.placedPieces[i][1];
      // console.log("checking placed piece at xy", px, py);
      // check each valid coord set for this piece
      for (let j = 0; j < this.state[px][py].validCoordSets.length; j++) {
        const validCoordSets = this.state[px][py].validCoordSets[j];
        if(validCoordSets.every(c => this.state[c[0]][c[1]].value === this.currPlayer.id)) {
          highlightPieces(validCoordSets);
          setTimeout(this._endGame(`Player ${this.currPlayer.name} has won!`), 10);
          return;
        }
      }
    }



    // switch players
    await this._updateCurrPlayer();
  }

  /** Switches to the next player */
  async _updateCurrPlayer(random) {
    console.log("switching players")

    if (random) {
      let totalPlayers = this.players.length;
      this.currPlayerIndex = Math.floor(Math.random() * totalPlayers);
      this.currPlayer = this.players[this.currPlayerIndex];
    } else if (this.currPlayerIndex >= this.players.length - 1) {
      this.currPlayerIndex = 0;
      this.currPlayer = this.players[0]
    } else {
      this.currPlayerIndex++;
      this.currPlayer = this.players[this.currPlayerIndex];
    }

    console.log("current player now:", this.currPlayer);

    _updateCurrPlayerDisplay(this);
    if (this.currPlayer instanceof AiPlayer) {
      console.log("ai player taking their turn");
      await this.currPlayer.takeTurn();
    }

    function _updateCurrPlayerDisplay(context) {
      currPlayerName.innerText = context.currPlayer.name;
    }

    return;
  }



}




