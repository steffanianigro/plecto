"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var distance = exports.distance = function distance(x, y) {
    var difference = x - y;
    var euclideanDistance = Math.sqrt(difference * difference);
    return euclideanDistance;
};