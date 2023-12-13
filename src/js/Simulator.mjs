// @ts-check

/**
 * @typedef {Object} Position
 * @property {number} x location in x axis
 * @property {number} y location in y axis
 */

/**
 * @typedef {Object} PhysicsTraits
 * @property {number} [mass] mass in kilograms
 * @property {number} [velocity] in m/s
 * @property {number} [acceleration] in m/s^2
 * @property {number} [direction] in radians
 */

class TRAIT_PhysicsEnabled {
  /** @type {number} */
  direction;
  /** @type {number} */
  velocity;
  /** @type {number} */
  acceleration;
  /** @type {number} */
  mass;
  /** @type {Position} */
  position;

  /**
   * @param {Simulator} simulation
   */
  render(simulation) {
    // RENDER LOOP
  }

  /**
   * @param {PhysicsEngine} world
   */
  ontick(world) {
    // PHYSICS LOOP
  }

  /**
   * @param {Position} initialPosition
   * @param {PhysicsTraits} [initialTraits]
   */
  constructor(initialPosition, initialTraits) {
    this.position = { x: initialPosition.x, y: initialPosition.y };
    this.acceleration = initialTraits?.acceleration ?? 0;
    this.direction = initialTraits?.direction ?? 0;
    this.mass = initialTraits?.mass ?? 0;
    this.velocity = initialTraits?.velocity ?? 0;
  }
}

/**
 * @typedef {Object} Dimensions
 * @property {number} width
 * @property {number} height
 */

class Rectangle extends TRAIT_PhysicsEnabled {
  /** @type {Dimensions} */
  dimensions;

  get boundaryBox() {
    const { x, y } = this.position;
    const { width, height } = this.dimensions;
    const [hw, hh] = [width / 2, height / 2];
    return {
      left: x - hw,
      right: x + hw,
      top: y + hh,
      bottom: y + hh,
    };
  }

  get coords() {
    const { left, right, top, bottom } = this.boundaryBox;
    return {
      topleft: { x: left, y: top },
      topright: { x: right, y: top },
      bottomleft: { x: left, y: bottom },
      bottomright: { x: right, y: bottom },
    };
  }

  /** @type {string} */
  id;

  /** @type {HTMLDivElement} */
  element;

  /**
   * @param {Simulator} simulation
   */
  render(simulation) {
    this.element.style.width = `${this.dimensions.width}px`;
    this.element.style.height = `${this.dimensions.height}px`;
    this.element.style.transformOrigin = 'center center';
    const translateX = `${this.position.x}px`;
    const translateY = `${simulation.viewport.height - this.dimensions.height}px`;
    this.element.style.transform = `translate(${translateX}, ${translateY})`;
    super.render(simulation);
  }

  /**
   * @param {PhysicsEngine} world
   */
  ontick(world) {
    super.ontick(world);
    this.position = {
      x: this.position.x,
      y: this.position.y,
    };
  }

  /**
   * @param {Dimensions} dimensions
   * @param {Position} initialPosition
   * @param {PhysicsTraits} [initialTraits]
   */
  constructor(dimensions, initialPosition, initialTraits) {
    super(initialPosition, initialTraits);
    this.dimensions = { width: dimensions.width, height: dimensions.height };
    this.id = String(Math.random() * 100000);
    this.element = document.createElement('div');
    this.element.classList.toggle('rectangle', true);
  }
}

/**
 * @typedef {Object} WorldProperties
 * @property {number} gravity gravity in m/s^2
 */

class PhysicsEngine {
  /** @type {Map<string, TRAIT_PhysicsEnabled>} */
  #registeredAssets;

  /** @type {WorldProperties['gravity']} */
  gravity;

  /**
   * @param {WorldProperties['gravity']} newValue
   */
  updateGravity(newValue) {
    this.gravity = newValue;
  }

  /**
   * @param {Rectangle} asset
   */
  registerAsset(asset) {
    this.#registeredAssets.set(asset.id, asset);
  }

  /**
   * Updates world state
   */
  tick() {
    this.#registeredAssets.forEach((asset) => asset.ontick(this));
  }

  /**
   * Renders world state
   * @param {Simulator} simulation
   */
  render(simulation) {
    this.#registeredAssets.forEach((asset) => asset.render(simulation));
  }

  /**
   * @param {WorldProperties} properties
   */
  constructor(properties) {
    this.#registeredAssets = new Map();
    this.gravity = properties.gravity;
  }
}

export class Simulator {
  /** @type {PhysicsEngine} */
  engine;

  /** @type {number} Simulator speed */
  simulatorSpeed;

  /** @type {HTMLDivElement} */
  #simulationElement;

  /** @type {'paused' | 'running'} */
  #state = 'paused';

  /** @type {number} */
  #lastRender = 0;

  /** @type {number} */
  #framesRendered = 0;

  /** @type {Dimensions} */
  viewport;

  /**
   * @param {number} width
   * @param {number} height
   */
  createCanvas(width, height) {
    const mainElement = document.getElementById('main');
    if (!mainElement) throw new Error('Main element not found');
    this.#simulationElement = document.createElement('div');
    this.#simulationElement.className = 'simulation';
    mainElement.replaceChildren(this.#simulationElement);
    this.viewport = { width, height };
  }

  /**
   * @param {number} step
   */
  render(step) {
    if (this.#state === 'paused') return;

    if (step - this.#lastRender > 300) {
      this.engine.tick();
    }

    if (step - this.#lastRender > 300) {
      this.#simulationElement.style.width = `${this.viewport.width}px`;
      this.#simulationElement.style.height = `${this.viewport.height}px`;
      this.engine.render(this);
      this.#lastRender = step;
      this.#framesRendered++;
      this.#simulationElement.dataset.frames = `Frames rendered: ${this.#framesRendered}`;
    }

    // Request new update
    window.requestAnimationFrame((step) => {
      this.render(step);
    });
  }

  start() {
    this.#state = 'running';
    this.render(0);
  }

  stop() {
    this.#state = 'paused';
  }

  createElement() {
    const asset = new Rectangle({ width: 60, height: 40 }, { x: 0, y: 0 });
    this.engine.registerAsset(asset);
    this.#simulationElement.appendChild(asset.element);
  }

  /**
   * @param {number} width
   * @param {number} height
   */
  constructor(width, height) {
    this.simulatorSpeed = 1;
    this.engine = new PhysicsEngine({ gravity: 9.81 });
    this.createCanvas(width, height);
  }
}
