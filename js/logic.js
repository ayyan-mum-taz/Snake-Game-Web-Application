
// GAME SETTINGS AND STATE MANAGEMENT

const GameConfig = {
  gridUnits: 20,
  initialInterval: 200,
  minDelay: 25,
  speedAdjustments: [
    { threshold: 150, decrement: 5 },
    { threshold: 100, decrement: 3 },
    { threshold: 50, decrement: 2 },
    { threshold: 25, decrement: 1 }
  ]
};

let GameState = {
  gridSize: GameConfig.gridUnits,
  delay: GameConfig.initialInterval,
  score: 0,
  highScore: 0,
  isActive: false,
  lastFrameTime: performance.now(),
  direction: 'RIGHT',
  nextDirection: 'RIGHT',
  snake: [{ x: 10, y: 10 }],
  food: null
};

// DOM ELEMENTS AND UTILITIES

const DOM = (() => {
  const cache = {
    board: document.getElementById('game-board'),
    instructions: document.getElementById('instruction-text'),
    logo: document.getElementById('logo'),
    currentScore: document.getElementById('score'),
    highScore: document.getElementById('highScore'),
    container: document.querySelector('.game-container')
  };

  const createElement = (tag, className) => {
    const elem = document.createElement(tag);
    if (className) elem.classList.add(className);
    return elem;
  };
  const updateScores = () => {
    cache.currentScore.textContent = `Current Score: ${String(GameState.score).padStart(3, '0')}`;
    cache.highScore.textContent = `High Score: ${String(GameState.highScore).padStart(3, '0')}`;
  };

  const clearBoard = () => {
    cache.board.innerHTML = '';
  };

  return {
    cache,
    createElement,
    updateScores,
    clearBoard
  };
})();

// FOOD MANAGEMENT MODULE

const FoodManager = (() => {
  const spawnFood = () => {
    let position;
    do {
      position = {
        x: getRandomInt(1, GameState.gridSize),
        y: getRandomInt(1, GameState.gridSize)
      };
    } while (isOccupied(position));
    GameState.food = position;
  };

  const isOccupied = ({ x, y }) => {
    return GameState.snake.some(segment => segment.x === x && segment.y === y);
  };

  const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  return { spawnFood };
})();

// RENDERING MODULE

const Renderer = (() => {
  const render = () => {
    DOM.clearBoard();
    renderSnake();
    renderFood();
    DOM.updateScores();
  };

  const renderSnake = () => {
    GameState.snake.forEach(segment => {
      const segmentElem = DOM.createElement('div', 'snake');
      positionElement(segmentElem, segment);
      DOM.cache.board.appendChild(segmentElem);
    });
  };

  const renderFood = () => {
    if (GameState.isActive) {
      const foodElem = DOM.createElement('div', 'food');
      positionElement(foodElem, GameState.food);
      DOM.cache.board.appendChild(foodElem);
    }
  };

  const positionElement = (element, { x, y }) => {
    element.style.gridColumnStart = x;
    element.style.gridRowStart = y;
  };

  return { render };
})();

// INPUT HANDLING MODULE

const InputHandler = (() => {
  const handleKeyPress = (event) => {
    const key = event.key.toUpperCase();

    if ((!GameState.isActive && (key === ' ' || event.code === 'SPACE')) || key === ' ') {
      GameController.start();
      return;
    }

    switch (key) {
      case 'ARROWUP':
        if (GameState.direction !== 'DOWN') GameState.nextDirection = 'UP';
        break;
      case 'ARROWDOWN':
        if (GameState.direction !== 'UP') GameState.nextDirection = 'DOWN';
        break;
      case 'ARROWLEFT':
        if (GameState.direction !== 'RIGHT') GameState.nextDirection = 'LEFT';
        break;
      case 'ARROWRIGHT':
        if (GameState.direction !== 'LEFT') GameState.nextDirection = 'RIGHT';
        break;
    }
  };

  return { handleKeyPress };
})();

// GAME INITIALIZATION MODULE

const GameInitializer = (() => {
  const init = () => {
    window.addEventListener('resize', adjustGrid);
    document.addEventListener('keydown', InputHandler.handleKeyPress);
    setupGrid();
    FoodManager.spawnFood();
  };

  const adjustGrid = () => {
    const containerWidth = DOM.cache.container.clientWidth;
    GameState.gridSize = Math.floor(containerWidth / 20);
    document.documentElement.style.setProperty('--grid-size', GameState.gridSize);
    DOM.cache.board.style.gridTemplateColumns = `repeat(${GameState.gridSize}, 1fr)`;
    DOM.cache.board.style.gridTemplateRows = `repeat(${GameState.gridSize}, 1fr)`;
  };

  const setupGrid = () => {
    adjustGrid();
  };

  return { init };
})();

// GAME CONTROLLER MODULE

const GameController = (() => {
  const start = () => {
    if (!GameState.isActive) {
      GameState.isActive = true;
      DOM.cache.instructions.style.display = 'none';
      DOM.cache.logo.style.display = 'none';
      GameState.lastFrameTime = performance.now();
      requestAnimationFrame(loop);
    }
  };

  const loop = (currentTime) => {
    if (!GameState.isActive) return;

    const elapsed = currentTime - GameState.lastFrameTime;
    if (elapsed >= GameState.delay) {
      update();
      GameState.lastFrameTime = currentTime;
    }

    requestAnimationFrame(loop);
  };

  const update = () => {
    moveSnake();
    if (checkCollisions()) {
      endGame();
      return;
    }
    Renderer.render();
  };

  const moveSnake = () => {
    const head = { ...GameState.snake[0] };

    switch (GameState.nextDirection) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    GameState.direction = GameState.nextDirection;
    GameState.snake.unshift(head);

    if (head.x === GameState.food.x && head.y === GameState.food.y) {
      GameState.score += 1;
      adjustSpeed();
      FoodManager.spawnFood();
    } else {
      GameState.snake.pop();
    }
  };

  const checkCollisions = () => {
    const head = GameState.snake[0];

    // Wall Collision
    if (
      head.x < 1 || head.x > GameState.gridSize ||
      head.y < 1 || head.y > GameState.gridSize
    ) {
      return true;
    }

    // Self Collision
    for (let i = 1; i < GameState.snake.length; i++) {
      if (head.x === GameState.snake[i].x && head.y === GameState.snake[i].y) {
        return true;
      }
    }

    return false;
  };

  const endGame = () => {
    GameState.isActive = false;
    DOM.cache.instructions.style.display = 'block';
    DOM.cache.logo.style.display = 'block';
    if (GameState.score > GameState.highScore) {
      GameState.highScore = GameState.score;
      DOM.cache.highScore.style.display = 'block';
      DOM.updateScores();
    }
    resetGame();
  };

  const resetGame = () => {
    GameState.snake = [{ x: 10, y: 10 }];
    GameState.direction = 'RIGHT';
    GameState.nextDirection = 'RIGHT';
    GameState.delay = GameConfig.initialInterval;
    GameState.score = 0;
    DOM.updateScores();
  };

  const adjustSpeed = () => {
    for (let setting of GameConfig.speedAdjustments) {
      if (GameState.delay > setting.threshold) {
        GameState.delay -= setting.decrement;
        break;
      }
    }
  };

  return { start };
})();

// INITIALIZES THE GAME

GameInitializer.init();