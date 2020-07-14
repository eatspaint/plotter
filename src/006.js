/**
 * sp006
 * Christian Fuller (@eatspaint)
 * July 4, 2020
 */
const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');

// 592706
// 312505
// 808386
// 521061
// 96746
// 264336
// 602170
const DEFAULT_SEED = '';
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

// CONFIG
// const steps = 200; // impacts density of drawn rings
// const R_COEF = 0.2; // scales the size of rings uniformly
// const R_RATE = 8; // impacts frequency of ring size modulation
// const R_BIAS = 0.1; // offset of ring radius (from 0)
// const SIZE1 = 2.5; // scales drawing radially
// const SIZE2 = 0.1; // radius of secondary rotation
// const T2_RATE = 3; // frequency of secondary rotation

// RAND CONFIG
const steps = 200; // impacts density of drawn rings
const R_COEF = Random.range(0.1, 0.4); // scales the size of rings uniformly
const R_RATE = Random.rangeFloor(1, 12) // impacts frequency of ring size modulation
const R_BIAS = Random.range(0.01, 0.5); // offset of ring radius (from 0)
const SIZE1 = 2; // scales drawing radially
const SIZE2 = Random.gaussian(0.1, 0.5); // radius of secondary rotation
const T2_RATE = Random.rangeFloor(1, 7); // frequency of secondary rotation
const SIZE3 = Random.gaussian(0.1, 0.7);
const T3_RATE = Random.rangeFloor(1, 7);

const sketch = (props) => {
  const { width, height, units } = props;
  const MID_X = width / 2;
  const MID_Y = height / 2;
  const groups = [
    [],
  ];

  const rotation = TWO_PI;
  const stepSize = rotation / steps;

  const rings = [];
  for (let t = 0; t <= rotation; t += stepSize) {
    const x = MID_X + (
      ((SIZE1 * (Math.sin(t))) + // ROTATION 1
      (SIZE2 * Math.sin(T2_RATE * t)) + // ROTATION 2
      (SIZE3 * Math.sin(T3_RATE * t))) // ROTATION 2
    );
    const y = MID_Y + (
      ((SIZE1 * (Math.cos(t))) + // ROTATION 1
      (SIZE2 * Math.cos(T2_RATE * t)) + // ROTATION 2
      (SIZE3 * Math.cos(T3_RATE * t))) // ROTATION 2
    );
    const r = R_BIAS + (R_COEF * (1 - Math.cos(R_RATE * t)));
    rings.push({x, y, r});
  }
  rings.forEach(({x, y, r}) => {
    groups[0].push(createPath(context => {
      context.arc(x, y, r, 0, TWO_PI);
    }))
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
