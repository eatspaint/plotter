/**
 * ff009
 * Christian Fuller (@eatspaint)
 * July 12, 2020
 */
const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

// 501223
const DEFAULT_SEED = '';
const SEED = DEFAULT_SEED || Random.getRandomSeed();
console.log(`Seed: ${SEED}`);
Random.setSeed(SEED);

const settings = {
  dimensions: 'A3',
  orientation: 'landscape',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'in'
};

// HELPERS
const MARGIN = 0.25;
const TWO_PI = 2 * Math.PI;
const HALF_PI = 0.5 * Math.PI;

// CONFIG
const SPACING = 0.15;
const TRAVEL = 0.1;
const LENGTH = 10;
const LAYERS = 3;

const sketch = (props) => {
  const { width, height, units } = props;
  const MID_X = width / 2;
  const MID_Y = height / 2;
  const groups = [];

  const COLUMNS = width / SPACING;
  const ROWS = height / SPACING;

  for (let l = 0; l < LAYERS; l++) {
    const grid = [];
    const noiseZ = l * 0.1;
    const nudge = l * (SPACING / LAYERS);
  
    for (let x = 0; x < COLUMNS; x++) {
      for (let y = 0; y < ROWS; y++) {
        // push an array with one [x, y] point inside
        grid.push([[
          (x * SPACING) + nudge,
          (y * SPACING) + nudge,
        ]]);
      }
    }
  
    for (let n = 0; n < LENGTH; n ++) {
      for (let i = 0; i < grid.length; i++) {
        const [currentX, currentY] = grid[i][n];
        const phi = Random.noise3D(currentX, currentY, noiseZ, 0.05, Math.PI);
        const newX = currentX + (TRAVEL * Math.cos(phi));
        const newY = currentY + (TRAVEL * Math.sin(phi));
        grid[i].push([newX, newY]);
      }
    }
  
    console.log(grid.length);
  
    // DRAW
    groups.push([]);
    grid.forEach(points => {
      groups[l].push(createPath(context => {
        context.moveTo(...points[0]);
        points.forEach(([x, y]) => {
          context.lineTo(x, y);
        })
      }))
    });
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
    lineWidth: 0.015, // 0.4mm in inches
    optimize: true,
    background: '#fff',
    foreground: '#000',
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
