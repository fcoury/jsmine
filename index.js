const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

canvas.addEventListener('click', e => {
  const pos = {
    x: e.pageX - canvas.offsetLeft,
    y: e.pageY - canvas.offsetTop,
  };
  board.onClick(pos.x, pos.y);
});

const BW = 20;
const BH = 20;
const NUM_BOMBS = 100;

let board;

class Board {
  constructor(width, height) {
    this.squares = [];
    this.width = width;
    this.height = height;

    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const square = new Square(x, y);
        row.push(square);
      }
      this.squares.push(row);
    }
  }

  print() {
    console.table(this.squares.map(r => r.map(s => s.c)));
  }

  get(x, y) {
    return this.squares[y][x];
  }

  openNeighbors(x, y) {
    for (let cy = Math.max(y-1, 0); cy <= Math.min(y+1, this.height-1); cy++) {
      for (let cx = Math.max(x-1, 0); cx <= Math.min(x+1, this.width-1); cx++) {
        if (cx === x && cy === y) continue;
        const sq = this.get(cx, cy);
        if (sq.isOpen() || sq.isBomb()) continue;

        sq.open();
        if (sq.isEmpty()) {
          this.openNeighbors(cx, cy);
        }
      }
    }
  }

  onClick(_x, _y) {
    const x = Math.floor(_x / BW);
    const y = Math.floor(_y / BH);
    const square = this.get(x, y);
    console.log('clicked', x, y, square);
    square.open();
    if (square.isEmpty()) {
      this.openNeighbors(x, y);
    }
    board.draw();
  }

  addBombs(num) {
    for (let i = 0; i < num; i++) {
      let x, y;
      while (true) {
        x = Math.floor(Math.random() * this.width);
        y = Math.floor(Math.random() * this.height);
        if (!this.isBomb(x, y)) {
          this.setBomb(x, y);
          break;
        }
      }
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.isBomb(x, y)) continue;

        let nb = 0;
        for (let cy = Math.max(y-1, 0); cy <= Math.min(y+1, this.height-1); cy++) {
          for (let cx = Math.max(x-1, 0); cx <= Math.min(x+1, this.width-1); cx++) {
            if (this.isBomb(cx, cy)) {
              nb += 1;
            }
          }
        }
        this.squares[y][x].c = nb > 0 ? nb : ' ';
      }
    }
  }

  isBomb(x, y) {
    return this.squares[y][x].isBomb();
  }

  setBomb(x, y) {
    this.squares[y][x].c = 'B';
  }

  draw() {
    this.squares.map(row => row.map(s => s.draw()));
  }
}

class Square {
  constructor(x, y, c) {
    this.x = x * BW;
    this.y = y * BH;
    this.c = c || ' ';
    this._open = false;
  }

  open() {
    this._open = true;
  }

  isEmpty() {
    return this.c === ' ';
  }

  isBomb() {
    return this.c === 'B';
  }

  isOpen() {
    return this._open;
  }

  draw() {
    const { x, y } = this;
    ctx.beginPath();
    ctx.rect(x, y, BW, BH);
    ctx.fillStyle = this._open ? '#fff' : '#bdbdbd';
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.rect(x, y, BW, BH);
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.closePath();

    if (this._open) {
      ctx.font = `${Math.floor(BW/2)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(this.c, x + BW / 2, y + BH / 2);
    }
  }
}

function newGame(width, height) {
  W = width;
  H = height;
  canvas.width = width * BW;
  canvas.height = height * BH;

  board = new Board(width, height);
  board.addBombs(width * height * 0.15);
  board.print();
  board.draw(ctx);
}

newGame(60, 40);
