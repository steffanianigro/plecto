//
//  Created by Steffan Ianigro on 4/06/2016.
//

#ifndef ctrnnConfig_h
#define ctrnnConfig_h

#ifdef __cplusplus 
extern "C" { 
#endif

#include <stdio.h>
#include <stdlib.h>
    
typedef struct ConfigNode {
    double gain;
    double bias;
    double t;
    double sineCoefficient;
    double frequencyMultiplier;
    double *weights;
} ConfigNode;

typedef struct ConfigDesc {
    ConfigNode *inputNodes;
    ConfigNode *hiddenNodes;
    int numInputNodes;
    int numHiddenNodes;
    char *tag;
} ConfigDesc;
    
typedef struct ConfigData {
    ConfigDesc *configDescriptions;
    int numConfigs;
    int initialised;
} ConfigData;

void destroyConfigData(ConfigData *configData);
    
void initConfigData(ConfigData *configData, int numConfigs);

void initConfigDesc(ConfigDesc *configDesc, int numInputNodes, int numberHiddenNodes);

#ifdef __cplusplus 
}
#endif

#endif /* ctrnnConfig_h */
