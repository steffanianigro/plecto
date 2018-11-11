//
//  Created by Steffan Ianigro on 3/06/2016.
//

#ifndef ctrnnParams_h
#define ctrnnParams_h

#ifdef __cplusplus 
extern "C" { 
#endif

#include <stdio.h>
#include <math.h>

double mapGain(double paramValue);

double mapBias(double paramValue);

double mapWeight(double paramValue);

double mapTimeConstant(double paramValue);
    
double mapSineCoefficient(double paramValue);

double mapFrequencyMultiplier(double paramValue);

double sineTransferFunction(double activation, double sineCoefficient, double frequencyMiltiplier);
    
double transferFunction(double activation);

#ifdef __cplusplus 
}
#endif

#endif /* ctrnnParams_h */
