package com.steffanianigro.plecto;

import org.json.JSONArray;
import org.json.JSONObject;

public class CTRNN {
    public String configuration = "{\"iNs\":2,\"hNs\":6,\"oNs\":2,\"inputNodes\":[{\"w\":[0.33591557011351547],\"t\":0.005087713137244654,\"sineCoefficient\":0.19536453161560785,\"frequencyMultiplier\":0.6008036218014103,\"gain\":0.20552132037117343,\"bias\":0.6739208466466902},{\"w\":[0.606776696270888],\"t\":0.5633651183671549,\"sineCoefficient\":0.7216569310173422,\"frequencyMultiplier\":0.20630907138774002,\"gain\":0.24271496908497014,\"bias\":0.6824133216254249}],\"hiddenNodes\":[{\"w\":[0.0056780618507423775,0.40047378131470457,0.439825766804258,0.48697285893845965,0.4399144189947566,0.5323566834031783,0.4816115542786401,0.49241333968104284],\"t\":0.4631943814246342,\"sineCoefficient\":0.6748525069680396,\"frequencyMultiplier\":0.28188437990249504,\"gain\":0.9252093052090757,\"bias\":0.06194040943927548},{\"w\":[0.0207248831038791,0.1629649513130509,0.28258027054583956,0.32632664542453194,0.6328281794400739,0.6812635538272438,0.47394066904536336,0.06497774115428356],\"t\":0.039412018327408704,\"sineCoefficient\":0.8454037519702888,\"frequencyMultiplier\":0.8392995627329531,\"gain\":0.3515632547548264,\"bias\":0.7724284808750526},{\"w\":[0.09380496517282144,0.11230379976633853,0.05285503347015319,0.9567463414289963,0.8213722679732005,0.9292186596399676,0.5484641142971494,0.7551697042211243],\"t\":0.3605606374467327,\"sineCoefficient\":0.3761297082043047,\"frequencyMultiplier\":0.895083173191318,\"gain\":0.3918840739042624,\"bias\":0.43358338583942624},{\"w\":[0.21046158874348997,0.25266866216592443,0.9163795281944918,0.9576102687890216,0.7102445739937633,0.6595835036862387,0.07853342977484323,0.6753250650534128],\"t\":0.6343775453638565,\"sineCoefficient\":0.36686903311381025,\"frequencyMultiplier\":0.27105837693044954,\"gain\":0.7234193300870835,\"bias\":0.18178686558424517},{\"w\":[0.951477924097186,0.36356337272700157,0.21682336119827572,0.9231032206736163,0.47324696622273676,0.6872550084235718,0.3169468975570633,0.8451954928435765],\"t\":0.27269109229112787,\"sineCoefficient\":0.6974499360640716,\"frequencyMultiplier\":0.6485741401642264,\"gain\":0.5969564527739926,\"bias\":0.9555790313995283},{\"w\":[0.8111345931311502,0.3327986377777452,0.5428756515202862,0.012655415895013844,0.754580592022664,0.7273561959937482,0.46280175181949956,0.8600638945961745],\"t\":0.36706934648138634,\"sineCoefficient\":0.2751848989554897,\"frequencyMultiplier\":0.2205266421561285,\"gain\":0.8233193208968377,\"bias\":0.7719640773961773}]}";

    private LeakyIntegrator inputNodes[];
    private LeakyIntegrator hiddenNodes[];

    private int numberInputNodes;
    private int numberHiddenNodes;
    private Params params;

    CTRNN(float timeStep) {
        // Initialise params.
        this.params = new Params();
        // Construct JSON object.
        JSONObject obj = new JSONObject(this.configuration);
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
