package com.steffanianigro.plecto;

import net.beadsproject.beads.core.UGen;
import org.json.JSONArray;
import org.json.JSONObject;

public class CTRNN {

    private LeakyIntegrator inputNodes[];
    private LeakyIntegrator hiddenNodes[];

    private int numberInputNodes;
    private int numberHiddenNodes;
    private Params params;

    CTRNN(float timeStep, String: configuration) {
        // Initialise params.
        this.params = new Params();
        // Construct JSON object.
        JSONObject obj = new JSONObject(configuration);
        numberInputNodes = obj.getInt("iNs");
        numberHiddenNodes = obj.getInt("hNs");

        inputNodes = new LeakyIntegrator[numberInputNodes];
        hiddenNodes = new LeakyIntegrator[numberHiddenNodes];

        JSONArray inputNodesJSON = obj.getJSONArray("inputNodes");
        for (int n = 0; n < inputNodesJSON.length(); n++) {
            JSONObject node = inputNodesJSON.getJSONObject(n);
            float t = params.mapTimeConstant(node.getFloat("t"));
            float gain = params.mapGain(node.getFloat("gain"));
            float bias = params.mapBias(node.getFloat("bias"));
            float sineCoefficient = params.mapSineCoefficient(node.getFloat("sineCoefficient"));
            float frequencyMultiplier = params.mapFrequencyMultiplier(node.getFloat("frequencyMultiplier"));
            inputNodes[n] = new LeakyIntegrator(this.params,1, timeStep, t, gain, bias, sineCoefficient, frequencyMultiplier);
            JSONArray weightsJSON = node.getJSONArray("w");
            inputNodes[n].weights = new float[weightsJSON.length()];
            for (int w = 0; w < weightsJSON.length(); w++) {
                inputNodes[n].weights[w] = params.mapWeight(weightsJSON.getFloat(w));
            }
        }

        JSONArray hiddenNodesJSON = obj.getJSONArray("hiddenNodes");
        for (int n = 0; n < hiddenNodesJSON.length(); n++) {
            JSONObject node = hiddenNodesJSON.getJSONObject(n);
            float t = params.mapTimeConstant(node.getFloat("t"));
            float gain = params.mapGain(node.getFloat("gain"));
            float bias = params.mapBias(node.getFloat("bias"));
            float sineCoefficient = params.mapSineCoefficient(node.getFloat("sineCoefficient"));
            float frequencyMultiplier = params.mapFrequencyMultiplier(node.getFloat("frequencyMultiplier"));
            // Initialise and map weights.
            int numHiddenInputs = this.numberInputNodes + this.numberHiddenNodes;
            hiddenNodes[n] = new LeakyIntegrator(this.params, numHiddenInputs, timeStep, t, gain, bias, sineCoefficient, frequencyMultiplier);
            JSONArray weightsJSON = node.getJSONArray("w");
            hiddenNodes[n].weights = new float[weightsJSON.length()];
            for (int w = 0; w < weightsJSON.length(); w++) {
                hiddenNodes[n].weights[w] = params.mapWeight(weightsJSON.getFloat(w));
            }
        }
    }

    public void feedCTRNNInputs(float inputs[]){
        // Each input node has one input thus 0 accessor.
        for(int node = 0; node < this.numberInputNodes; node++){
            this.inputNodes[node].inputs[0] = inputs[node];
        }
    }

    public void updateCTRNN(){
        for(int node = 0; node < this.numberInputNodes; node++){
            this.inputNodes[node].calculateOutput();
        }
        for(int node = 0; node < this.numberHiddenNodes; node++){
            for(int input = 0; input < this.numberInputNodes; input++){
                this.hiddenNodes[node].inputs[input] = this.inputNodes[input].output;
            }
            for(int input = 0; input < this.numberHiddenNodes; input++){
                this.hiddenNodes[node].inputs[input + this.numberInputNodes] = this.hiddenNodes[input].output;
            }
            this.hiddenNodes[node].calculateOutput();
        }
        for(int node = 0; node < this.numberInputNodes; node++){
            this.inputNodes[node].update();

        }
        for(int node = 0; node < this.numberHiddenNodes; node++){
            this.hiddenNodes[node].update();
        }
    }

    public float[] getOutput(int numOutputNodes){
        float outputs[] = new float[numOutputNodes];
        if(numOutputNodes <= this.numberHiddenNodes) {
            for (int i = 0; i < numOutputNodes; i++) {
                outputs[i] = this.hiddenNodes[i].getOutput();
            }
        }
        return outputs;
    }

    public void reset(){
        int node;
        for(node = 0; node < this.numberInputNodes; node++){
            this.inputNodes[node].reset();
        }
        for(node = 0; node < this.numberHiddenNodes; node++){
            this.hiddenNodes[node].reset();
        }
    }

    void changeTimeStep(float timeStep){
        int node;
        for(node = 0; node < this.numberInputNodes; node++){
            this.inputNodes[node].updateTimeStep(timeStep);
        }
        for(node = 0; node < this.numberHiddenNodes; node++){
            this.hiddenNodes[node].updateTimeStep(timeStep);
        }
    }

}
