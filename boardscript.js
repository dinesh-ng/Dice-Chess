let board = null;
const game = new Chess();
const $status = $("#status");
const $fen = $("#fen");
const $pgn = $("#pgn");
const $dieroll = $("#dieroll");
const Die = ["P", "N", "B", "R", "Q", "K"];
let rolledPiece = "";
let startingSquares = [];

/*************Experimental Dice **/

/******************************* */

// var whiteSquareGrey = "#a9a9a9";
const whiteSquareGrey = "#99d7a0";
// var blackSquareGrey = "#696969";
const blackSquareGrey = "#98cf8c9e";

/*****************Utility functions************ */
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

function highlightPiece(square) {
  var $square = $("#myboard .square-" + square);

  $square.addClass("highlight-black");
}
function removeHighlight() {
  startingSquares.forEach((square) => {
    var $square = $("#myboard .square-" + square);
    $square.removeClass("highlight-black");
  });
}

/**********highlights clicked squares on drag and drop****************/
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
/**********************************************************/

/************ Called on dragging the piece ********************/
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

/***********Called on piece drop*************************** */
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

/***********Highlights valid squares for the piece************* */
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

/*********************Roll the Dice and log the roll, auto reroll when invalid**************** */

function rollDice(color) {
  removeHighlight();
  startingSquares = [];
  // removeHighlight();
  if (game.game_over()) return;
  let n = Math.floor(Math.random() * 6);
  let currentRoll = color + Die[n];
  console.log("Rolled piece is " + currentRoll);
  let validMoves = game.moves({
    piece: Die[n],
    verbose: true,
  });

  // exit if there are no moves available for this square
  if (validMoves.length === 0) {
    console.log("Invalid piece, rerolling!");
    rollDice(game.turn());
  } else {
    // console.log(validMoves);
    rolledPiece = currentRoll;
    validMoves.forEach((move) => {
      startingSquares.push(move.from);
    });
    startingSquares.forEach((e) => {
      highlightPiece(e);
    });
    // startingSquares.push(validMoves.from);
  }
}

/*****************Update Game Status after each move********** */
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

  // removeHighlight();
  // startingSquares = [];
  rollDice(game.turn());

  // console.log("Rolled piece is " + rolledPiece);

  $status.html(status);
  $fen.html(game.fen());
  $pgn.html(game.pgn());
  if (!game.game_over()) {
    let dierollText =
      "Rolled piece is " +
      getTurn(game.turn()) +
      " " +
      getPieceName(rolledPiece);
    $dieroll.html(dierollText);
  }
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
  // onMouseoutSquare: onMouseoutSquare,
  // onMouseoverSquare: onMouseoverSquare,
};
board = Chessboard("myboard", config);
// board = Chessboard("testboard", config);

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
