//
//  Created by Steffan Ianigro on 2/06/2016.
//

#ifndef leakyIntegrator_h
#define leakyIntegrator_h

#ifdef __cplusplus 
extern "C" { 
#endif
    
#include "ext.h"            // standard Max include, always required (except in Jitter)

#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "mapParams.h"


// Leaky Integrator structure.
typedef struct LI {
    double timeStep;
    double gain; // Spread of curve. High gain step function.
    double bias; // Shift left right.
    double t; // Time constant like spring. Higher = faster.
    double sineCoefficient; // For sin transfer func (amplitude).
    double frequencyMultiplier; // For sin transfer fund (frequency).
    double y; // Activation to pass into transfer function with gain and bias.
    double *inputs;
    double *weigths;
    int numInputs;
    double tempOutput;
    double output;
} LI;
    
void initialiseLI(LI *node, int numberInputs, double timeStep);

void calculateOutput(LI *node);

void updateNode(LI *node);

double getActivation(LI *node);

void resetNode(LI *node);
    
void updateTimestep(LI *node, double timeStep);

#ifdef __cplusplus 
}
#endif

#endif /* leakyIntegrator_h */
