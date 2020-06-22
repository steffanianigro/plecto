package com.steffanianigro.plecto;

public class LeakyIntegrator {

    // Passed into constructor.
    private int numInputs;
    public float timeStep;
    private float timeConstant;
    public float gain;
    private float bias;
    private float sineCoefficient;
    private float frequencyMultiplier;
    // Get initialised in constructor.
    public float inputs[];
    public float weights[];
    private Params params;
    // Params change over time.
    public float y = 0f;
    private float tempOutput = 0f;
    public float output = 0f;

    LeakyIntegrator(Params params, int numInputs, float timeStep, float timeConstant, float gain, float bias, float sineCoefficient, float frequencyMultiplier) {
        this.timeStep = timeStep;
        this.timeConstant = timeConstant;
        this.gain = gain;
        this.bias = bias;
        this.sineCoefficient = sineCoefficient;
        this.frequencyMultiplier = frequencyMultiplier;
        this.params = params;
        this.inputs = new float[numInputs];
        this.weights = new float[numInputs];
        this.numInputs = numInputs;

    }

    public void calculateOutput() {
        float yDot = -1.0f * this.y;
        for(int k = 0; k < this.numInputs; k++){
            yDot += this.weights[k] * this.inputs[k];
        }
        yDot /= this.timeConstant;
        this.y += yDot * this.timeStep;
        this.tempOutput = this.params.transferFunction(this.gain * (this.y - this.bias), this.sineCoefficient, this.frequencyMultiplier);
    }


    public void updateTimeStep(float timeStep){
        this.timeStep = timeStep;
    }

    public void update(){
        this.output = this.tempOutput;
    }

    public float getOutput(){
        return this.output;
    }

    public void reset() {
        this.y = 0;
        this.output = 0;
        this.tempOutput = 0;
    }

}
