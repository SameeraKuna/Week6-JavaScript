/* DOM Elements */
const game = document.getElementById("game");
const basket = game.querySelector(".basket");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const comboEl = document.getElementById("combo");
const timeEl = document.getElementById("time");
const comboText = document.getElementById("comboText");
const highEl = document.getElementById("high");
const modeSelect = document.getElementById("mode");
const difficultySelect = document.getElementById("difficulty");
const modal = document.getElementById("gameOverModal");
const finalScore = document.getElementById("finalScore");
const tryAgainBtn = document.getElementById("tryAgainBtn");

/* Game State */
let score = 0, lives = 5, combo = 0, multiplier = 1;
let spawnRate = 800, baseSpeed = 2;
let timer = null, timeLeft = 60;
let highScore = parseInt(localStorage.getItem("fruitHigh") || 0);
highEl.textContent = highScore;

const fruits = ["🍎","🍊","🍌","🍓","🍇","🍑","🍍"];
const bomb = "💣";

/* Utility: Animate numeric values */
function animateValue(el, start, end, duration){
  let startTime = null;
  function step(timestamp){
    if(!startTime) startTime = timestamp;
    const progress = Math.min((timestamp-startTime)/duration,1);
    el.textContent = Math.floor(progress*(end-start)+start);
    if(progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* Apply Difficulty */
function applyDifficulty(){
  const difficulty = difficultySelect.value;
  const config = { easy:[1000,2], medium:[800,3], hard:[600,4] };
  [spawnRate, baseSpeed] = config[difficulty];
}
difficultySelect.addEventListener("change", applyDifficulty);
applyDifficulty();

/* Mode Control */
modeSelect.addEventListener("change", ()=> {
  if(modeSelect.value === "timer") startTimer();
  else { clearInterval(timer); timeEl.textContent = "--"; }
});

/* Timer */
function startTimer(){
  clearInterval(timer);
  timeLeft = 60;
  timeEl.textContent = timeLeft;
  timer = setInterval(()=>{
    timeLeft--;
    timeEl.textContent = timeLeft;
    if(timeLeft <= 0) endGame();
  }, 1000);
}

/* Basket Control */
game.addEventListener("mousemove", e => {
  const rect = game.getBoundingClientRect();
  basket.style.left = (e.clientX - rect.left) + "px";
});

/* Spawn Fruit */
function spawnFruit(){
  const fruit = document.createElement("div");
  fruit.className = "fruit";
  const type = Math.random() < 0.12 ? "bomb" : "fruit";
  fruit.textContent = type === "bomb" ? bomb : fruits[Math.floor(Math.random()*fruits.length)];
  fruit.dataset.type = type;
  fruit.style.left = Math.random()*(game.clientWidth-40) + "px";
  fruit.style.top = "-40px";
  game.appendChild(fruit);

  const speed = baseSpeed + Math.random()*2;
  function fall(){
    const top = parseFloat(fruit.style.top) + speed;
    fruit.style.top = top + "px";
    checkCollision(fruit);
    if(top <= game.clientHeight) requestAnimationFrame(fall);
    else { if(type==="fruit"){ combo=0; multiplier=1; comboEl.textContent=combo } fruit.remove(); }
  }
  requestAnimationFrame(fall);
}

/* Collision Detection */
function checkCollision(fruit){
  const r1 = fruit.getBoundingClientRect(), r2 = basket.getBoundingClientRect();
  if(r1.bottom >= r2.top && r1.left < r2.right && r1.right > r2.left){
    if(fruit.dataset.type === "bomb"){
      explodeBomb(fruit);
      lives--; livesEl.textContent = lives;
      combo = 0; multiplier = 1; comboEl.textContent = combo;
    } else {
      combo++;
      multiplier = combo>=10 ? 3 : combo>=5 ? 2 : 1;
      const oldScore = score;
      score += multiplier;
      animateValue(scoreEl, oldScore, score, 200);
      comboEl.textContent = combo;
      showCombo();
      sliceAnimation(fruit);
      spawnParticles(fruit);
    }
    fruit.remove();
    if(lives <= 0) endGame();
  }
}

/* Combo Text */
function showCombo(){
  comboText.textContent = "COMBO x" + combo;
  comboText.style.opacity = 1;
  comboText.classList.add("comboGlow");
  setTimeout(()=>{
    comboText.style.opacity = 0;
    comboText.classList.remove("comboGlow");
  },500);
}

/* Slice Animation */
function sliceAnimation(fruit){ fruit.classList.add("slice"); }

/* Particles */
function spawnParticles(fruit){
  const left = fruit.style.left, top = fruit.style.top;
  for(let i=0;i<6;i++){
    const p = document.createElement("div");
    p.className = "particle";
    p.textContent = "✨";
    p.style.left = left; p.style.top = top;
    game.appendChild(p);
    setTimeout(()=>p.remove(),500);
  }
}

/* Bomb Explosion */
function explodeBomb(fruit){
  const boom = document.createElement("div");
  boom.className = "explosion";
  boom.textContent = "💥";
  boom.style.left = fruit.style.left; boom.style.top = fruit.style.top;
  game.appendChild(boom);
  game.classList.add("shake");
  setTimeout(()=>{
    boom.remove();
    game.classList.remove("shake");
  },500);
}

/* End Game */
function endGame(){
  clearInterval(timer);
  if(score > highScore) localStorage.setItem("fruitHigh", score);
  finalScore.textContent = score;
  modal.classList.add("active");
}

/* Restart */
tryAgainBtn.addEventListener("click", () => {
  score = 0; lives = 5; combo = 0; multiplier = 1;
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  comboEl.textContent = combo;
  timeEl.textContent = modeSelect.value === "timer" ? 60 : "--";
  modal.classList.remove("active");
  applyDifficulty();
  if(modeSelect.value === "timer") startTimer(); else clearInterval(timer);
  document.querySelectorAll('.fruit').forEach(fruit => fruit.remove());
});

/* Game Loop */
setInterval(spawnFruit, spawnRate);
