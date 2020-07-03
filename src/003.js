/**
 * ec003
 * Christian Fuller (@eatspaint)
 * July 3, 2020
 */
const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');

// 297592
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

const MARGIN = 0.25;
const ANG_STEP = 0.005;
const TWO_PI = 2 * Math.PI;
const PATTERN_R = 2;
const GAP = 0.5;

const sketch = (props) => {
  const { width, height, units } = props;
  const MID_X = width / 2;
  const MID_Y = height / 2;
  const groups = [
    [],
    [],
    [],
  ];

  // DRAW
  const controlPoints = [];
  for (let a = 0; a < 1; a += ANG_STEP) {
    const ang = a * TWO_PI;
    const xUnit = Math.sin(ang);
    const yUnit = Math.cos(ang);
    const x = MID_X + (PATTERN_R * xUnit);
    const y = MID_Y + (PATTERN_R * yUnit);
    controlPoints.push({x, y, ang, xUnit, yUnit});
  }

  controlPoints.forEach(({x, y, ang, xUnit, yUnit}) => {
    groups[0].push(
      createPath(context => {
        const R = Math.abs(Random.noise2D(x, y, 1, 0.25));
        context.arc(x, y, R, 0, TWO_PI);
        context.moveTo(MID_X + (GAP * xUnit), MID_Y + (GAP * yUnit));
        context.lineTo(MID_X + (xUnit * ((PATTERN_R) - R)), MID_Y + (yUnit * ((PATTERN_R) - R)));
      })
    );

    groups[1].push(
      createPath(context => {
        const R = Math.abs(Random.noise2D(x, y, 1, 0.5));
        context.arc(x, y, R, 0, TWO_PI);
        context.moveTo(MID_X + (xUnit * (PATTERN_R + R)), MID_Y + (yUnit * (PATTERN_R + R)));
        context.lineTo(MID_X + (xUnit * 20), MID_Y + (yUnit * 20));
      })
    );

    groups[2].push(
      createPath(context => {
        const R = Math.abs(Random.noise2D(x, y, 1, 0.375));
        context.arc(x, y, R, 0, TWO_PI);
      })
    );
  })

  // Draw a point in the corner of each group for aligning
  groups.forEach(group => {
    group.push(
      createPath(context => {
        context.lineTo(MARGIN, MARGIN);
      })
    )
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
