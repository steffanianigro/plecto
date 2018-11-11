//
//  Created by Steffan Ianigro on 2/06/2016.
//

#ifndef ctrnn_h
#define ctrnn_h

#ifdef __cplusplus 
extern "C" { 
#endif
    
#include "ext.h"            // standard Max include, always required (except in Jitter)
    
#include <stdio.h>
#include <stdlib.h>
#include "mapParams.h"
#include "leakyIntegrator.h"
#include "ctrnnConfig.h"

typedef struct CTRNN {

    LI *hNodes;
    LI *iNodes;
    int numINodes;
    int numHNodes;
    int numONodes;
    Boolean initialised;

} CTRNN;

void destroyCTRNN(CTRNN *ctrnn);

void resetCTRNN(CTRNN *ctrnn);
    
void changeCTRNNTimestep(CTRNN *ctrnn, double timeStep);

void initialiseCTRNN(CTRNN *ctrnn, ConfigDesc *configDesc, double timeStep);

void feedCTRNNInputs(CTRNN *ctrnn, double inputs[]);

void getCTRNNOutput(CTRNN *ctrnn, double * outputs);

void updateCTRNN(CTRNN *ctrnn);


#ifdef __cplusplus 
}
#endif

#endif /* ctrnn_h */
