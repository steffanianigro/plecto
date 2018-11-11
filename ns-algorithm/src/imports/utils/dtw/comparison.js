
export const EPSILON = 2.2204460492503130808472633361816E-16;

export const nearlyEqual = (i, j, epsilon) => {
  var iAbsolute= Math.abs(i);
  var jAbsolute = Math.abs(j);
  var difference = Math.abs(i - j);
  var equal = i === j;
  if (!equal) {
      equal = difference < EPSILON;
      if (!equal) {
          equal = difference <= Math.max(iAbsolute, jAbsolute) * epsilon;
      }
  }
  return equal;
};
