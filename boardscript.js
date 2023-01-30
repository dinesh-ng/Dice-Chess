var board = null;
var game = new Chess();
var $status = $("#status");
var $fen = $("#fen");
var $pgn = $("#pgn");
var $dieroll = $("#dieroll");
const Die = ["P", "N", "B", "R", "Q", "K"];
var rolledPiece = "";

var whiteSquareGrey = "#a9a9a9";
var blackSquareGrey = "#696969";

function removeGreySquares() {
  $("#myboard .square-55d63").css("background", "");
}

function greySquare(square) {
  var $square = $("#myboard .square-" + square);

  var background = whiteSquareGrey;
  if ($square.hasClass("black-3c85d")) {
    background = blackSquareGrey;
  }

  $square.css("background", background);
}

function onDragStart(source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false;

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

function onDrop(source, target) {
  removeGreySquares();
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: "q", // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return "snapback";

  updateStatus();
}

function onMouseoverSquare(square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true,
  });

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to);
  }
}
function onMouseoutSquare(square, piece) {
  removeGreySquares();
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
  board.position(game.fen());
}

var config = {
  showNotation: true,
  position: "start",
  orientation: "white",
  draggable: true,
  dropOffBoard: "snapback",
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  // onMouseoutSquare: onMouseoutSquare,
  // onMouseoverSquare: onMouseoverSquare,
};

// function checkRoll(currentRoll) {
//   let moves = game.moves({
//     piece: currentRoll,
//   });

//   // exit if there are no moves available for this square
//   if (moves.length === 0) {
//     console.log("Invalid piece, rerolling!");
//     rollDice(game.turn());
//   } else {
//     rolledPiece = currentRoll;
//   }
//   return;
// }

function rollDice(color) {
  let n = Math.floor(Math.random() * 6);
  let currentRoll = color + Die[n];
  // if (color == "w") {
  //   console.log("Rolled piece is " + currentRoll);
  //   // checkRoll(currentRoll);
  //   // return whiteDie[n];
  // } else {
  //   // checkRoll(blackDie[n]);
  //   // return blackDie[n];
  // }
  console.log("Rolled piece is " + currentRoll);
  let validMoves = game.moves({
    piece: Die[n],
  });

  // exit if there are no moves available for this square
  if (validMoves.length === 0) {
    console.log("Invalid piece, rerolling!");
    rollDice(game.turn());
  } else {
    rolledPiece = currentRoll;
  }
  // return;
}

// $("#randomGame").on("click", () => {
//   const game = new Chess();
//   setTimeout(() => {
//     makeRandomMove(game);
//   }, 100);
//   console.log(game.pgn());
// });

// function makeRandomMove(game) {
//   const validMoves = game.moves();
//   if (game.game_over()) return;
//   var move = validMoves[Math.floor(Math.random() * validMoves.length)];
//   game.move(move);
//   board1.position(game.fen());
//   setTimeout(() => {
//     makeRandomMove(game);
//   }, 100);
// }

function updateStatus() {
  var status = "";
  var moveColor = "White";
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

  rollDice(game.turn());
  // console.log("Rolled piece is " + rolledPiece);

  $status.html(status);
  $fen.html(game.fen());
  $pgn.html(game.pgn());
  let dieroll =
    "Rolled piece is " + getTurn(game.turn()) + " " + getPieceName(rolledPiece);
  $dieroll.html(dieroll);
}

board = Chessboard("myboard", config);
// $(window).resize(board.resize);
// prevent scrolling on touch devices
$("#myboard").on(
  "scroll touchmove touchend touchstart contextmenu",
  function (e) {
    e.preventDefault();
  }
);
updateStatus();

function getTurn(color) {
  if (color == "w") return "white";
  else return "black";
}
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

// ****************************************************
// RANDOM vs RANDOM
// Uncomment below for tests
/*
function makeRandomMove() {
  if (game.game_over()) return;
  rollDice(game.turn());
  let possibleMoves = game.moves({
    piece: rolledPiece.slice(1, 2),
  });
  // exit if the game is over

  var randomIdx = Math.floor(Math.random() * possibleMoves.length);
  game.move(possibleMoves[randomIdx]);
  board.position(game.fen());
  updateStatus();
  window.setTimeout(makeRandomMove, 50);
}

window.setTimeout(makeRandomMove, 50);
*/
