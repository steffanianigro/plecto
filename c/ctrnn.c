//
//  Created by Steffan Ianigro on 2/06/2016.
//

#include "ctrnn.h"

// Initialse CTRNN.
void initialiseCTRNN(CTRNN *ctrnn, ConfigDesc *configDesc, double timeStep){
    // If CTRNN initialed, destroy the CTRNN.
    if(ctrnn->initialised){
        destroyCTRNN(ctrnn);
    }
    // Assign memory for CTRNN.
    ctrnn->inputNodes = (LI *)malloc(sizeof(LI) * configDesc->numInputNodes);
    ctrnn->hiddenNodes = (LI *)malloc(sizeof(LI) * configDesc->numHiddenNodes);
    ctrnn->numInputNodes = configDesc->numInputNodes;
    ctrnn->numHiddenNodes = configDesc->numHiddenNodes;
    // Num output nodes is defined in code and cannot exceed hidden nodes.
    
    // Input Nodes
    int node;
    int w;
    for(node = 0; node < ctrnn->numInputNodes; node++){
        // Map params for each input node.
        ctrnn->inputNodes[node].bias = mapBias(configDesc->inputNodes[node].bias);
        ctrnn->inputNodes[node].gain = mapGain(configDesc->inputNodes[node].gain);
        ctrnn->inputNodes[node].t = mapTimeConstant(configDesc->inputNodes[node].t);
        ctrnn->inputNodes[node].sineCoefficient = mapSineCoefficient(configDesc->inputNodes[node].sineCoefficient);
        ctrnn->inputNodes[node].frequencyMultiplier = mapFrequencyMultiplier(configDesc->inputNodes[node].frequencyMultiplier);
        // Initialise and map weights.
        ctrnn->inputNodes[node].weights = (double *)malloc(sizeof(double));
        ctrnn->inputNodes[node].weights[0] = mapWeight(configDesc->inputNodes[node].weights[0]);
        // Initialise input array.
        ctrnn->inputNodes[node].inputs = (double *)malloc(sizeof(double));
        // Initiliase start state.
        initialiseLI(&ctrnn->inputNodes[node], 1, timeStep);
    }
    // Hidden Nodes
    for(node = 0; node < ctrnn->numHiddenNodes; node++){
        // Map params for each input node.
        ctrnn->hiddenNodes[node].bias = mapBias(configDesc->hiddenNodes[node].bias);
        ctrnn->hiddenNodes[node].gain = mapGain(configDesc->hiddenNodes[node].gain);
        ctrnn->hiddenNodes[node].t = mapTimeConstant(configDesc->hiddenNodes[node].t);
        ctrnn->hiddenNodes[node].sineCoefficient = mapSineCoefficient(configDesc->hiddenNodes[node].sineCoefficient);
        ctrnn->hiddenNodes[node].frequencyMultiplier = mapFrequencyMultiplier(configDesc->hiddenNodes[node].frequencyMultiplier);
        // Initialise and map weights.
        int numInputs = ctrnn->numInputNodes + ctrnn->numHiddenNodes;
        ctrnn->hiddenNodes[node].weights = (double *)malloc(sizeof(double) * numInputs);
        for(w = 0; w < numInputs; w++){
            ctrnn->hiddenNodes[node].weights[w] = mapWeight(configDesc->hiddenNodes[node].weights[w]);
        }
        // Initialise input array.
        ctrnn->hiddenNodes[node].inputs = (double *)malloc(sizeof(double) * numInputs);
        // Initiliase start state.
        initialiseLI(&ctrnn->hiddenNodes[node], numInputs, timeStep);
    }
    ctrnn->initialised = 1;
}
// Feed CTRNN inputs.
void feedCTRNNInputs(CTRNN *ctrnn, double inputs[]){
    int iNode;
    // Each input node has one input thus 0 accessor.
    for(iNode = 0; iNode < ctrnn->numInputNodes; iNode++){
        ctrnn->inputNodes[iNode].inputs[0] = inputs[iNode];
    }
}
// Update CTRNN state.
void updateCTRNN(CTRNN *ctrnn){
    int node;
    int input;
    for(node = 0; node < ctrnn->numInputNodes; node++){
        calculateOutput(&ctrnn->inputNodes[node]);
    }
    for(node = 0; node < ctrnn->numHiddenNodes; node++){
        for(input = 0; input < ctrnn->numInputNodes; input++){
            ctrnn->hiddenNodes[node].inputs[input] = ctrnn->inputNodes[input].output;
        }
        for(input = 0; input < ctrnn->numHiddenNodes; input++){
            ctrnn->hiddenNodes[node].inputs[input + ctrnn->numInputNodes] = ctrnn->hiddenNodes[input].output;
        }
        calculateOutput(&ctrnn->hiddenNodes[node]);
    }
    for(node = 0; node < ctrnn->numInputNodes; node++){
        updateNode(&ctrnn->inputNodes[node]);
    }
    for(node = 0; node < ctrnn->numHiddenNodes; node++){
        updateNode(&ctrnn->hiddenNodes[node]);
    }
}
// Get CTRNN outputs.
void getCTRNNOutput(CTRNN *ctrnn, double * outputs, int numOutputNodes){
    int i;
    for (i = 0; i < numOutputNodes; i++) {
        outputs[i] = getActivation(&ctrnn->hiddenNodes[i]);
    }
}
// Reset CTRNN nodes.
void resetCTRNN(CTRNN *ctrnn){
    int node;
    for(node = 0; node < ctrnn->numInputNodes; node++){
        resetNode(&ctrnn->inputNodes[node]);
    }
    for(node = 0; node < ctrnn->numHiddenNodes; node++){
        resetNode(&ctrnn->hiddenNodes[node]);
    }
}
// Change CTRNN timestep.
void changeCTRNNTimestep(CTRNN *ctrnn, double timeStep){
    int node;
    for(node = 0; node < ctrnn->numInputNodes; node++){
        updateTimestep(&ctrnn->inputNodes[node], timeStep);
    }
    for(node = 0; node < ctrnn->numHiddenNodes; node++){
        updateTimestep(&ctrnn->hiddenNodes[node], timeStep);
    }
}
// Free memory assigned for CTRNN.
void destroyCTRNN(CTRNN *ctrnn){
    int node;
    for(node = 0; node < ctrnn->numInputNodes; node++){
        if(ctrnn->inputNodes[node].weights){
            free(ctrnn->inputNodes[node].weights);
        }
        if(ctrnn->inputNodes[node].inputs){
            free(ctrnn->inputNodes[node].inputs);
        }
    }
    for(node = 0; node < ctrnn->numHiddenNodes; node++){
        if(ctrnn->hiddenNodes[node].weights){
            free(ctrnn->hiddenNodes[node].weights);
        }
        if(ctrnn->hiddenNodes[node].inputs){
            free(ctrnn->hiddenNodes[node].inputs);
        }
    }
    if(ctrnn->inputNodes){
        free(ctrnn->inputNodes);
    }
    if(ctrnn->hiddenNodes){
        free(ctrnn->hiddenNodes);
    }
    ctrnn->initialised = 0;
}
