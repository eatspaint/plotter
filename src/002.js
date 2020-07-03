/**
 * sx002
 * Christian Fuller (@eatspaint)
 * July 3, 2020
 */
const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');

const DEFAULT_SEED = '';
const SEED = DEFAULT_SEED || Random.getRandomSeed();
console.log(`Seed: ${SEED}`);
Random.setSeed(SEED);

const settings = {
  dimensions: 'arch-a',
  orientation: 'landscape',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'in'
};

const Y_STEP = 0.03;
const X_STEP = 0.125;
const MARGIN = 0.25;

const sketch = (props) => {
  const { width, height, units } = props;
  const groups = [
    [],
    [],
    [],
  ];
  
  for (let x = MARGIN; x <= (width - MARGIN); x += X_STEP) {
    groups[0].push(createPath(context => {
      for (let y = MARGIN; y <= (height - MARGIN); y += Y_STEP) {
        context.lineTo(Random.noise2D(x, y, 1, 0.1) + x, y);
      }
    }))
  }
  
  for (let x = MARGIN; x <= (width - MARGIN); x += X_STEP) {
    groups[1].push(createPath(context => {
      for (let y = MARGIN; y <= (height - MARGIN); y += Y_STEP) {
        context.lineTo(Random.noise2D(x, y, 1, mapRange(y, MARGIN, height - MARGIN, 0, 0.2)) + x, y);
      }
    }))
  }
  
  for (let x = MARGIN; x <= (width - MARGIN); x += X_STEP) {
    groups[2].push(createPath(context => {
      for (let y = MARGIN; y <= (height - MARGIN); y += Y_STEP) {
        context.lineTo(Random.noise2D(x, y, 1, mapRange(y, MARGIN, height - MARGIN, 0, 0.3)) + x, y);
      }
    }))
  }
  
  const box = [ MARGIN, MARGIN, width - MARGIN, height - MARGIN ];

  const layers = groups.map((group) => {
    // Convert to polylines for clipping
    let lines = pathsToPolylines(group, { units });
    // Set bounds & clip
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
