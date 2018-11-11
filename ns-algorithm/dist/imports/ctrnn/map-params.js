"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
var GAINMIN = 0;
var GAINMAX = 3;

var BIASMIN = -4;
var BIASMAX = 4;

var WEIGHTMIN = -10;
var WEIGHTMAX = 10;

var TCMIN = 1;
var TCMAX = 3;

/**
	* Maps Gain parameter
	* @param {number} paramValue, gain to map.
*/
var mapGain = exports.mapGain = function mapGain(paramValue) {
	return paramValue * (GAINMAX - GAINMIN) + GAINMIN;
};
/**
	* Maps Bias parameter.
	* @param {number} paramValue, bias to map.
*/
var mapBias = exports.mapBias = function mapBias(paramValue) {
	return paramValue * (BIASMAX - BIASMIN) + BIASMIN;
};
/**
	* Maps Weight parameter.
	* @param {number} paramValue, weight parameter to map.
*/
var mapWeight = exports.mapWeight = function mapWeight(paramValue) {
	return paramValue * (WEIGHTMAX - WEIGHTMIN) + WEIGHTMIN;
};
/**
	* Maps Time Constant parameter.
	* @param {number} paramValue, time constant to map.
*/
var mapTimeConstant = exports.mapTimeConstant = function mapTimeConstant(paramValue) {
	return paramValue * (TCMAX - TCMIN) + TCMIN;
};
/**
	* Transfer function for neuron.
	* @param {number} activation, activation of neuron.
*/
var transferFunction = exports.transferFunction = function transferFunction(activation) {
	var output = Math.tanh(activation);
	return output;
};