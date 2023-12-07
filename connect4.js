"use strict";

/** Connect Four game
 *
 * Players take turns dropping a piece into a 7 x 6 grid until one player
 * achieves four in a row (horiz, vert or diagonally) or until the board fills
 * up completely.
 */

/**
 * Matching Logic
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

let startButton = document.getElementById("startGame");
startButton.addEventListener("click", startGame);

let addPlayerButton = document.getElementById("addPlayer");
addPlayerButton.addEventListener("click", handleAddPlayer);

let playerList = document.getElementById("playerListCol");

let alertContainer = document.getElementById("alertContainer");
let board = document.getElementById('board');

let currPlayerName = document.getElementById("currPlayerName");


/** Starts a new game (and restarts any existing games) */
function startGame(evt) {
  board.innerHTML = "";
  alertContainer.style.display = 'none';

  let currPlayerSpan = document.getElementById("currPlayer");
  currPlayerSpan.style.display = '';

  game.startGame();
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

/** Handle click to add a human player */
function handleAddPlayer(evt) {
  let playerName = document.getElementById("playerName").value;

  if (playerName.trim() === '') {
    alertContainer.innerText = "Player names must not be empty!";
    alertContainer.style.display = '';
    return;
  }

  let playerColor = document.getElementById("playerColor").value;
  let playerAiToggle = document.getElementById("aiPlayerCheck").checked;

  for (let player of game.players) {
    if (player.name === playerName) {
      alertContainer.innerText = "Player names must be unique!";
      alertContainer.style.display = '';
      return;
    }
  }

  let player;

  if (playerAiToggle) {
    player = new AiPlayer(playerName, playerColor);
    console.log("new ai player added");
  } else {
    player = new Player(playerName, playerColor);
    console.log("new human player added");
  }
  game.addPlayer(player);
  addPlayerToHtmlList(player);
}

/** Handle click to remove a player */
function handleRemovePlayer(evt) {
  game.removePlayer(evt.target.id);
  removePlayerFromHtmlList(evt.target.id);
}

/** Generates the HTML to add a player to the current player list */
function addPlayerToHtmlList(player) {
  let playerDiv = document.createElement("div");
  playerDiv.classList.add("fw-light");
  playerDiv.id = `playerDiv${player.id}`;

  let playerName = document.createElement("span");
  let playerType = player instanceof AiPlayer ? 'AI' : 'Human';
  playerName.innerText = `${player.name} (${playerType})`;

  let removeButton = document.createElement("button");
  removeButton.classList.add("btn", "btn-sm", "btn-outline-danger", "mb-2", "mt-2");
  removeButton.innerText = 'Remove';
  removeButton.setAttribute('type', 'button');
  removeButton.id = player.id;
  removeButton.addEventListener('click', handleRemovePlayer);

  playerDiv.appendChild(playerName);
  playerDiv.appendChild(removeButton);

  playerList.appendChild(playerDiv);
}

function removePlayerFromHtmlList(playerId) {
  let playerDiv = document.getElementById(`playerDiv${playerId}`);
  playerDiv.remove();
}

let game = new Game();

/**
 * TODO:
 * - exception handling
 *
 */