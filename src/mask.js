import { MAX_HEIGHT, MAX_WIDTH } from "./constants";
import { range, clamp } from "./interpolation";

export const seaAtBordersMask = (x, y) => {
	const [x2, y2] = [MAX_WIDTH/2, MAX_HEIGHT/2];
  const xd = Math.abs(x2 - x) / MAX_WIDTH;
  const yd = Math.abs(y2 - y) / MAX_HEIGHT;
  const border = 0.15;
  const hardness = 2;
  return range(0, border, 0, 1, clamp(range(1, 0, 0, 1, Math.max(xd, yd) * hardness), 0, border));
  // return range(-1, softness, 0, 1, clamp(range(0, Math.max(x2, y2), 1, -1, v), -1, softness));
};