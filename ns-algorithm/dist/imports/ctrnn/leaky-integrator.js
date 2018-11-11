"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LI = function () {
	/**
        * Creates a new Leaky Integrator
        * @param {number} numInputs, the number of inputs the LI has.
    */
	function LI(numInputs) {
		_classCallCheck(this, LI);

		// Get set when configuration loaded.
		this.gain; // Spread of curve. High gain = step function.
		this.bias; // Shift left right.
		this.t; // Time constant like spring. Higher = faster.

		this.transferFunction; // Gets set later.
		this.y = 0; // Activation to pass into transfer function with gain and bias.
		this.timeStep = 0;
		this.inputs = new Array(numInputs);
		this.weights = new Array(numInputs);
		this.numInputs = numInputs;
		this.tempOutput = 0;
		this.output = 0;
	}
	/**
        * Calculates the temp output of LI.
    */


	_createClass(LI, [{
		key: "calculateTempOutput",
		value: function calculateTempOutput() {
			var y_dot = void 0;
			y_dot = -1.0 * this.y;
			// g(y-b) already calculated for inputs.
			for (var k = 0; k < this.numInputs; k++) {
				y_dot += this.weights[k] * this.inputs[k];
			}
			y_dot /= this.t;
			this.y += y_dot * this.timeStep;
			this.tempOutput = this.transferFunction(this.gain * (this.y - this.bias));
		}
		/**
         * Assigns temp output to actual output, setting neuron state.
     */

	}, {
		key: "update",
		value: function update() {
			this.output = this.tempOutput;
		}
		/**
         * Gets the output of the LI.
     */

	}, {
		key: "getOutput",
		value: function getOutput() {
			return this.output;
		}
		/**
         * Resets the LI.
     */

	}, {
		key: "reset",
		value: function reset() {
			this.y = 0;
			this.output = 0;
			this.tempOutput = 0;
		}
	}]);

	return LI;
}();

exports.default = LI;