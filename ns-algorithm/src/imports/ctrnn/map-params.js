const GAINMIN = 0;
const GAINMAX = 3;

const BIASMIN = -4;
const BIASMAX = 4;

const WEIGHTMIN = -10;
const WEIGHTMAX = 10;

const TCMIN = 1;
const TCMAX = 3;

const SINECOEFFICIENTMIN = 0;
const SINECOEFFICIENTMAX = 1;

const FREQUENCYMULTIPLIERMIN = 0;
const FREQUENCYMULTIPLIERMAX = 10;

/**
	* Maps Gain parameter
	* @param {number} paramValue, gain to map.
*/
export const mapGain = (paramValue) => {
	return (paramValue * (GAINMAX - GAINMIN)) + GAINMIN;
}
/**
	* Maps Bias parameter.
	* @param {number} paramValue, bias to map.
*/
export const mapBias = (paramValue) => {
	return (paramValue * (BIASMAX - BIASMIN)) + BIASMIN;
}
/**
	* Maps Weight parameter.
	* @param {number} paramValue, weight parameter to map.
*/
export const mapWeight = (paramValue) => {
	return (paramValue * (WEIGHTMAX - WEIGHTMIN)) + WEIGHTMIN;
}
/**
	* Maps Time Constant parameter.
	* @param {number} paramValue, time constant to map.
*/
export const mapTimeConstant = (paramValue) => {
	return (paramValue * (TCMAX - TCMIN)) + TCMIN;
}
/**
	* Maps Sine Coefficient parameter.
	* @param {number} paramValue, time constant to map.
*/
export const mapSineCoefficient = (paramValue) => {
	return (paramValue * (SINECOEFFICIENTMAX - SINECOEFFICIENTMIN)) + SINECOEFFICIENTMIN;
}
/**
	* Maps Sine Coefficient parameter.
	* @param {number} paramValue, time constant to map.
*/
export const mapFrequencyMultiplier = (paramValue) => {
	return (paramValue * (FREQUENCYMULTIPLIERMAX - FREQUENCYMULTIPLIERMIN)) + FREQUENCYMULTIPLIERMIN;
}
/**
	* Transfer function for neuron.
	* @param {number} activation, activation of neuron.
*/
export const transferFunction = (activation) => {
	return Math.tanh(activation);
}
/**
	* SINE Transfer function for neuron.
	* @param {number} activation, activation of neuron.
	* @param {number} sineCoefficient, sine coefficient of neuron.
	* @param {number} frequencyMiltiplier, frequency multiplier of neuron.
*/
export const sineTransferFunction = (activation, sineCoefficient, frequencyMiltiplier) => {
	return (1 - sineCoefficient) * Math.tanh(activation) + sineCoefficient * Math.sin(frequencyMiltiplier * activation);
}