//
//  Created by Steffan Ianigro on 2/06/2016.
//

#include "ctrnn.h"

// Initialse CTRNN.
void initialiseCTRNN(CTRNN *ctrnn, ConfigDesc *configDesc, double timeStep){
    // If CTRNN initialed, destroy the CTRNN.
    if(ctrnn->initialised){
        ctrnn->initialised = false;
        destroyCTRNN(ctrnn);
    }
    // Assign memory for CTRNN.
    ctrnn->iNodes = (LI *)malloc(sizeof(LI) * configDesc->numINodes);
    ctrnn->hNodes = (LI *)malloc(sizeof(LI) * configDesc->numHNodes);
    ctrnn->numINodes = configDesc->numINodes;
    ctrnn->numHNodes = configDesc->numHNodes;
    // Num output nodes is defined in code and cannot exceed hidden nodes.
    
    // Input Nodes
    int node;
    int w;
    for(node = 0; node < ctrnn->numINodes; node++){
        // Map params for each input node.
        ctrnn->iNodes[node].bias = mapBias(configDesc->iNodes[node].bias);
        ctrnn->iNodes[node].gain = mapGain(configDesc->iNodes[node].gain);
        ctrnn->iNodes[node].t = mapTimeConstant(configDesc->iNodes[node].t);
        ctrnn->iNodes[node].sineCoefficient = mapSineCoefficient(configDesc->iNodes[node].sineCoefficient);
        ctrnn->iNodes[node].frequencyMultiplier = mapFrequencyMultiplier(configDesc->iNodes[node].frequencyMultiplier);
        // Initialise and map weights.
        ctrnn->iNodes[node].weigths = (double *)malloc(sizeof(double));
        ctrnn->iNodes[node].weigths[0] = mapWeight(configDesc->iNodes[node].weigths[0]);
        // Initialise input array.
        ctrnn->iNodes[node].inputs = (double *)malloc(sizeof(double));
        // Initiliase start state.
        initialiseLI(&ctrnn->iNodes[node], 1, timeStep);
    }
    // Hidden Nodes
    for(node = 0; node < ctrnn->numHNodes; node++){
        // Map params for each input node.
        ctrnn->hNodes[node].bias = mapBias(configDesc->hNodes[node].bias);
        ctrnn->hNodes[node].gain = mapGain(configDesc->hNodes[node].gain);
        ctrnn->hNodes[node].t = mapTimeConstant(configDesc->hNodes[node].t);
        ctrnn->hNodes[node].sineCoefficient = mapSineCoefficient(configDesc->hNodes[node].sineCoefficient);
        ctrnn->hNodes[node].frequencyMultiplier = mapFrequencyMultiplier(configDesc->hNodes[node].frequencyMultiplier);
        // Initialise and map weights.
        int numInputs = ctrnn->numINodes + ctrnn->numHNodes;
        ctrnn->hNodes[node].weigths = (double *)malloc(sizeof(double) * numInputs);
        for(w = 0; w < numInputs; w++){
            ctrnn->hNodes[node].weigths[w] = mapWeight(configDesc->hNodes[node].weigths[w]);
        }
        // Initialise input array.
        ctrnn->hNodes[node].inputs = (double *)malloc(sizeof(double) * numInputs);
        // Initiliase start state.
        initialiseLI(&ctrnn->hNodes[node], numInputs, timeStep);
    }
    ctrnn->initialised = true;
}
// Feed CTRNN inputs.
void feedCTRNNInputs(CTRNN *ctrnn, double inputs[]){
    int iNode;
    // Each input node has one input thus 0 accessor.
    for(iNode = 0; iNode < ctrnn->numINodes; iNode++){
        ctrnn->iNodes[iNode].inputs[0] = inputs[iNode];
    }
}
// Update CTRNN state.
void updateCTRNN(CTRNN *ctrnn){
    int node;
    int input;
    for(node = 0; node < ctrnn->numINodes; node++){
        calculateOutput(&ctrnn->iNodes[node]);
    }
    for(node = 0; node < ctrnn->numHNodes; node++){
        for(input = 0; input < ctrnn->numINodes; input++){
            ctrnn->hNodes[node].inputs[input] = ctrnn->iNodes[input].output;
        }
        for(input = 0; input < ctrnn->numHNodes; input++){
            ctrnn->hNodes[node].inputs[input + ctrnn->numINodes] = ctrnn->hNodes[input].output;
        }
        calculateOutput(&ctrnn->hNodes[node]);
    }
    for(node = 0; node < ctrnn->numINodes; node++){
        updateNode(&ctrnn->iNodes[node]);
    }
    for(node = 0; node < ctrnn->numHNodes; node++){
        updateNode(&ctrnn->hNodes[node]);
    }
}
// Get CTRNN outputs.
void getCTRNNOutput(CTRNN *ctrnn, double * outputs, int numOutputNodes){
    int i;
    for (i = 0; i < numOutputNodes; i++) {
        outputs[i] = getActivation(&ctrnn->hNodes[i]);
    }
}
// Reset CTRNN nodes.
void resetCTRNN(CTRNN *ctrnn){
    int node;
    for(node = 0; node < ctrnn->numINodes; node++){
        resetNode(&ctrnn->iNodes[node]);
    }
    for(node = 0; node < ctrnn->numHNodes; node++){
        resetNode(&ctrnn->hNodes[node]);
    }
}
// Change CTRNN timestep.
void changeCTRNNTimestep(CTRNN *ctrnn, double timeStep){
    int node;
    for(node = 0; node < ctrnn->numINodes; node++){
        updateTimestep(&ctrnn->iNodes[node], timeStep);
    }
    for(node = 0; node < ctrnn->numHNodes; node++){
        updateTimestep(&ctrnn->hNodes[node], timeStep);
    }
}
// Free memory assigned for CTRNN.
void destroyCTRNN(CTRNN *ctrnn){
    int node;
    for(node = 0; node < ctrnn->numINodes; node++){
        free(ctrnn->iNodes[node].weigths);
        free(ctrnn->iNodes[node].inputs);
    }
    for(node = 0; node < ctrnn->numHNodes; node++){
        free(ctrnn->hNodes[node].weigths);
        free(ctrnn->hNodes[node].inputs);
    }
    free(ctrnn->iNodes);
    free(ctrnn->hNodes);
}
