/**
 * fm001
 * Christian Fuller (@eatspaint)
 * July 2, 2020
 */
const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');

const settings = {
  dimensions: 'A3',
  orientation: 'landscape',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm'
};

/**
 * CARRIER_AM_FREQ: frequency of amplitude modulator for carrier wave
 * OP_1 & OP_2: frequencies of operators
 * POST_AM: frequency of amplitude modulation applied after frequency modulation
 * AMP: amplitude applied to wave after all modulation
 * RADIAL_FREQ: frequency of wave used to determine radius at x
 * STEP: space used for iterating along x axis
 */
const CARRIER_AM_FREQ = 3;
const OP_1 = 5;
const OP_2 = 0.3;
const POST_AM = 0.15;
const AMP = 5;
const RADIAL_FREQ = 0.2;
const STEP = 0.02;

const fmWave = (x) => (
  (
    (
      Math.sin(x) + Math.sin(x * CARRIER_AM_FREQ) // AM'ed Carrier
    ) * (
      Math.sin(x * OP_1) * Math.sin(x * OP_2) // 2 Operators
    )
  ) + Math.sin(x * POST_AM) // Post operator AM
);

const radius = (x) => (
  Math.abs(Math.sin(x * RADIAL_FREQ))
)

// Iterate across x axis by STEP, calc y with fmWave, and draw circle with radius
const sketch = (props) => {
  const { width, height, units } = props;
  const paths = [];

  for(let x = 0; x <= width; x += STEP) {
    paths.push(createPath(context => {
      const y = (height / 2) + (AMP * fmWave(x));
      context.arc(
        x, y, // center pos
        radius(x), // r
        0, (2 * Math.PI) // start & end ang
      );
    }));
  }

  // Convert to polylines for clipping
  let lines = pathsToPolylines(paths, { units });
  // Set bounds & clip
  const margin = 0.5;
  const box = [ margin, margin, width - margin, height - margin ];
  lines = clipPolylinesToBox(lines, box);

  return props => renderPaths(lines, {
    ...props,
    lineJoin: 'round',
    lineCap: 'round',
    lineWidth: 0.03,
    optimize: true,
  });
};

canvasSketch(sketch, settings);
