// TODO: Tidy up css and id naming.
// TODO: Apply AirBnB style guide.
// TODO: Use a templating plugin for building html?

var GameState = Object.freeze({
	NOTSTARTED: 'NOTSTARTED',
	STARTED: 'STARTED',
	WON: 'WON',
	LOST: 'LOST'
})

var CellState = Object.freeze({
	HIDDEN: 'HIDDEN',
	REVEALED: 'REVEALED',
	FLAGGED: "FLAGGED"
})

var MineState = Object.freeze({
	UNDETONATED: 'UNDETONATED',
	DETONATED: 'DETONATED'
});

var model;
var view;
var controller;

var startTime;
var endTime;
var intervalId;
var timeInterval = 1000;

function init() {

	initTimer();
		
	model = new GridModel(
		$('#width').val(), 
		$('#height').val(), 
		$('#mineCount').val());

	view = new MinesweeperView(model, { 'grid' : $('#grid') });
	controller = new MinesweeperController(model, view);

	view.render();
}

function initTimer() {
	startTime = undefined;
	endTime = undefined;

	if (intervalId !== undefined) {
		clearInterval(intervalId);
	}

	intervalId = setInterval(function () {
		updateElapsedTimeDisplay();
	}, timeInterval);
}

function initEvents() {
	
	// Start game button clicked
	$("#startGameButton").on("click", function () {
		console.log("start button clicked");
		init();
	});
	
	// Game difficulty changed
	$("#gameDifficulty").on("change", function (event) {
		var gameDifficultySelect = document.getElementById("gameDifficulty");
		var difficulty = gameDifficultySelect.options[gameDifficultySelect.selectedIndex].value;
		
		// TODO: Make input text fields editable only when custom is selected.
		switch(difficulty) {
			case "Beginner":
				$('#width').val("9");
				$('#height').val("9");
				$('#mineCount').val("10");
				break;
			case "Intermediate":
				$('#width').val("16");
				$('#height').val("16");
				$('#mineCount').val("40");
				break;
			case "Advanced":
				$('#width').val("30");
				$('#height').val("16");
				$('#mineCount').val("99");
				break;
			case "Custom":
				$('#width').val("30");
				$('#height').val("16");
				$('#mineCount').val("99");
				break;
		}
	});
	
	// Left mouse click on grid cell
	$(document).on("click", ".gridCell", function (event) {
		var leftClickOnGridCellEvent = new CustomEvent("leftClickOnGridCellEvent", {
			detail: { x: event.target.dataset.x, y: event.target.dataset.y } 
		});
		document.dispatchEvent(leftClickOnGridCellEvent);
	});
	
	// Right mouse click on grid cell
	$(document).on("contextmenu", ".gridCell", function(event) {
		// Stops context menu from appearing
		event.preventDefault(); 
		var rightClickOnGridCellEvent = new CustomEvent("rightClickOnGridCellEvent", { 
			detail: { x: event.target.dataset.x, y: event.target.dataset.y } 
		});
		document.dispatchEvent(rightClickOnGridCellEvent);
	});
	
	// Listeners
	// Left mouse click on grid cell
	document.addEventListener("leftClickOnGridCellEvent", function (event) {
		controller.leftClickOnGridCell(event.detail.x, event.detail.y);
	});
	
	// Right mouse click on grid cell
	document.addEventListener("rightClickOnGridCellEvent", function (event) {
		controller.rightClickOnGridCell(event.detail.x, event.detail.y);
	});
}


// Models
function CellModel(grid, x, y) {
	this.grid = grid;
	this.x = x;
	this.y = y;
	this.cellState = CellState.HIDDEN;
	this.adjacentMines = 0;
}

