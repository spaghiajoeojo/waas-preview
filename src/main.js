import './style.css'
import { MAX_HEIGHT, MAX_WIDTH } from "./constants";
import { createNoise2D } from 'simplex-noise';
import { seaAtBordersMask } from './mask';
import { range } from './interpolation';

document.querySelector('#app').innerHTML = `
  <canvas id="canvas"></canvas>
`;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = MAX_WIDTH;
canvas.height = MAX_HEIGHT;


const noise = createNoise2D();

const additionalHeights = Array(MAX_WIDTH).fill(0);
additionalHeights.forEach((v, i, a) => {
	a[i] = Array(MAX_HEIGHT).fill(0);
});

const scale = 200; // The scaling factor for the noise
const octaves = 8; // The number of octaves to use
const persistence = 0.5; // The persistence of the octaves

const getHeight = (x, y) => {
  let value = 0;
  for (let i = 0; i < octaves; i++) {
    const frequency = Math.pow(2, i);
    const amplitude = Math.pow(persistence, i + 1);
    value += noise(x / scale * frequency, y / scale * frequency) * amplitude;
  }
  let additional = 0;
  try {
  	additional = additionalHeights[x][y];
  } catch(e) {
  	// do nothing
  }
  return range(-1, 1, 0, 1, value + additional) * seaAtBordersMask(x, y);
};

const moistureScale = 10;
const getMoisture = (x, y) => noise(x / moistureScale, y / moistureScale); // generate moisture noise

const getColor = (x, y) => {
  const height = getHeight(x, y);
  return height < -0.2 ? '#0000aa' : height < 0.3 ? '#00aa00' : '#555500';
};

const getConnected = ([x, y]) => {
  if (x < 0 || x > MAX_WIDTH || y < 0 || y > MAX_HEIGHT) {
    return [];
  }
  const currentH = getHeight(x, y);
  const connected = [
  [x+1,y], [x-1,y], [x,y+1], [x,y-1], 
  // [x+1,y+1], [x+1, y-1], [x-1,y+1], [x-1,y-1]
  ];
  return connected
    .map(([x2,y2]) => ({x: x2, y: y2, h: getHeight(x2,y2)}))
    .filter((p) => p.h<currentH)
    .sort((a,b) => a.h - b.h)
    .map(p => [p.x,p.y]);
}

const getInverseConnected = ([x, y]) => {
  if (x < 0 || x > MAX_WIDTH || y < 0 || y > MAX_HEIGHT) {
    return [];
  }
  const currentH = getHeight(x, y);
  const connected = [
  [x+1,y], [x-1,y], [x,y+1], [x,y-1], 
  // [x+1,y+1], [x+1, y-1], [x-1,y+1], [x-1,y-1]
  ];
  return connected
    .map(([x2,y2]) => ({x: x2, y: y2, h: getHeight(x2,y2)}))
    .filter((p) => p.h > currentH)
    .sort((a,b) => a.h - b.h)
    .map(p => [p.x,p.y]);
}

const colorMap = (value) => {
  if (value < 0.4) {
    return '#0000cc';
  } else if (value < 0.5) {
    return '#0000ff';
  } else if (value < 0.6) {
    return '#00aa00';
  } else if (value < 0.75) {
    return '#555500';
  } else {
    return '#ffffff';
  }
};

let max = 0, maxPos;
let min = 2, minPos;
for (let x = 0; x < MAX_WIDTH; x++) {
  for (let y = 0; y < MAX_HEIGHT; y++) {
    const elevation = getHeight(x, y);
    if (max < elevation) {
      max = elevation;
      maxPos = [x, y];
    }
    if (elevation > 0 && min > elevation) {
      min = elevation;
      minPos = [x, y];
    }
    // ctx.fillStyle = `rgb(${Array(3).fill(range(0, 1, 0, 255, elevation)).join(', ')})`;
    ctx.fillStyle = colorMap(elevation);
    ctx.fillRect(x, y, 1, 1);
  }
}

let riverCount = 0;

const pippo = ([x, y]) => {
  ctx.fillStyle = '#00ccff';
  ctx.fillRect(x, y, 1, 1);
  const [newP] = getConnected([x, y]);
  if (newP && getHeight(newP[0], newP[1]) > 0.5) {
  	try {
    	additionalHeights[newP[0]][newP[1]] = getHeight(x, y) - getHeight(newP[0], newP[1]);
    } catch(e) {
    	console.error(e);
      console.warn(newP);
    }

  	setTimeout(() => pippo(newP), 0);
  } else {
  	riverCount++;
  	// console.log("finished", riverCount);
  }
  
}

for (let x = 0; x < MAX_WIDTH; x++) {
  for (let y = 0; y < MAX_HEIGHT; y++) {
  	const [p] = getInverseConnected([x, y]);
    if (!p && getHeight(x, y) > 0.5 && getMoisture(x, y) > 0.5) {
    	pippo([x, y]);
    }
  }
}
