const lanesX = [20, 50, 80];
const ball = document.getElementById('ball');
const lanes = document.getElementById('lanes');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');

let laneIndex = 1;
let score = 0;
let bestScore = Number(localStorage.getItem('rolling-viral-best') || 0);
let obstacles = [];
let gameOver = true;
let speed = 0.55;
let gravity = -0.0032;
let jumpVelocity = 0;
let jumpHeight = 0;

bestScoreEl.textContent = bestScore;

function setLane() {
  ball.style.left = `${lanesX[laneIndex]}%`;
}

function spawnObstacle() {
  const obs = document.createElement('div');
  obs.className = 'obstacle';
  obs.dataset.lane = String(Math.floor(Math.random() * 3));
  obs.dataset.z = '100';
  lanes.appendChild(obs);
  obstacles.push(obs);
}

function jump() {
  if (jumpHeight <= 0.01) {
    jumpVelocity = 0.06;
  }
}

function updateBall(dt) {
  jumpVelocity += gravity * dt;
  jumpHeight += jumpVelocity * dt;
  if (jumpHeight <= 0) {
    jumpHeight = 0;
    jumpVelocity = 0;
  }

  ball.style.bottom = `${10 + jumpHeight * 30}%`;
  ball.style.transform = `translateX(-50%) rotate(${performance.now() / 6}deg)`;
}

function hitTest(obs) {
  const z = Number(obs.dataset.z);
  const obsLane = Number(obs.dataset.lane);
  return obsLane === laneIndex && z < 16 && z > 6 && jumpHeight < 0.75;
}

function updateObstacles(dt) {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    let z = Number(obs.dataset.z);
    z -= speed * dt;
    obs.dataset.z = String(z);

    const lane = Number(obs.dataset.lane);
    const scale = Math.max(0.3, (100 - z) / 100);
    const y = Math.max(6, z * 0.8);

    obs.style.left = `${lanesX[lane]}%`;
    obs.style.bottom = `${y}%`;
    obs.style.transform = `translateX(-50%) scale(${scale})`;
    obs.style.opacity = `${Math.min(1, scale + 0.1)}`;

    if (hitTest(obs)) {
      endGame();
      return;
    }

    if (z < -5) {
      obs.remove();
      obstacles.splice(i, 1);
      score += 10;
      scoreEl.textContent = score;
      speed += 0.002;
    }
  }
}

let last = 0;
let spawnTimer = 0;

function loop(ts) {
  if (gameOver) return;

  const dt = Math.min(32, ts - last);
  last = ts;

  spawnTimer += dt;
  if (spawnTimer > 620 - Math.min(260, score / 2)) {
    spawnObstacle();
    spawnTimer = 0;
  }

  updateBall(dt);
  updateObstacles(dt);
  requestAnimationFrame(loop);
}

function startGame() {
  obstacles.forEach((o) => o.remove());
  obstacles = [];
  score = 0;
  speed = 0.55;
  scoreEl.textContent = '0';
  laneIndex = 1;
  setLane();
  jumpHeight = 0;
  jumpVelocity = 0;
  spawnTimer = 0;
  last = performance.now();
  gameOver = false;
  overlay.classList.remove('visible');
  requestAnimationFrame(loop);
}

function endGame() {
  gameOver = true;
  bestScore = Math.max(bestScore, score);
  localStorage.setItem('rolling-viral-best', String(bestScore));
  bestScoreEl.textContent = bestScore;
  overlay.classList.add('visible');
  overlay.querySelector('p').innerHTML = `💥 Fim de jogo!<br>Pontos: <strong>${score}</strong><br>Pressione Enter para tentar de novo`;
}

function moveLeft() {
  laneIndex = Math.max(0, laneIndex - 1);
  setLane();
}

function moveRight() {
  laneIndex = Math.min(2, laneIndex + 1);
  setLane();
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && gameOver) {
    startGame();
    return;
  }

  if (gameOver) return;

  if (['ArrowLeft', 'a', 'A'].includes(event.key)) moveLeft();
  if (['ArrowRight', 'd', 'D'].includes(event.key)) moveRight();
  if ([' ', 'ArrowUp', 'w', 'W'].includes(event.key)) {
    event.preventDefault();
    jump();
  }
});

startBtn.addEventListener('click', () => startGame());

document.querySelectorAll('.mobile-controls button').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (gameOver && action !== 'jump') startGame();
    if (action === 'left') moveLeft();
    if (action === 'right') moveRight();
    if (action === 'jump') jump();
  });
});

setLane();