CellModel.prototype = {
	
	cellNorth: function () {
		return (this.y > 0)
			? this.grid.cells[this.x][this.y - 1]
			: null;
	},
	
	cellNEast: function () { 
		return (this.cellNorth() !== null)
			? this.cellNorth().cellEast()
			: null;
	},

	cellEast: function () {
		return (this.x < (this.grid.width - 1)) 
			? this.grid.cells[this.x + 1][this.y] 
			: null;
	},

	cellSEast: function () {
		return (this.cellEast() !== null)
			? this.cellEast().cellSouth()
			: null;
	},

	cellSouth: function () {
		return (this.y < (this.grid.height - 1)) 
			? this.grid.cells[this.x][this.y + 1] 
			: null;
	},
	
	cellSWest: function () {
		return (this.cellSouth() !== null)
			? this.cellSouth().cellWest()
			: null;	
	},

	cellWest: function () {
		return (this.x > 0) 
			? this.grid.cells[this.x - 1][this.y] 
			: null;
	},
	
	cellNWest: function () {
		return (this.cellWest() !== null)
			? this.cellWest().cellNorth()
			: null;
	},
	
	getAdjacentCells: function () {
		var adjacentCells = [];
		
		if (this.cellNorth() !== null) adjacentCells.push(this.cellNorth());
		if (this.cellNEast() !== null) adjacentCells.push(this.cellNEast());
		if (this.cellEast() !== null) adjacentCells.push(this.cellEast());
		if (this.cellSEast() !== null) adjacentCells.push(this.cellSEast());
		if (this.cellSouth() !== null) adjacentCells.push(this.cellSouth());
		if (this.cellSWest() !== null) adjacentCells.push(this.cellSWest());
		if (this.cellWest() !== null) adjacentCells.push(this.cellWest());
		if (this.cellNWest() !== null) adjacentCells.push(this.cellNWest());
		
		return adjacentCells;
	},
	
	setMine: function () {
		this.mineState = MineState.UNDETONATED;
	},
	
	hasMine: function () {
		return typeof this.mineState !== 'undefined';
	},
	
	detonateMine: function () {
		this.mineState = MineState.DETONATED;
	},
	
	reveal: function() {
		this.cellState = CellState.REVEALED
	},
	
	flag: function () {
		this.cellState = CellState.FLAGGED;
	},
	
	unflag: function () {
		this.cellState = CellState.HIDDEN;
	},
	
	hasFlag: function() {
		return this.cellState === CellState.FLAGGED;
	}
}

function GridModel(width, height, mineCount) {
	this.cells = [];
	this.cellsWithMines = [];
	this.width = width;
	this.height = height;
	this.mineCount = mineCount;
	this.cellsRevealedCount = 0;
	this.flagsAvailable = mineCount;
	this.gameState = GameState.NOTSTARTED;
	
	this.initCells();
	this.initMines();
}

GridModel.prototype = {
	
	getCells: function() {
		return this.cells;
	},
	
	getCell: function(x, y) {
		return this.cells[x][y];	
	},
	
	initCells: function () {
		for (var x = 0; x < this.width; x++) {
			this.cells[x] = []
			for (var y = 0; y < this.height; y++) {
				this.cells[x][y] = new CellModel(this, x, y);
			}
		}
	},
	
	initMines: function () {
		for (var b = 0; b < this.mineCount; b++) {
			var mine = this.createMine(this.width - 1, this.height - 1);
			var cell = this.cells[mine.x][mine.y];
			cell.setMine();
			cell.getAdjacentCells().forEach(function (c) {
				c.adjacentMines++;
			});
			this.cellsWithMines.push(cell);
		}
	},
	
	revealCell: function (x, y) {
		var cell = this.cells[x][y];
		
		if (this.gameState === GameState.NOTSTARTED) {
			this.gameState = GameState.STARTED;
			startTime = Date.now();
		}
		
		if (cell.cellState === CellState.REVEALED) return;
		
		cell.cellState = CellState.REVEALED;
		this.cellsRevealedCount++;
		
		if (cell.hasMine()) {
			cell.detonateMine();

			// Reveal all mines
			for(var m = 0; m < this.cellsWithMines.length; m++) {
				var otherMine = this.cellsWithMines[m];
				otherMine.detonateMine();
			}
			this.gameState = GameState.LOST;
			endTime = Date.now();
			console.log("GAME LOST!");
		}
		else if (this.hasWon()) {
			this.gameState = GameState.WON;
			endTime = Date.now();
			console.log("GAME WON!");
		}
		else if (cell.adjacentMines === 0) {
			// Recursively reveal adjacent cells that have no adjacent mines				
			var adjacentCells = cell.getAdjacentCells();
			for (var a = 0; a < adjacentCells.length; a++) {
				var adjacentCell = adjacentCells[a];
				if (adjacentCell.cellState === CellState.HIDDEN
					&& !adjacentCell.hasMine()) {
					this.revealCell(adjacentCell.x, adjacentCell.y);
				}
			}
		}
	},
	
	createMine: function (xMin, yMin) {
		var mine;
		do { mine = this.getRandomCoordinate(xMin, yMin); }
		while (this.cells[mine.x][mine.y].hasMine());

		return mine;
	},
	
	hasWon: function() {		
		return (this.cellsRevealedCount === 
			((this.cells.length * this.cells[0].length) - this.mineCount));
	},

	getRandomCoordinate: function (xMin, yMin) {
		return {
			x: this.getRandomInt(0, xMin),
			y: this.getRandomInt(0, yMin)
		};
	},
	
	getRandomInt: function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},
	
	flagCell: function (x, y) {
		var cell = this.cells[x][y];
		
		if (this.gameState === GameState.NOTSTARTED) {
			this.gameState = GameState.STARTED;
			startTime = Date.now();
		}
		
		if (cell.cellState !== CellState.REVEALED
			&& cell.cellState !== CellState.FLAGGED) {
			cell.flag();
			this.flagsAvailable--;
		}
		else if (cell.cellState === CellState.FLAGGED) {
			cell.unflag();
			this.flagsAvailable++;
		}
	}
}


