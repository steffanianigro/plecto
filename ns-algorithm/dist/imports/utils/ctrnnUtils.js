"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ctrnnConfiguration = exports.ctrnnConfiguration = function ctrnnConfiguration(inputNodes, hiddenNodes, outputNodes) {
    _classCallCheck(this, ctrnnConfiguration);

    this.iNs = inputNodes;
    this.hNs = hiddenNodes;
    this.oNs = outputNodes;
    this.inputNodes = [];
    this.hiddenNodes = [];
    var numNodes = this.iNs + this.hNs;
    for (var i = 0; i < this.iNs; i++) {
        this.inputNodes.push(new inputNode());
    }
    for (var i = 0; i < this.hNs; i++) {
        this.hiddenNodes.push(new hiddenNode(numNodes));
    }
};

var hiddenNode = function hiddenNode(numNodes) {
    _classCallCheck(this, hiddenNode);

    this.w = [];
    this.t = Math.random();
    this.gain = Math.random();
    this.bias = Math.random();

    for (var node = 0; node < numNodes; node++) {
        this.w.push(Math.random());
    }
};

var inputNode = function inputNode() {
    _classCallCheck(this, inputNode);

    this.w = [Math.random()];
    this.t = Math.random();
    this.gain = Math.random();
    this.bias = Math.random();
};