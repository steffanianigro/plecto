'use strict'

import * as mapParams from './map-params.js'
import leakyIntegrator from './leaky-integrator.js'
import _ from 'lodash'

export default class CTRNN {
    /**
        * Create a new Continuous Time Recurrent Neural Network.
    */
    constructor() {
        this.inputNodes = [];
        this.hiddenNodes = [];
        this.configuration = null;
    }
    /**
        * Initialises CTRNN.
        * @param {number} timeStep, the timestep or delta time used for the CTRNN.
    */
    initialise(timeStep) {
        // Clear any old config;
        this.resetCTRNN(true)
        // Ensure config is set.
        if (this.configuration) {
            // Set num of node types for future reference.
            this.numInputNodes = this.configuration.iNs;
            this.numHiddenNodes = this.configuration.hNs;
            this.numOutputNodes = this.configuration.oNs;
            // Calculate number of nodes in CTRNN.
            this.numNodes = this.numInputNodes + this.numHiddenNodes;
            // Set parameters for input nodes.
            _.forEach(this.configuration.inputNodes, (inputNode, i) => {
                // Input nodes can only have one input.
                this.inputNodes.push(new leakyIntegrator(1));
                this.inputNodes[i].transferFunction = mapParams.sineTransferFunction;
                this.inputNodes[i].timeStep = timeStep;
                this.inputNodes[i].weights[0] = mapParams.mapWeight(inputNode.w[0]);
                this.inputNodes[i].gain = mapParams.mapGain(inputNode.gain);
                this.inputNodes[i].bias = mapParams.mapBias(inputNode.bias);
                this.inputNodes[i].t = mapParams.mapTimeConstant(inputNode.t);
                this.inputNodes[i].sineCoefficient = mapParams.mapSineCoefficient(inputNode.sineCoefficient);
                this.inputNodes[i].frequencyMultiplier = mapParams.mapFrequencyMultiplier(inputNode.frequencyMultiplier);
            })
            // Set parameters for hidden nodes.
            _.forEach(this.configuration.hiddenNodes, (hiddenNode, i) => {
                // Number of inputs equals number of input nodes plus number of hidden nodes (includes self).
                this.hiddenNodes.push(new leakyIntegrator(this.numNodes));
                this.hiddenNodes[i].transferFunction = mapParams.sineTransferFunction;
                this.hiddenNodes[i].timeStep = timeStep;
                for (let j = 0; j < this.numNodes; j++) {
                    this.hiddenNodes[i].weights[j] = mapParams.mapWeight(hiddenNode.w[j]);
                }
                this.hiddenNodes[i].gain = mapParams.mapGain(hiddenNode.gain);
                this.hiddenNodes[i].bias = mapParams.mapBias(hiddenNode.bias);
                this.hiddenNodes[i].t = mapParams.mapTimeConstant(hiddenNode.t);
                this.hiddenNodes[i].sineCoefficient = mapParams.mapSineCoefficient(hiddenNode.sineCoefficient);
                this.hiddenNodes[i].frequencyMultiplier = mapParams.mapFrequencyMultiplier(hiddenNode.frequencyMultiplier);
            })
        } else {
            throw new Error("No configuration set for CTRNN")
        }
    }
    /**
        * Updates the CTRNN for next time step.
    */
    updateCTRNN() {
        // Update input node temp outputs (maintaining output value from last step).
        _.forEach(this.inputNodes, (inputNode) => {
            // Do not need to set inputs has it is done by feedInputs function.
            inputNode.calculateTempOutput();
        })
        // Update hidden node temp outputs (maintaining output value from last step).
        _.forEach(this.hiddenNodes, (hiddenNode) => {
            _.forEach(this.inputNodes, (inputNode, inputNodeIndex) => {
                hiddenNode.inputs[inputNodeIndex] = inputNode.output;
            })
            _.forEach(this.hiddenNodes, (hiddenInputNode, hiddenInputNodeIndex) => {
                hiddenNode.inputs[hiddenInputNodeIndex + this.numInputNodes] = hiddenInputNode.output;
            })
            hiddenNode.calculateTempOutput();
        })
        // Set calculated temp outputs as acutal outputs.
        _.forEach(this.inputNodes, (inputNode) => {
            inputNode.update();
        })
        _.forEach(this.hiddenNodes, (hiddenNode) => {
            hiddenNode.update();
        })
    }
    /**
        * Sets the start configuration for CTRNN.
        * @param {object} newStartConfiguration, the ne start configuration of CTRNN.
    */
    setConfiguration(newStartConfiguration) {
        this.configuration = newStartConfiguration;
    }
    /**
        * Gets the current CTRNN configutaion.
    */
    getConfiguration() {
        return this.configuration;
    }
    /**
        * Gets outputs of CTRNN.
    */
    getOutputs() {
        var outputs = new Array(this.numOutputNodes);
        var numOutputNodes = this.numOutputNodes;
        for (let i = 0; i < numOutputNodes; i++) {
            outputs[i] = this.hiddenNodes[i].getOutput();
        }
        return outputs;
    }
    /**
        * Feeds inputs into CTRNN
        * @param {array} inputArray, an array of CTRNN inputs (array length should equal number of input nodes).
    */
    feedInputs(inputArray) {
        _.forEach(this.inputNodes, (inputNode, index) => {
            if(isNaN(inputArray[index])){
                throw new Error("Too few inputs for CTRNN configuration");
            }
            inputNode.inputs[0] = inputArray[index];
        });
    }
    /**
        * Resets the ctrnn to its starting position.
        * @param {boolean} clearAll, whether to clear all nodes.
    */
    resetCTRNN(clearAll) {
        if(clearAll){
            this.inputNodes = [];
            this.hiddenNodes = [];
        }else{
            _.forEach(this.inputNodes, (inputNode) => {
                inputNode.reset();
            });
            _.forEach(this.hiddenNodes, (hiddenNode) => {
                hiddenNode.reset();
            });
        }
    }
}
