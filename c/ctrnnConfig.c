//
//  Created by Steffan Ianigro on 4/06/2016.
//

#include "ctrnnConfig.h"

void initConfigDesc(ConfigDesc *configDesc, int numINodes, int numberHNodes){
    // Assign membery for config description elements.
    configDesc->iNodes = (ConfigNode *)malloc(sizeof(ConfigNode) * numINodes);
    configDesc->hNodes = (ConfigNode *)malloc(sizeof(ConfigNode) * numberHNodes);
    configDesc->numINodes = numINodes;
    configDesc->numHNodes = numberHNodes;
}

void initConfigArray(ConfigData *configData, int numINodes, int numberHNodes, int numberONodes){
    configData->configDescriptions = (ConfigDesc *)malloc(sizeof(ConfigDesc) * numINodes);
}

void destroyConfigData(ConfigData *configData){
    int numConfigs = configData->numConfigs;
    int config;
    for(config = 0; config < numConfigs; config++){
        // Free input node weights.
        int index;
        for(index = 0; index < configData->configDescriptions[config].numINodes; index++){
            free(configData->configDescriptions[config].iNodes[index].weigths);
        }
        // Free hidden node weights.
        for(index = 0; index < configData->configDescriptions[config].numHNodes; index++){
            free(configData->configDescriptions[config].hNodes[index].weigths);
        }
        // Free config description nodes.
        free(configData->configDescriptions[config].iNodes);
        free(configData->configDescriptions[config].hNodes);
    }
    // Free config description.
    free(configData->configDescriptions);
}
