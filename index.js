const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

canvas.addEventListener('click', e => {
  board.onClick(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
});
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  board.onRightClick(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
});

const BW = 25;
const BH = 25;

let board;

class Board {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.init();
  }

  init() {
    this.makeSquares();
    this.addBombs(this.width * this.height * 0.15);
    this.draw(ctx);
    this.active = true;
  }

  makeSquares() {
    this.squares = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
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

  canReveal(x, y) {
    const sq = this.get(x, y);
    console.log('sq value', sq.value);
    let total = 0;
    for (let cy = Math.max(y-1, 0); cy <= Math.min(y+1, this.height-1); cy++) {
      for (let cx = Math.max(x-1, 0); cx <= Math.min(x+1, this.width-1); cx++) {
        if (cx === x && cy === y) continue;
        const sq = this.get(cx, cy);
        if (sq.isBomb() && sq.isMarked()) {
          total += 1;
          console.log('found', sq);
        }
      }
    }
    console.log('sq value, total', sq.value, total);
    return total === sq.value;
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

  onRightClick(_x, _y) {
    const x = Math.floor(_x / BW);
    const y = Math.floor(_y / BH);
    const square = this.get(x, y);
    console.log('right clicked', x, y, square);
    if (square.isOpen()) {
      if (this.canReveal(x, y)) {
        this.openNeighbors(x, y);
      }
    } else {
      square.toggleMarked();
      this.bombsLeft = this.bombsLeft + (square.isMarked() ? -1 : 1);
    }
    board.draw();
  }

  onClick(_x, _y) {
    if (!this.active) {
      return this.init();
    }
    const x = Math.floor(_x / BW);
    const y = Math.floor(_y / BH);
    const square = this.get(x, y);
    console.log('clicked', x, y, square);
    square.open();
    if (square.isEmpty()) {
      this.openNeighbors(x, y);
    }
    if (this.isBomb(x, y)) {
      this.gameOver();
    }
    board.draw();
  }

  forEach(fn) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const square = this.get(x, y);
        fn(square, x, y);
      }
    }
  }

  gameOver() {
    this.active = false;
    this.forEach(sq => {
      if (sq.isBomb()) {
        sq.open(true);
      }
    });
  }

  set bombsLeft(bl) {
    console.log('bombsLeft', bl);
    document.getElementById('bombsLeft').innerText = bl;
    this._bombsLeft = bl;
  }

  get bombsLeft() {
    return this._bombsLeft;
  }

  addBombs(num) {
    console.log('addBombs', num);
    this.bombsLeft = num;
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
        this.squares[y][x].value = nb;
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
    this.value = 0;
    this._open = false;
    this._mark = false;
  }

  open(force) {
    if (!force && this._marked) return;
    this._marked = false;
    this._open = true;
  }

  mark() {
    if (this._open) return;
    this._marked = true;
    this.bombsLeft--;
  }

  toggleMarked() {
    if (this._open) return;
    this._marked = !this._marked;
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

  isMarked() {
    return this._marked;
  }

  draw() {
    const { x, y } = this;

    ctx.lineWidth = 1;
    ctx.lineHeight = 1;

    ctx.beginPath();
    ctx.rect(x, y, BW, BH);
    ctx.fillStyle = this._open ? '#fff' : '#bdbdbd';
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.rect(x, y, BW, BH);
    ctx.strokeStyle = '#ccc';
    ctx.stroke();
    ctx.closePath();

    if (this._open) {
      if (this.isBomb()) {
        const xf = 0.1;
        const yf = 0.1;
        const mx = Math.floor(BW * xf);
        const my = Math.floor(BH * yf);
        const ix = x + mx;
        const iy = y + my;
        const sx = BW - (mx*2);
        const sy = BH - (my*2);
        const fx = ix + sx;
        const fy = iy + sy;
        const af = Math.max(Math.floor(BW * 0.15), 1);

        // start from 50% width and top margin
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        ctx.moveTo(x + BW/2, iy);
        // draw to 50% width and bottom margin
        ctx.lineTo(x + BW/2, fy);
        // ctx.lineTo(0,0)
        // start from left margin and 50% height
        ctx.moveTo(ix, y + BH/2);
        // draw to right miargin and 50% height
        ctx.lineTo(fx, y + BH/2);
        ctx.stroke();

        // move to left margin + 1 and top margin + 1
        // draw to right margin - 1 and bottom margin -1
        // move to right margin-af and top margin+af
        // draw to left margin +1 and bottom margin-af
        ctx.beginPath();
        ctx.moveTo(ix+af, iy+af);
        ctx.lineTo(fx-af, fy-af);
        ctx.moveTo(fx-af, iy+af);
        ctx.lineTo(ix+af, fy-af);
        ctx.stroke();

        // move to mid point
        // draw circle for width - margin - 2
        ctx.beginPath();
        ctx.arc(x+BW/2, y+BH/2, (BH)/4, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();

        // draw square on top margin + 3
        ctx.beginPath();
        ctx.rect(ix+(af*2), iy+(af*2), af, af);
        ctx.fillStyle = '#fff';
        ctx.fill();
      } else {
        ctx.font = `${Math.floor(BW/2)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(this.c, x + BW / 2, y + BH / 2);
      }
    }

    if (this._marked) {
      const bx = 0.2;
      const by = 0.2;
      const ix = x + (Math.floor(BW * bx));
      const iy = y + (Math.floor(BH * by));

      const midf = (1-(by*2))/2;

      ctx.beginPath();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineHeight = 2;
      // start at 10% width
      // start at 10% height
      ctx.moveTo(ix, y + (Math.floor(BH * (1-by))));
      // line from start to 90% height
      ctx.lineTo(ix, iy);
      // line from start to 90% width, 25% height
      ctx.lineTo(x + (Math.floor(BW * (1-bx))), y + (Math.floor(BH * midf)))
      // line from 90% width, 25% height to 10% width, 50% height
      ctx.lineTo(ix, y + (Math.floor(BH * midf*2)))
      ctx.stroke();
      ctx.closePath();
    }
  }
}

function newGame(width, height) {
  W = width;
  H = height;
  canvas.width = width * BW;
  canvas.height = height * BH;

  board = new Board(width, height);
}

newGame(20, 10);
