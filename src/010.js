/**
 * sp010
 * Christian Fuller (@eatspaint)
 * July 16, 2020
 */
const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');

// 155471
// 190783
// 671951
// 740001
// 460275
// 995337
// 412971
// 702700
// 296827
const DEFAULT_SEED = '726818';
const SEED = DEFAULT_SEED || Random.getRandomSeed();
console.log(`Seed: ${SEED}`);
Random.setSeed(SEED);

const settings = {
  dimensions: '8r',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'in'
};

// HELPERS
const MARGIN = 0.25;
const TWO_PI = 2 * Math.PI;
const HALF_PI = 0.5 * Math.PI;

// RAND CONFIG
const COLORS = 1; // number of layers to be calculated
const steps = 400; // impacts density of drawn rings
// Ring size & scale
const RING_COEF = Random.range(0.1, 0.4); // scales the size of rings uniformly
const RING_RATE = Random.rangeFloor(1, 12) // impacts frequency of ring size modulation
const RING_BIAS = Random.range(0.01, 0.5); // offset of ring radius (from 0)
// First rotator
const T1_SIZE = 1.5; // scales drawing radially
// Second rotator
const T2_SIZE = Random.gaussian(0.1, 0.5); // radius of rotation
const T2_RATE = Random.rangeFloor(1, 7); // frequency of rotation
// Third rotator
const T3_SIZE = Random.gaussian(0.1, 0.7);
const T3_RATE = Random.rangeFloor(1, 7);
// Fourth rotator
const T4_SIZE = Random.gaussian(0.1, 0.9);
const T4_RATE = Random.rangeFloor(1, 12);

const generateRings = ({
  rotation,
  stepSize,
  t1,
  t2,
  t3,
  t4,
  ring,
}) => {
  const rings = [];
  for (let t = 0; t <= rotation; t += stepSize) {
    const x = (
      ((t1.size * (Math.sin(t))) + // ROTATION 1
        (t2.size * Math.sin(t2.rate * t)) + // ROTATION 2
        (t3.size * Math.sin(t3.rate * t)) + // ROTATION 3
        (t4.size * Math.sin(t4.rate * t))) // ROTATION 4
    );
    const y = (
      ((t1.size * (Math.cos(t))) + // ROTATION 1
        (t2.size * Math.cos(t2.rate * t)) + // ROTATION 2
        (t3.size * Math.cos(t3.rate * t)) + // ROTATION 3
        (t4.size * Math.cos(t4.rate * t))) // ROTATION 4
    );
    const r = ring.bias + (ring.coef * (1 - Math.cos(ring.rate * t)));
    rings.push({ x, y, r });
  }
  return rings;
};

const sketch = (props) => {
  const { width, height, units } = props;
  const MID_X = width / 2;
  const MID_Y = height / 2;
  const groups = [];

  const rotation = TWO_PI;
  const stepSize = rotation / steps;

  const baseProps = {
    rotation,
    stepSize,
    t1: { size: T1_SIZE },
    t2: { size: T2_SIZE, rate: T2_RATE },
    t3: { size: T3_SIZE, rate: T3_RATE },
    t4: { size: T4_SIZE, rate: T4_RATE },
    ring: { bias: RING_BIAS, coef: RING_COEF, rate: RING_RATE },
  };

  const phi1 = TWO_PI / 3;
  const phi2 = TWO_PI / 1.5;
  const phi3 = TWO_PI;
  for (let i = 0; i < COLORS; i++) {
    groups.push([]);
    generateRings({
      ...baseProps,
      t3: { size: T3_SIZE + (i * 0.015), rate: T3_RATE },
      t4: { size: T4_SIZE + (i * 0.015), rate: T4_RATE },
    }).forEach(({ x, y, r }) => {
      groups[i].push(createPath(context => {
        const centerX = MID_X + x;
        const centerY = MID_Y + y;
        // draw a triangle
        context.moveTo(
          centerX + (r * Math.sin(phi2)),
          centerY + (r * Math.cos(phi2)),
        );
        context.lineTo(
          centerX + (r * Math.sin(phi1)),
          centerY + (r * Math.cos(phi1)),
        );
        context.lineTo(
          centerX + (r * Math.sin(phi3)),
          centerY + (r * Math.cos(phi3)),
        );
        context.closePath();
      }))
    });
  }

  const GAP = 0.05;
  const lines = MID_X / GAP;
  const rangeMax = lines ** 3;
  groups.push([]);
  for (let i = 0; i < lines; i++) {
    groups[1].push(createPath(context => {
      const x1 = i * GAP;
      const x2 = width - x1;
      const y = height - mapRange(i**3, 0, rangeMax, 0, height - MARGIN);
      context.moveTo(x1, height);
      context.lineTo(x1, y);
      context.moveTo(x2, height);
      context.lineTo(x2, y);
    }));
  }
  groups[1].push(createPath(context => {
    context.moveTo(MID_X, 0);
    context.lineTo(MID_X, height);
  }))



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
    background: '#000',
    foreground: '#fff',
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
