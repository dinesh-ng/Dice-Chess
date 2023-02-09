const game = new Chess();
const STATUS = $("#status");
const FEN = $("#fen");
const PGN = $("#pgn");
const DIETEXT = $("#dieText");
let IAM = "white";
const Die = ["P", "N", "B", "R", "Q", "K"];
const whiteSquareHighlight = "#99d7a0";
const blackSquareHighlight = "#98cf8c9e";
let board = null;
let gameSuspend = false;
let gameRunning = false;
let validPieceSquares = [];
let rolledPiece = "";

/**Client Socket IO */
const socket = io();
socket.on("broadcast", (connected) => {
  $("#connectedClients").text(`Online: ${connected}`);
});
socket.on("game-started", (playingSide) => {
  gameRunning = true;
  startButton.style.display = "none";
  board.orientation(playingSide);
  IAM = "black";
  updateStatus();
});
socket.on("roll-received", (obj) => {
  dierollAnimation(obj.randomNumber, obj.validMoves);
  rolledPiece = obj.rolledPiece;
  updateStatus();
});
socket.on("move-received", (move) => {
  // console.log(move);
  makeMove(move.from, move.to);
  updateBoard(game.fen());
  removeSquareAnimation();
  validPieceSquares = [];
  updateStatus();
});

/****** Start Button************/
const startButton = document.querySelector("#startButton");
startButton.addEventListener("click", () => {
  socket.emit("start-game", {
    playingSide: "black",
  });
  gameRunning = true;
  startButton.style.display = "none";
  // rollDice(game.turn());
});

/*************Experimental Dice **/
const dice = document.querySelector(".dice");
const rollBtn = document.querySelector(".roll");
rollBtn.addEventListener("click", () => {
  if (gameSuspend || !gameRunning) {
    return;
  }
  if (
    (IAM === "white" && game.turn() == "b") ||
    (IAM === "black" && game.turn() == "w")
  ) {
    return false;
  }
  rollDice(game.turn());
});

/*****************Utility functions************ */
/**syncBoard */
function syncBoard(currStatus, currFen, currPGN, currdierollText) {
  STATUS.html(currStatus);
  FEN.html(currFen);
  PGN.html(currPGN);
  DIETEXT.html(currdierollText);
}
/**Returns move on the chess logic, null if invalid move. Note: does not update the board */
function makeMove(startSquare, endSquare) {
  const move = game.move({
    from: startSquare,
    to: endSquare,
    promotion: "q", // NOTE: always promote to a queen for example simplicity
  });
  return move;
}
/**Update board to given fen */
function updateBoard(fen) {
  board.position(fen);
}
/**Returns turn color as string, i/p is "b" or "w"*/
function getTurn(color) {
  if (color == "w") return "white";
  else return "black";
}
/**Returns piece name as string, ex. input: bN=>Knight */
function getPieceName(piece) {
  switch (piece.slice(1, 2)) {
    case "N":
      return "Knight";
    case "P":
      return "Pawn";
    case "K":
      return "King";
    case "Q":
      return "Queen";
    case "B":
      return "Bishop";
    case "R":
      return "Rook";
    default:
      return "Error!";
  }
}
/**Flicker rolled piece starting squares */
function animateSquare(square) {
  var $square = $("#myboard .square-" + square);

  $square.addClass("highlight-valid");
}
/**Removes starting square animation */
function removeSquareAnimation() {
  validPieceSquares.forEach((square) => {
    var $square = $("#myboard .square-" + square);
    $square.removeClass("highlight-valid");
  });
}
/**Removes legal move highlights */
function removeValidHighlights() {
  $("#myboard .square-55d63").css("background", "");
}
/**Adds legal move highlights to given square*/
function addValidHighlights(square) {
  var $square = $("#myboard .square-" + square);
  var background = whiteSquareHighlight;
  if ($square.hasClass("black-3c85d")) {
    background = blackSquareHighlight;
  }
  $square.css("background", background);
}

/**On piece drag/click */
function onDragStart(source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over() || gameSuspend) return false;
  if (
    (IAM === "white" && piece.search(/^b/) !== -1) ||
    (IAM === "black" && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
  // only pick up pieces for the side to move
  if (
    (game.turn() === "w" && piece.search(/^b/) !== -1) ||
    (game.turn() === "b" && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
  //only pick rolled piece
  const regex = new RegExp(`^${rolledPiece}`);
  if (piece.search(regex) == -1) {
    return false;
  }
  onMouseoverSquare(source, piece);
}
/**On piece drop, note: does not means that move is complete yet. */
function onDrop(source, target) {
  removeValidHighlights();
  // see if the move is legal
  const move = makeMove(source, target);
  // illegal move
  if (move === null) return "snapback";
  socket.emit("move-played", { from: source, to: target });
  updateStatus();
}
/**update the board position after the piece snap for castling, en passant, pawn promotion*/
function onSnapEnd() {
  removeSquareAnimation();
  validPieceSquares = [];
  board.position(game.fen());
}
/**Highlights all legal squares from given square */
function onMouseoverSquare(square, piece) {
  if (gameSuspend) return;
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true,
  });
  // exit if there are no moves available for this square
  if (moves.length === 0) return;
  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    addValidHighlights(moves[i].to);
  }
}
function onMouseoutSquare(square, piece) {
  removeValidHighlights();
}

