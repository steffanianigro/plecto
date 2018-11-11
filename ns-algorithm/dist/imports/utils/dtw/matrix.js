'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var createArray = function createArray(length, value) {
    if (typeof length !== 'number') {
        throw new TypeError('Invalid length type');
    }

    if (typeof value === 'undefined') {
        throw new Error('Invalid value: expected a value to be provided');
    }

    var array = new Array(length);
    for (var index = 0; index < length; index++) {
        array[index] = value;
    }

    return array;
};

var createMatrix = exports.createMatrix = function createMatrix(m, n, value) {
    var matrix = [];
    for (var rowIndex = 0; rowIndex < m; rowIndex++) {
        matrix.push(createArray(n, value));
    }

    return matrix;
};