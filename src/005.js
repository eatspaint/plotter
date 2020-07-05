/**
 * ls005
 * Christian Fuller (@eatspaint)
 * July 4, 2020
 */
const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');

// 8911
// 423291
const DEFAULT_SEED = 'abcd';
const SEED = DEFAULT_SEED || Random.getRandomSeed();
console.log(`Seed: ${SEED}`);
Random.setSeed(SEED);

const settings = {
  dimensions: 'arch-a',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'in'
};

// HELPERS
const MARGIN = 0.25;
const TWO_PI = 2 * Math.PI;
const HALF_PI = 0.5 * Math.PI;

// SYSTEM SETUP
const AXIOM = 'adcbabdbac';
const GENERATIONS = 3;

// RULE VARIABLES
const A_LEN = 0.25;
const B_RANGE = HALF_PI;
const B_NOISE_FREQ = 0.001;
const B_RAD = 0.3;
const B_AGE_FREQ_COEF = 0.1;
const B_TENSION = 15;
const C_LEN_COEF = 0.03;
const C_GROWTH_FN = (age) => age * C_LEN_COEF;
const D_SIZE = 0.5;
const D_GAP = 0.07;
const D_UTIL_FN = ({ a, size, x, y }) => {
  const measures = [HALF_PI, Math.PI, -HALF_PI, 0];
  return measures.map(measure => [
    x + (size * Math.sin(a + measure)),
    y + (size * Math.cos(a + measure)),
  ])
};
const RULE_A = 'ab';
const RULE_B = 'ca';
const RULE_C = 'cb';
const RULE_D = 'dbad';

const sketch = (props) => {
  const { width, height, units } = props;
  const MID_X = width / 2;
  const groups = [
    [], // lines
    [], // circles
    [], // diamonds
  ];

  /**
   * STEP 1: Define system variables, 
   * each with execution instructions & expansion rule
   */

  // A: Moves in direction (a), updates position (x, y)
  const A = ({
    execute: (args) => {
      const { x, y, a } = args;
      const nextX = x + (A_LEN * Math.sin(a));
      const nextY = y + (A_LEN * Math.cos(a));
      groups[0].push(createPath(context => {
        context.moveTo(x, y);
        context.lineTo(nextX, nextY);
      }));
      return { ...args, x: nextX, y: nextY };
    },
    expand: RULE_A,
  });

  // B: Draws a circle, and updates the current angle (a)
  const B = ({
    execute: (args) => {
      const { x, y, a, age } = args;
      const nextA = a + Random.noise2D(x, y, B_NOISE_FREQ, (B_RANGE + (B_TENSION * Math.sin(age))));
      groups[1].push(createPath(context => {
        context.arc(
          x, y,
          B_RAD * (Math.abs(Math.sin(age * B_AGE_FREQ_COEF))),
          0, TWO_PI
        );
      }));
      return { ...args, a: nextA };
    },
    expand: RULE_B,
  });

  // C: Add a perpendicular line, run `B.execute` at each end
  const C = ({
    execute: (args) => {
      const { x, y, a, age } = args;
      const len = C_GROWTH_FN(age);
      const L = a - HALF_PI;
      const R = a + HALF_PI;
      const L_X = x + (len * Math.sin(L));
      const L_Y = y + (len * Math.cos(L));
      const R_X = x + (len * Math.sin(R));
      const R_Y = y + (len * Math.cos(R));
      groups[0].push(createPath(context => {
        context.moveTo(L_X, L_Y);
        context.lineTo(R_X, R_Y);
      }));
      B.execute({ x: L_X, y: L_Y, a, age });
      B.execute({ x: R_X, y: R_Y, a, age });
      return { ...args };
    },
    expand: RULE_C,
  });

  // D: Bounds current position in a diamond
  const D = ({
    execute: (args) => {
      const { x, y, a, age } = args;
      const size = Random.noise1D(age) * D_SIZE;
      const innerPoints = D_UTIL_FN({x, y, a, size});
      const outerPoints = D_UTIL_FN({x, y, a, size: size + D_GAP})
      groups[2].push(createPath(context => {
        context.moveTo(...innerPoints[innerPoints.length - 1]);
        innerPoints.forEach(([x, y]) => context.lineTo(x, y));
        context.moveTo(...outerPoints[outerPoints.length - 1]);
        outerPoints.forEach(([x, y]) => context.lineTo(x, y));
      }))
      return { ...args }
    },
    expand: RULE_D,
  })

  // Map system variables into `System`
  const System = {
    'a': A,
    'b': B,
    'c': C,
    'd': D,
  };

  /**
   * STEP 2: Expand initial axiom across generations by following rules
   */

  let model = AXIOM;
  for (let i = 0; i <= GENERATIONS; i++) {
    // explode the current model into its individual steps
    const currentGen = [...model];
    const nextGen = [];
    currentGen.forEach(
      // expand the step according to its `expand` rule
      char => nextGen.push(System[char].expand)
    );
    // set model for this generation, and repeat!
    model = nextGen.join('');
  }

  /**
   * STEP 3: Iterate through steps in final generation,
   * execute the instructions for each
   */

  // initial state
  let state = {
    x: MID_X,
    y: MARGIN,
    a: 0,
    age: 0,
  };

  // iterate over steps in model and run `execute` for current state
  // save the returned state for the next execution
  [...model].forEach((step, i) => {
    const nextState = System[step].execute(state);
    state = { ...nextState, age: i };
  });

  /**
   * UTIL & SVG STUFFS
   */

  // Draw a point in the corner of each group for aligning layers
  groups.forEach(group => {
    group.push(createPath(context => context.lineTo(MARGIN, MARGIN)))
  })

  // Crop to fit
  const box = [MARGIN, MARGIN, width - MARGIN, height - MARGIN];
  const layers = groups.map((group) => {
    let lines = pathsToPolylines(group, { units });
    return clipPolylinesToBox(lines, box);
  })

  const renderSettings = {
    lineJoin: 'round',
    lineCap: 'round',
    lineWidth: 0.03, // 1mm in inches
    optimize: true,
  }

  return props => [
    // export each layer as an SVG ([1])
    ...layers.map((layer) => (
      renderPaths(layer, {
        ...props,
        ...renderSettings,
      })[1]
    )),
    // export composite PNG ([0])
    renderPaths(layers, {
      ...props,
      ...renderSettings,
    })[0],
  ];
};

canvasSketch(sketch, settings);
