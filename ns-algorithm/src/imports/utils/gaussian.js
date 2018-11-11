export const genValue = (mean, stdDev) => {
	var random = Math.random,
		mean = mean,
		sigma = stdDev,
		variance = 1;
	var x1,
		x2,
		rad,
		y1;
	do {
		x1 = 2 * random() - 1;
		x2 = 2 * random() - 1;
		rad = x1 * x1 + x2 * x2;
	} while (rad >= 1 || rad === 0);
	return mean + sigma * x1 * Math.sqrt(-2 * Math.log(rad) / rad);
}