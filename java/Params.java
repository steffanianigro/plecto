package com.steffanianigro.plecto;

public class Params {
    public float GAIN_MIN = 0;
    public float GAIN_MAX = 3;
    public float BIAS_MIN = -4;
    public float BIAS_MAX = 4;
    public float WEIGHT_MIN = -10;
    public float WEIGHT_MAX = 10;
    public float TC_MIN = 1;
    public float TC_MAX = 3;

    public float SINE_COEFFICIENT_MIN = 0;
    public float SINE_COEFFICIENT_MAX = 1;

    public float FREQUENCY_MULTIPLIER_MIN = 0;
    public float FREQUENCY_MULTIPLIER_MAX = 10;

    public float mapGain(float gain) {
        return (gain * (GAIN_MAX - GAIN_MIN)) + GAIN_MIN;
    }

    public float mapBias(float bias) {
        return (bias * (BIAS_MAX - BIAS_MIN)) + BIAS_MIN;
    }

    public float mapWeight(float weight) {
        return (weight * (WEIGHT_MAX - WEIGHT_MIN)) + WEIGHT_MIN;
    }

    public float mapTimeConstant(float tc) {
        return (tc * (TC_MAX - TC_MIN)) + TC_MIN;
    }

    public float mapSineCoefficient(float sineCoefficient) {
        return (sineCoefficient * (SINE_COEFFICIENT_MAX - SINE_COEFFICIENT_MIN)) + SINE_COEFFICIENT_MIN;
    }

    public float mapFrequencyMultiplier(float frequencyMultiplier) {
        return (frequencyMultiplier * (FREQUENCY_MULTIPLIER_MAX - FREQUENCY_MULTIPLIER_MIN)) + FREQUENCY_MULTIPLIER_MIN;
    }

    public float transferFunction(float activation, float sineCoefficient, float frequencyMultiplier){
        return (1 - sineCoefficient) * (float) Math.tanh(activation) + sineCoefficient * (float) Math.sin(frequencyMultiplier * activation);
    }

}
