/**
 * ge004
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
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'in'
};

const MARGIN = 0.25;
const PLATE_GAP = 0.3;
const RADIAL_STEPS = 30;
const ARC = Math.PI;
const START_ANG = Math.PI * 1.5;
const RADIAL_STEP = ARC / RADIAL_STEPS;
const BIAS = 2;

const sketch = (props) => {
  const { width, height, units } = props;
  const MID_X = width / 2;
  const groups = [
    [],
  ];

  // DRAW
  // draw a vertical tube of noise with lines connecting X & y directions
  const plates = [];
  for (let i = MARGIN; i <= (height - MARGIN); i += PLATE_GAP) {
    const plate = [];
    for (let a = START_ANG; a <= (START_ANG + ARC); a += RADIAL_STEP) {
      const unitX = 1.5 * Math.sin(a);
      const unitY = 0.5 * Math.cos(a);
      const vec = BIAS + Random.noise3D(unitX, unitY, (i * 0.3), 1.5, 0.5);
      plate.push([
        MID_X + (unitX * vec),
        i + (unitY * vec),
      ])
    }
    plates.push(plate);
  }

  plates.forEach((plate, i) => {
    groups[0].push(
      createPath(context => {
        // move to first point
        context.moveTo(...plate[0]);
        // draw the current plate
        plate.forEach(([x, y]) => {
          context.lineTo(x, y);
        })
        // connect to the next plate
        if (i < (plates.length - 1)) {
          const nextPlate = plates[i + 1];
          plate.forEach((plate, n) => {
            context.moveTo(...plate);
            context.lineTo(...nextPlate[n])
          })
        }
      })
    )
  })
  

  // Draw a point in the corner of each group for aligning layers
  groups.forEach(group => {
    group.push(createPath(context => context.lineTo(MARGIN, MARGIN)))
  })
  
  const box = [ MARGIN, MARGIN, width - MARGIN, height - MARGIN ];

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
