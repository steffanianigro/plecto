//
//  Created by Steffan Ianigro on 3/06/2016.
//

#include "mapParams.h"

const double GAINMIN = 0;
const double GAINMAX = 3;

const double BIASMIN = -4;
const double BIASMAX = 4;

const double WEIGHTMIN = -10;
const double WEIGHTMAX = 10;

const double TCMIN = 0.1;
const double TCMAX = 3;

const double SINECOEFFICIENTMIN = 0;
const double SINECOEFFICIENTMAX = 1;

const double FREQUENCYMULTIPLIERMIN = 0;
const double FREQUENCYMULTIPLIERMAX = 10;

double mapGain(double paramValue){
    return (paramValue * (GAINMAX - GAINMIN)) + GAINMIN;
}

double mapBias(double paramValue){
    return (paramValue * (BIASMAX - BIASMIN)) + BIASMIN;
}

double mapWeight(double paramValue){
    return (paramValue * (WEIGHTMAX - WEIGHTMIN)) + WEIGHTMIN;
}

double mapTimeConstant(double paramValue){
    return (paramValue * (TCMAX - TCMIN)) + TCMIN;
}

double mapSineCoefficient(double paramValue){
    return (paramValue * (SINECOEFFICIENTMAX - SINECOEFFICIENTMIN)) + SINECOEFFICIENTMIN;
}

double mapFrequencyMultiplier(double paramValue){
    return (paramValue * (FREQUENCYMULTIPLIERMAX - FREQUENCYMULTIPLIERMIN)) + FREQUENCYMULTIPLIERMIN;
}

double sineTransferFunction(double activation, double sineCoefficient, double frequencyMiltiplier){
    return (1 - sineCoefficient) * tanh(activation) + sineCoefficient * sin(frequencyMiltiplier * activation);
}

double transferFunction(double activation){
    return tanh(activation);
}