/**Dice Roll Animation i/p is piece index(1-6) */
function dierollAnimation(index, validMoves) {
  // const random = n + 1;
  dice.style.animation = "rolling 2.5s";
  setTimeout(() => {
    switch (index) {
      case 1:
        dice.style.transform = "rotateX(0deg) rotateY(0deg)";
        break;

      case 6:
        dice.style.transform = "rotateX(180deg) rotateY(0deg)";
        break;

      case 2:
        dice.style.transform = "rotateX(-90deg) rotateY(0deg)";
        break;

      case 5:
        dice.style.transform = "rotateX(90deg) rotateY(0deg)";
        break;

      case 3:
        dice.style.transform = "rotateX(0deg) rotateY(90deg)";
        break;

      case 4:
        dice.style.transform = "rotateX(0deg) rotateY(-90deg)";
        break;

      default:
        break;
    }
    dice.style.animation = "none";
    // if (!game.game_over()) {
    //   let dierollText =
    //     "Rolled piece is " +
    //     getTurn(game.turn()) +
    //     " " +
    //     getPieceName(rolledPiece);
    //   DIETEXT.html(dierollText);
    // }
    validMoves.forEach((move) => {
      validPieceSquares.push(move.from);
    });
    validPieceSquares.forEach((e) => {
      animateSquare(e);
    });
    gameSuspend = false;
  }, 2600);
}
/**Rolls the die and sets rolled piece, auto reroll for invalid */
function rollDice(color) {
  if (game.game_over()) return;
  gameSuspend = true;
  // DIETEXT.html("Rolling......");
  removeSquareAnimation();
  validPieceSquares = [];
  //roll logic
  let n = Math.floor(Math.random() * 6);
  let currentRoll = color + Die[n];
  // console.log("Rolled piece is " + currentRoll);
  let validMoves = game.moves({
    piece: Die[n],
    verbose: true,
  });

  // exit if there are no moves available for this square
  if (validMoves.length === 0) {
    // console.log("Invalid piece, rerolling!");
    rollDice(game.turn());
  } else {
    console.log("Current roll: " + currentRoll);
    dierollAnimation(n + 1, validMoves);
    rolledPiece = currentRoll;
    socket.emit("roll-complete", {
      rolledPiece: rolledPiece,
      randomNumber: n + 1,
      validMoves: validMoves,
    });
  }
}

/**Update html elements for current game status */
function updateStatus() {
  let status = "";
  let moveColor = "White";
  if (game.turn() === "b") {
    moveColor = "Black";
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = "Game over, " + moveColor + " is in checkmate.";
  }

  // draw?
  else if (game.in_draw()) {
    status = "Game over, drawn position";
  }

  // game still on
  else {
    status = moveColor + " to move";

    // check?
    if (game.in_check()) {
      status += ", " + moveColor + " is in check";
    }
  }
  STATUS.html(`<p>${status}</p>`);
  FEN.html(`<p>${game.fen()}</p>`);
  PGN.html(`<p>${game.pgn()}</p>`);
}

/******************************CONFIG FOR BOARD***************** */
const config = {
  showNotation: true,
  position: "start",
  orientation: "white",
  draggable: true,
  dropOffBoard: "snapback",
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
};
board = Chessboard("myboard", config);
/**Prevents scrolling on touch devices  */
$("#myboard").on("scroll touchmove touchend touchstart contextmenu", (e) => {
  e.preventDefault();
});
updateStatus();

// ****************************************************
// RANDOM vs RANDOM
// Uncomment below for tests

// function makeRandomMove() {
//   if (game.game_over()) return;
//   rollDice(game.turn());
//   let possibleMoves = game.moves({
//     piece: rolledPiece.slice(1, 2),
//   });
//   // exit if the game is over

//   var randomIdx = Math.floor(Math.random() * possibleMoves.length);
//   game.move(possibleMoves[randomIdx]);
//   board.position(game.fen());
//   updateStatus();
//   window.setTimeout(makeRandomMove, 50);
// }

// // makeRandomMove();
// window.setTimeout(makeRandomMove, 50);
