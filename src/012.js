/**
 * fsp012
 * Christian Fuller (@eatspaint)
 * Sept 12, 2020
 */
const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');

// 270762
// 721089
// 721089 (clipped)
// 651866
// 444809
// 99126
// 799543
// 222334
// 284942
// 76947
// 53383
const DEFAULT_SEED = '';
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

const ROTATION = TWO_PI;
const GRANULARITY = 1000;
const RADIUS = 0.5;
const TUBE_LIMIT = Math.abs(Random.gaussian(0.6, 0.5));

const ROTATORS = [
  { r: Math.abs(Random.gaussian(1, 0.6)), s: Random.rangeFloor(3, 20) },
  { r: Math.abs(Random.gaussian(1, 0.6)), s: Random.rangeFloor(3, 20) },
  { r: Math.abs(Random.gaussian(1, 0.6)), s: Random.rangeFloor(3, 20) },
  { r: Math.abs(Random.gaussian(1, 0.6)), s: Random.rangeFloor(3, 20) },
  // { r: 0.6, s: 17 },
  // { r: 0.3, s: 19 },
];

const MAX_RADIUS = ROTATORS.reduce((total, {r}) => (total + r), RADIUS);

const sketch = (props) => {
  const { width, height, units } = props;
  const MID_X = width / 2;
  const MID_Y = height / 2;
  const groups = [];

  const PHI_STEP = ROTATION / GRANULARITY;

  // PUSH SKETCHES INTO GROUPS
  const points = [];

  for (let t = 0; t < ROTATION; t += PHI_STEP) {
    let x = ROTATORS.reduce((total, current) => total + (current.r * Math.sin(t * current.s)), RADIUS * Math.sin(t));
    let y = ROTATORS.reduce((total, current) => total + (current.r * Math.cos(t * current.s)), RADIUS * Math.cos(t));
    let r = mapRange(Math.sqrt((x ** 2) + (y ** 2)), 0, MAX_RADIUS, 0, TUBE_LIMIT);

    points.push({ x: MID_X + x, y: MID_Y + y, r: r });
  }

  groups.push([]);
  groups[0].push(createPath(context => {
    // context.moveTo(...points[points.length - 1]);
    points.forEach(({x, y, r}) => {
      context.moveTo(x + r, y);
      context.arc(x, y, r, 0, TWO_PI);
    })
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
    background: '#fff',
    foreground: '#b52d0b',
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
