// game.js
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreDisplay = document.getElementById('scoreDisplay');
const playerNameInput = document.getElementById('playerName');
const leaderboardList = document.getElementById('leaderboardList');

const CELL = 20;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;
let snake, dir, food, running, score, tickInterval, paused=false;

function reset() {
  snake = [{ x: Math.floor(COLS/2), y: Math.floor(ROWS/2) }];
  dir = { x: 1, y: 0 };
  spawnFood();
  score = 0;
  paused = false;
  updateScore();
}

function spawnFood() {
  while (true) {
    const f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!snake.some(s => s.x === f.x && s.y === f.y)) {
      food = f;
      return;
    }
  }
}

function drawCell(x, y, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.fillRect(x*CELL + 1, y*CELL + 1, CELL-2, CELL-2);
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // draw food
  drawCell(food.x, food.y, '#ff4d6d');
  // draw snake
  for (let i = 0; i < snake.length; i++) {
    drawCell(snake[i].x, snake[i].y, i === 0 ? '#00ffb3' : '#0af0a0');
  }
}

function step() {
  if (paused) return;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  // wrap-around or block? we'll block (game over) if leaving bounds
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    gameOver();
    return;
  }
  // self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    spawnFood();
    updateScore();
  } else {
    snake.pop();
  }
  draw();
}

function updateScore() {
  scoreDisplay.textContent = `Score: ${score}`;
}

function gameOver() {
  running = false;
  clearInterval(tickInterval);
  draw();
  setTimeout(() => {
    const name = (playerNameInput.value || 'Player').trim().slice(0,30);
    if (score > 0) {
      // submit score
      fetch('/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score })
      }).then(()=> fetchLeaderboard());
    } else {
      fetchLeaderboard();
    }
    alert('Game Over! Score: ' + score);
  }, 50);
}

function fetchLeaderboard() {
  fetch('/scores?limit=10').then(r => r.json()).then(list => {
    leaderboardList.innerHTML = '';
    for (const item of list) {
      const li = document.createElement('li');
      li.textContent = `${item.name} — ${item.score}`;
      leaderboardList.appendChild(li);
    }
  }).catch(()=>{/*ignore*/});
}

function startGame() {
  reset();
  if (running) clearInterval(tickInterval);
  // speed increases with score slightly
  const baseSpeedMs = 120;
  tickInterval = setInterval(() => {
    step();
  }, baseSpeedMs);
  running = true;
  draw();
}

document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (key === ' ' || key === 'Spacebar') { paused = !paused; return; }
  const map = {
    ArrowUp: {x:0,y:-1}, w: {x:0,y:-1}, W:{x:0,y:-1},
    ArrowDown:{x:0,y:1}, s:{x:0,y:1}, S:{x:0,y:1},
    ArrowLeft:{x:-1,y:0}, a:{x:-1,y:0}, A:{x:-1,y:0},
    ArrowRight:{x:1,y:0}, d:{x:1,y:0}, D:{x:1,y:0}
  };
  if (!map[key]) return;
  const nd = map[key];
  // prevent reversing
  if (snake.length > 1 && nd.x === -dir.x && nd.y === -dir.y) return;
  dir = nd;
});

startBtn.addEventListener('click', () => startGame());

// on load
fetchLeaderboard();
reset();
draw();
