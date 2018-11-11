'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var sequence = exports.sequence = function sequence(_sequence, sequenceParameterName) {
    if (!(_sequence instanceof Array)) {
        throw new TypeError('Invalid sequence \'' + sequenceParameterName + '\' type: expected an array');
    }

    if (_sequence.length < 1) {
        throw new Error('Invalid number of sequence data points for \'' + sequenceParameterName + '\': expected at least one');
    }

    if (typeof _sequence[0] !== 'number') {
        throw new TypeError('Invalid data points types for sequence \'' + sequenceParameterName + '\': expected a number');
    }
};