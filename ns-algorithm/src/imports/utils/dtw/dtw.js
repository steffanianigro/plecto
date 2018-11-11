import * as validate from './validate';
import * as matrix from './matrix';
import * as comparison from './comparison';
import * as euclidean from './euclidean';

/**
  * @title DTW API
  * @author Elmar Langholz
*/

/**
 * Create a DTWOptions object
 * @class DTWOptions
 * @member {string} distanceMetric The distance metric to use: `'manhattan' | 'euclidean' | 'euclidean'`.
 * @member {function} distanceFunction The distance function to use. The function should accept two numeric arguments and return the numeric distance. e.g. function (a, b) { return a + b; }
 */

/**
 * Create a DTW object
 * @class DTW
 */
/**
 * Initializes a new instance of the `DTW`. If no options are provided the squared euclidean distance function is used.
 * @function DTW
 * @param {DTWOptions} [options] The options to initialize the dynamic time warping instance with.
 */
/**
 * Computes the optimal match between two provided sequences.
 * @method compute
 * @param {number[]} firstSequence The first sequence.
 * @param {number[]} secondSequence The second sequence.
 * @param {number} [window] The window parameter (for the locality constraint) to use.
 * @returns {number} The similarity between the provided temporal sequences.
 */
/**
 * Retrieves the optimal match between two provided sequences.
 * @method path
 * @returns {number[]} The array containing the optimal path points.
 */
export default class DTW {

    constructor(){
      this.state = { distanceCostMatrix: null };
      this.state.distance = euclidean.distance;
    }

    compute(firstSequence, secondSequence, window) {
        var cost = Number.POSITIVE_INFINITY;
        if (typeof window === 'undefined') {
            cost = computeOptimalPath(firstSequence, secondSequence, this.state);
        } else if (typeof window === 'number') {
            cost = computeOptimalPathWithWindow(firstSequence, secondSequence, window, this.state);
        } else {
            throw new TypeError('Invalid window parameter type: expected a number');
        }

        return cost;
    };

    path() {
        var path = null;
        if (this.state.distanceCostMatrix instanceof Array) {
            path = retrieveOptimalPath(state);
        }

        return path;
    };
};

const validateComputeParameters = (s, t) => {
    validate.sequence(s, 'firstSequence');
    validate.sequence(t, 'secondSequence');
}

const computeOptimalPath = (s, t, state) => {
    validateComputeParameters(s, t);
    var start = new Date().getTime();
    state.m = s.length;
    state.n = t.length;
    var distanceCostMatrix = matrix.createMatrix(state.m, state.n, Number.POSITIVE_INFINITY);

    distanceCostMatrix[0][0] = state.distance(s[0], t[0]);

    for (var rowIndex = 1; rowIndex < state.m; rowIndex++) {
        var cost = state.distance(s[rowIndex], t[0]);
        distanceCostMatrix[rowIndex][0] = cost + distanceCostMatrix[rowIndex - 1][0];
    }

    for (var columnIndex = 1; columnIndex < state.n; columnIndex++) {
        var cost = state.distance(s[0], t[columnIndex]);
        distanceCostMatrix[0][columnIndex] = cost + distanceCostMatrix[0][columnIndex - 1];
    }

    for (var rowIndex = 1; rowIndex < state.m; rowIndex++) {
        for (var columnIndex = 1; columnIndex < state.n; columnIndex++) {
            var cost = state.distance(s[rowIndex], t[columnIndex]);
            distanceCostMatrix[rowIndex][columnIndex] =
                cost + Math.min(
                    distanceCostMatrix[rowIndex - 1][columnIndex],          // Insertion
                    distanceCostMatrix[rowIndex][columnIndex - 1],          // Deletion
                    distanceCostMatrix[rowIndex - 1][columnIndex - 1]);     // Match
        }
    }

    var end = new Date().getTime();
    var time = end - start;
    state.distanceCostMatrix = distanceCostMatrix;
    state.similarity = distanceCostMatrix[state.m - 1][state.n - 1];
    return state.similarity;
}

const computeOptimalPathWithWindow = (s, t, w, state) => {
    validateComputeParameters(s, t);
    var start = new Date().getTime();
    state.m = s.length;
    state.n = t.length;
    var window = Math.max(w, Math.abs(s.length - t.length));
    var distanceCostMatrix = matrix.createMatrix(state.m + 1, state.n + 1, Number.POSITIVE_INFINITY);
    distanceCostMatrix[0][0] = 0;

    for (var rowIndex = 1; rowIndex <= state.m; rowIndex++) {
        for (var columnIndex = Math.max(1, rowIndex - window); columnIndex <= Math.min(state.n, rowIndex + window); columnIndex++) {
            var cost = state.distance(s[rowIndex - 1], t[columnIndex - 1]);
            distanceCostMatrix[rowIndex][columnIndex] =
                cost + Math.min(
                distanceCostMatrix[rowIndex - 1][columnIndex],          // Insertion
                distanceCostMatrix[rowIndex][columnIndex - 1],          // Deletion
                distanceCostMatrix[rowIndex - 1][columnIndex - 1]);     // Match
        }
    }

    var end = new Date().getTime();
    var time = end - start;
    distanceCostMatrix.shift();
    distanceCostMatrix = distanceCostMatrix.map((row) => {
        return row.slice(1, row.length);
    });
    state.distanceCostMatrix = distanceCostMatrix;
    state.similarity = distanceCostMatrix[state.m - 1][state.n - 1];
    return state.similarity;
}

const retrieveOptimalPath = (state) => {
    var start = new Date().getTime();

    var rowIndex = state.m - 1;
    var columnIndex = state.n - 1;
    var path = [[rowIndex, columnIndex]];
    var epsilon = 1e-14;
    while ((rowIndex > 0) || (columnIndex > 0)) {
        if ((rowIndex > 0) && (columnIndex > 0)) {
            var min = Math.min(
                state.distanceCostMatrix[rowIndex - 1][columnIndex],          // Insertion
                state.distanceCostMatrix[rowIndex][columnIndex - 1],          // Deletion
                state.distanceCostMatrix[rowIndex - 1][columnIndex - 1]);     // Match
            if (comparison.nearlyEqual(min, state.distanceCostMatrix[rowIndex - 1][columnIndex - 1], epsilon)) {
                rowIndex--;
                columnIndex--;
            } else if (comparison.nearlyEqual(min, state.distanceCostMatrix[rowIndex - 1][columnIndex], epsilon)) {
                rowIndex--;
            } else if (comparison.nearlyEqual(min, state.distanceCostMatrix[rowIndex][columnIndex - 1], epsilon)) {
                columnIndex--;
            }
        } else if ((rowIndex > 0) && (columnIndex === 0)) {
            rowIndex--;
        } else if ((rowIndex === 0) && (columnIndex > 0)) {
            columnIndex--;
        }

        path.push([rowIndex, columnIndex]);
    }

    var end = new Date().getTime();
    var time = end - start;
    return path.reverse();
}
