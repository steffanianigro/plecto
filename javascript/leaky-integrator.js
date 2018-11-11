export default class LI {
	/**
        * Creates a new Leaky Integrator
        * @param {number} numInputs, the number of inputs the LI has.
    */
	constructor(numInputs) {
		// Get set when configuration loaded.
		this.gain; // Spread of curve. High gain = step function.
		this.bias; // Shift left right.
		this.t; // Time constant like spring. Higher = faster.
		this.sineCoefficient; // For sin transfer func (amplitude).
		this.frequencyMultiplier; // For sin transfer fund (frequency).
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
	calculateTempOutput() {
		let y_dot;
		y_dot = -1.0 * this.y;
		// g(y-b) already calculated for inputs.
		for (let k = 0; k < this.numInputs; k++) {
			y_dot += this.weights[k] * this.inputs[k];
		}
		y_dot /= this.t;
		this.y += y_dot * this.timeStep;
		this.tempOutput = this.transferFunction(this.gain * (this.y - this.bias), this.sineCoefficient, this.frequencyMultiplier);
	}
	/**
        * Assigns temp output to actual output, setting neuron state.
    */
	update() {
		this.output = this.tempOutput;
	}
	/**
        * Gets the output of the LI.
    */	
   	getOutput() {
		return this.output;
	}
	/**
        * Resets the LI.
    */	
	reset() {
		this.y = 0;
		this.output = 0;
		this.tempOutput = 0;
	}
}