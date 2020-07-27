/**
 * yw011
 * Christian Fuller (@eatspaint)
 * July 25, 2020
 */
const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
require('opentype.js');
import { load } from 'opentype.js';
import { toPoints, resampleByAmount, resampleByLength, Path, fit, connectPoints } from 'g.js';

// 457146
// 946599
// 140748
// 250202
const DEFAULT_SEED = '250202';
const SEED = DEFAULT_SEED || Random.getRandomSeed();
console.log(`Seed: ${SEED}`);
Random.setSeed(SEED);

const settings = {
  dimensions: [8, 8],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'in'
};

// HELPERS
const MARGIN = 0.25;
const DRIFT_TIME = 100;
const DRIFT_LENGTH = 6;
const DRIFT_DIST = DRIFT_LENGTH / DRIFT_TIME;
const DRIFT_FREQ = 0.15;
const POINT_COUNT = 1000;

canvasSketch(async ({ width, height, units }) => {
  const MID_X = width / 2;
  const MID_Y = height / 2;
  const groups = [];

  // LOAD TEXT
  const font = await load('src/fonts/DankMono-Regular.otf');
  const path = font.getPath('YOUZLOW', 0, 0, 72);
  // https://github.com/opentypejs/opentype.js/issues/70
  path.__proto__ = Path.prototype;
  const resized = fit(path, { x: MID_X, y: MID_Y }, width - (3 * MARGIN), height - (3 * MARGIN), false);
  const resampled = resampleByAmount(resized, POINT_COUNT);
  const points = toPoints(resampled);

  // GENERATE ALL SEGMENTS
  console.log('GENERATING SEGMENTS');
  const segments = [];
  points.forEach(point => {
    let tmp = [];
    let { x, y } = point;
    tmp.push({ x, y });
    for (let t = 0; t < DRIFT_TIME; t++) {
      const phi = Random.noise2D(x, y, DRIFT_FREQ, Math.PI);
      const nextX = x + (DRIFT_DIST * Math.cos(phi));
      const nextY = y + (DRIFT_DIST * Math.sin(phi));
      x = nextX;
      y = nextY;
      tmp.push({ x, y });
    }
    const line = connectPoints(tmp);
    segments.push(line);
  });

  // DRAW
  groups.push([]);
  segments.forEach(segment => {
    const { commands } = segment;
    console.log('SEGMENT TO CONTEXT')
    groups[0].push(createPath(context => {
      const [head, ...tail] = commands;
      context.moveTo(head.x, head.y);
      tail.forEach(({ x, y }) => context.lineTo(x, y));
    }))
  })

  groups.push([]);
  groups[1].push(resized.toPathData());

  /**
   * UTIL & SVG STUFFS
   */

  // Draw a point in the corner of each group for aligning layers
  groups.forEach(group => {
    group.push(createPath(context => context.lineTo(MARGIN, MARGIN)))
  })

  // Crop to fit
  console.log('CROPPING');
  const box = [0, 0, width, height];
  const layers = groups.map((group) => {
    let lines = pathsToPolylines(group, { units });
    return clipPolylinesToBox(lines, box);
  })

  const renderSettings = {
    lineJoin: 'round',
    lineCap: 'round',
    lineWidth: 0.03,
    optimize: true,
    background: '#000',
    foreground: '#fff',
  }

  console.log('LETS GOOO');
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
}, settings);