// View
function MinesweeperView(model, elements) {
	this.model = model;
	this.elements = elements;
}

MinesweeperView.prototype = {
	render: function () {
		var cells = this.model.getCells();
		var grid = this.elements.grid;

		var html = "";
		grid.html("");

		$("#flagsAvailableValue").text(this.model.flagsAvailable);
		
		html += "<div id='statusPanel'>";
		html +=	"<div id='status'></div>";
		html += "</div>";

		for (var y = 0; y < this.model.height; y++) {
			
			html += "<div class='gridRow'>";
			
			for (var x = 0; x < this.model.width; x++) {
				var cell = cells[x][y];
				var cellClass = "gridCell";
				var cellText = "";

				if (cell.hasMine() && cell.mineState === MineState.DETONATED) {
					cellClass += " mineDetonated";
					cellText = "<span class='fa fa-bomb'></span>";
				} 
				else if (cell.cellState === CellState.FLAGGED) {
					cellClass += " flagged";
					cellText = "<span class='fa fa-flag'></span>"
				}
				else if (cell.cellState === CellState.REVEALED) {
					switch (cell.adjacentMines) {
						case 0:
							cellClass += " noMine";
							break;
						case 1:
							cellClass += " oneMine";
							break;
						case 2:
							cellClass += " twoMines";
							break;
						case 3:
							cellClass += " threeMines";
							break;
						case 4:
							cellClass += " fourMines";
							break;
						case 5:
							cellClass += " fiveMines";
							break;
						case 6:
							cellClass += " sixMines";
							break;
						case 7:
							cellClass += " sevenMines";
							break;
						case 8:
							cellClass += " eightMines";
							break;
					}
					cellText = (cell.adjacentMines > 0) ? cell.adjacentMines : "";
				}
				html += "<div data-x='" + x + "' data-y='" + y
					+ "' class='" + cellClass + "'><div class='aligner-centre'>" + cellText + "</div></div>";
			}
			html += "</div>";
		}

		grid.html(html);
		
		if(this.model.gameState === GameState.WON) {
			$('#status').text("Mission Succeeded: All mines identified!");
		} else if (this.model.gameState === GameState.LOST) {
			$('#status').text("Mission Failed: You hit a mine!");
		}
	}
}


function getFormattedElapsedTime(startTime, endTime) {
	
	var elapsedTime = endTime - startTime;
	
	var hours = Math.floor(elapsedTime / 1000 / 60 / 60);
	elapsedTime -= hours * 1000 * 60 * 60;
	
	var minutes = Math.floor(elapsedTime / 1000 / 60);
	elapsedTime -= minutes * 1000 * 60;
	
	var seconds = Math.floor(elapsedTime / 1000);
	elapsedTime -= seconds * 1000;

	var mm = ("0" + minutes).slice(-2);
	var ss = ("0" + seconds).slice(-2);

	return hours + ":" + mm + ":" + ss;
}


function updateElapsedTimeDisplay() {
	if (typeof startTime === "undefined") {
		$("#elapsedTimeValue").text("0:00:00");
	} else if (typeof endTime === "undefined") {
		$("#elapsedTimeValue").text(getFormattedElapsedTime(startTime, Date.now()));
	} else {
		$("#elapsedTimeValue").text(getFormattedElapsedTime(startTime, endTime));
	}
}


// Controller
function MinesweeperController(model, view) {
	this.model = model;
	this.view = view;
}

MinesweeperController.prototype = {
	leftClickOnGridCell: function (x, y) {
		if (this.model.gameState === GameState.LOST
			|| this.model.gameState === GameState.WON
			|| this.model.getCell(x, y).hasFlag()) return;

		this.model.revealCell(x, y);
		this.view.render(); 
	},
	
	rightClickOnGridCell: function (x, y) {
		if (this.model.gameState === GameState.LOST
			|| this.model.gameState === GameState.WON
			|| (this.model.flagsAvailable === 0 && !this.model.getCell(x, y).hasFlag())) return;
		
		this.model.flagCell(x, y);
		this.view.render();
	}
}