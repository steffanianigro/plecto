'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mapParams = require('./map-params.js');

var mapParams = _interopRequireWildcard(_mapParams);

var _leakyIntegrator = require('./leaky-integrator.js');

var _leakyIntegrator2 = _interopRequireDefault(_leakyIntegrator);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CTRNN = function () {
    /**
        * Create a new Continuous Time Recurrent Neural Network.
    */
    function CTRNN() {
        _classCallCheck(this, CTRNN);

        this.inputNodes = [];
        this.hiddenNodes = [];
        this.configuration = null;
    }
    /**
        * Initialises CTRNN.
        * @param {number} timeStep, the timestep or delta time used for the CTRNN.
    */


    _createClass(CTRNN, [{
        key: 'initialise',
        value: function initialise(timeStep) {
            var _this = this;

            // Clear any old config;
            this.resetCTRNN(true);
            // Ensure config is set.
            if (this.configuration) {
                // Set num of node types for future reference.
                this.numInputNodes = this.configuration.iNs;
                this.numHiddenNodes = this.configuration.hNs;
                this.numOutputNodes = this.configuration.oNs;
                // Calculate number of nodes in CTRNN.
                this.numNodes = this.numInputNodes + this.numHiddenNodes;
                // Set parameters for input nodes.
                _lodash2.default.forEach(this.configuration.inputNodes, function (inputNode, i) {
                    // Input nodes can only have one input.
                    _this.inputNodes.push(new _leakyIntegrator2.default(1));
                    _this.inputNodes[i].transferFunction = mapParams.transferFunction;
                    _this.inputNodes[i].timeStep = timeStep;
                    _this.inputNodes[i].weights[0] = mapParams.mapWeight(inputNode.w[0]);
                    _this.inputNodes[i].gain = mapParams.mapGain(inputNode.gain);
                    _this.inputNodes[i].bias = mapParams.mapBias(inputNode.bias);
                    _this.inputNodes[i].t = mapParams.mapTimeConstant(inputNode.t);
                });
                // Set parameters for hidden nodes.
                _lodash2.default.forEach(this.configuration.hiddenNodes, function (hiddenNode, i) {
                    // Number of inputs equals number of input nodes plus number of hidden nodes (includes self).
                    _this.hiddenNodes.push(new _leakyIntegrator2.default(_this.numNodes));
                    _this.hiddenNodes[i].transferFunction = mapParams.transferFunction;
                    _this.hiddenNodes[i].timeStep = timeStep;
                    for (var j = 0; j < _this.numNodes; j++) {
                        _this.hiddenNodes[i].weights[j] = mapParams.mapWeight(hiddenNode.w[j]);
                    }
                    _this.hiddenNodes[i].gain = mapParams.mapGain(hiddenNode.gain);
                    _this.hiddenNodes[i].bias = mapParams.mapBias(hiddenNode.bias);
                    _this.hiddenNodes[i].t = mapParams.mapTimeConstant(hiddenNode.t);
                });
            } else {
                throw new Error("No configuration set for CTRNN");
            }
        }
        /**
            * Updates the CTRNN for next time step.
        */

    }, {
        key: 'updateCTRNN',
        value: function updateCTRNN() {
            var _this2 = this;

            // Update input node temp outputs (maintaining output value from last step).
            _lodash2.default.forEach(this.inputNodes, function (inputNode) {
                // Do not need to set inputs has it is done by feedInputs function.
                inputNode.calculateTempOutput();
            });
            // Update hidden node temp outputs (maintaining output value from last step).
            _lodash2.default.forEach(this.hiddenNodes, function (hiddenNode, hiddenNodeIndex) {
                _lodash2.default.forEach(_this2.inputNodes, function (inputNode, inputNodeIndex) {
                    hiddenNode.inputs[inputNodeIndex] = inputNode.output;
                });
                _lodash2.default.forEach(_this2.hiddenNodes, function (hiddenInputNode, hiddenInputNodeIndex) {
                    hiddenNode.inputs[hiddenInputNodeIndex + _this2.numInputNodes] = hiddenInputNode.output;
                });
                hiddenNode.calculateTempOutput();
            });
            // Set calculated temp outputs as acutal outputs.
            _lodash2.default.forEach(this.inputNodes, function (inputNode) {
                inputNode.update();
            });
            _lodash2.default.forEach(this.hiddenNodes, function (hiddenNode) {
                hiddenNode.update();
            });
        }
        /**
            * Sets the start configuration for CTRNN.
            * @param {object} newStartConfiguration, the ne start configuration of CTRNN.
        */

    }, {
        key: 'setConfiguration',
        value: function setConfiguration(newStartConfiguration) {
            this.configuration = newStartConfiguration;
        }
        /**
            * Gets the current CTRNN configutaion.
        */

    }, {
        key: 'getConfiguration',
        value: function getConfiguration() {
            return this.configuration;
        }
        /**
            * Gets outputs of CTRNN.
        */

    }, {
        key: 'getOutputs',
        value: function getOutputs() {
            var outputs = new Array(this.numOutputNodes);
            var numOutputNodes = this.numOutputNodes;
            for (var i = 0; i < numOutputNodes; i++) {
                outputs[i] = this.hiddenNodes[i].getOutput();
            }
            return outputs;
        }
        /**
            * Feeds inputs into CTRNN
            * @param {array} inputArray, an array of CTRNN inputs (array length should equal number of input nodes).
        */

    }, {
        key: 'feedInputs',
        value: function feedInputs(inputArray) {
            _lodash2.default.forEach(this.inputNodes, function (inputNode, index) {
                if (isNaN(inputArray[index])) {
                    throw new Error("Too few inputs for CTRNN configuration");
                }
                inputNode.inputs[0] = inputArray[index];
            });
        }
        /**
            * Resets the ctrnn to its starting position.
            * @param {boolean} clearAll, whether to clear all nodes.
        */

    }, {
        key: 'resetCTRNN',
        value: function resetCTRNN(clearAll) {
            if (clearAll) {
                this.inputNodes = [];
                this.hiddenNodes = [];
            } else {
                _lodash2.default.forEach(this.inputNodes, function (inputNode) {
                    inputNode.reset();
                });
                _lodash2.default.forEach(this.hiddenNodes, function (hiddenNode) {
                    hiddenNode.reset();
                });
            }
        }
    }]);

    return CTRNN;
}();

exports.default = CTRNN;