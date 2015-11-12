// TODO: Have view render once, then update view using jquery (to enable css transition effect).
// TODO: UX for game win.
// TODO: UX for game loss.
// TODO: Show a total of the cells left to reveal.
// TODO: Show a count of mines.
// TODO: Create a timer which counts how long it takes for the user to win the game.
// TODO: Tidy up css and id naming.

var GameState = Object.freeze({
	INPROGRESS: 'INPROGRESS',
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
	}
}

function GridModel(width, height, mineCount) {
	this.cells = [];
	this.width = width;
	this.height = height;
	this.mineCount = mineCount;
	this.cellsRevealedCount = 0;
	this.gameState = GameState.INPROGRESS;
	
	this.initCells();
	this.initMines();
}

GridModel.prototype = {
	
	getCells: function() {
		return this.cells;
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
		}
	},
	
	revealCell: function (x, y) {
		var cell = this.cells[x][y];
		
		if (cell.cellState === CellState.REVEALED) return;
		
		cell.cellState = CellState.REVEALED;
		this.cellsRevealedCount++;
		
		if (cell.hasMine()) {
			cell.detonateMine();
			this.gameState = GameState.LOST;
			console.log("GAME LOST!");
		}
		else if (this.hasWon()) {
			this.gameState = GameState.WON;
			console.log("GAME WON!");
		}
		else if (cell.adjacentMines === 0) {
			// Recursively reveal adjacent cells that have no adjacent mines				
			var adjacentCells = cell.getAdjacentCells();
			for (var a = 0; a < adjacentCells.length; a++) {
				if (adjacentCells[a].cellState === CellState.HIDDEN &&
					typeof adjacentCells[a].mineState === 'undefined') {
					this.revealCell(adjacentCells[a].x, adjacentCells[a].y);
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
		return (this.cellsRevealedCount === (this.cells.length - this.mineCount));
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
		if (cell.cellState !== CellState.REVEALED && cell.cellState !== CellState.FLAGGED) {
			cell.flag();
		}
		else if (cell.cellState === CellState.FLAGGED) {
			cell.unflag();
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

		for (var y = 0; y < this.model.height; y++) {
			
			html += "<div class='gridRow'>";
			
			for (var x = 0; x < this.model.width; x++) {

				// TODO: Move rendering of a cell to the cell model.
				var cell = cells[x][y];
				var cellClass = "gridCell";
				var cellText = "";

				if (cell.hasMine() && cell.mineState === MineState.DETONATED) {
					cellClass += " mineDetonated";
					cellText = "B";
				} 
				else if (cell.cellState === CellState.FLAGGED) {
					cellClass += " flagged";
					cellText = "F";
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
					}
					cellText = (cell.adjacentMines > 0) ? cell.adjacentMines : "";
				}
				html += "<div data-x='" + x + "' data-y='" + y
					+ "' class='" + cellClass + "'><div class='aligner-centre'>" + cellText + "</div></div>";
			}
			html += "</div>";
		}

		grid.html(html);
	}
}


// Controller
function MinesweeperController(model, view) {
	this.model = model;
	this.view = view;
}

MinesweeperController.prototype = {
	leftClickOnGridCell: function (x, y) {
		this.model.revealCell(x, y);
		// TODO: Have View listen to a change event raised by model instead of calling render here?
		this.view.render(); 
	},
	
	rightClickOnGridCell: function (x, y) {
		this.model.flagCell(x, y);
		// TODO: Have View listen to a change event raised by model instead of calling render here?
		this.view.render();
	}
}