/**
 * WIP008
 * Christian Fuller (@eatspaint)
 * July 12, 2020
 */
const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

const DEFAULT_SEED = '';
const SEED = DEFAULT_SEED || Random.getRandomSeed();
console.log(`Seed: ${SEED}`);
Random.setSeed(SEED);

const settings = {
  dimensions: [2.5, 3.75],
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
const SHAPE_HEIGHT = 1.5; // inches
const LAYERS = 10; // density of drawn layers
const LAYER_POINTS = 100; // resolution of layer
const NOISE_AMPLITUDE = 0.035;
const NOISE_FREQ = 2;
const TILT = 0.5; // compresses points on y axis

const sketch = (props) => {
  const { width, height, units } = props;
  const MID_X = width / 2;
  const MID_Y = height / 2;
  const groups = [];
  
  const LAYER_GAP = SHAPE_HEIGHT / LAYERS;
  const SHAPE_RADIUS = SHAPE_HEIGHT / 2;
  const POINT_STEP = TWO_PI / LAYER_POINTS; // angle between points

  // DRAW
  // noise layers
  groups.push([]);
  for (let i = 0; i < LAYERS; i++) {
    // generate bounds for layer
    const r = SHAPE_RADIUS * Math.sin(i * (Math.PI / LAYERS));
    const x = MID_X;
    const y = MID_Y + (i * LAYER_GAP) - SHAPE_RADIUS;
    // create outline of layer
    const points = [];
    for (let p = 0; p < LAYER_POINTS; p++) {
      const pa = p * POINT_STEP;
      const xComp = Math.cos(pa);
      const yComp = Math.sin(pa);
      const rComp = Random.noise3D(1 + xComp, 1 + yComp, i * 0.1, NOISE_FREQ, NOISE_AMPLITUDE);
      const pr = r + rComp;
      const px = x + (pr * xComp);
      const py = y + (pr * yComp * TILT);
      points.push([px, py]);
    }
    groups[0].push(createPath(context => {
      context.moveTo(...points[0]);
      points.forEach(point => {
        context.lineTo(...point);
      })
      context.closePath();
    }))
  }

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
