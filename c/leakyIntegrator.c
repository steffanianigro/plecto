//
//  Created by Steffan Ianigro on 2/06/2016.
//

#include "leakyIntegrator.h"

// Initialise LI
void initialiseLI(LI *node, int numberInputs, double timeStep){
    node->numInputs = numberInputs;
    node->timeStep = timeStep;
    node->tempOutput = 0.0;
    node->output = 1.0;
    node->y = 0.0;
}
// Calculate neuron output.
void calculateOutput(LI *node){
    double yDot = -1 * node->y;
    int input;
    for(input = 0; input < node->numInputs; input++){
        yDot += node->inputs[input] * node->weights[input];
    }
    yDot /= node->t;
    node->y += yDot * node->timeStep;
    node->tempOutput = sineTransferFunction(node->gain * (node->y - node->bias), node->sineCoefficient, node->frequencyMultiplier);
}
// Assign temp output to node output.
void updateNode(LI *node){
    node->output = node->tempOutput;
}
// Get activation of LI.
double getActivation(LI *node){
    return node->output;
}
// Reset LI
void resetNode(LI *node){
    node->y = 0;
    node->output = 0;
    node->tempOutput = 0;
}
// Update LI timestep
void updateTimestep(LI *node, double timeStep){
    node->timeStep = timeStep;
}
