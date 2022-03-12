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

void initConfigData(ConfigData *configData, int numConfigs){
    configData->configDescriptions = (ConfigDesc *)malloc(sizeof(ConfigDesc) * numConfigs);
    configData->numConfigs = numConfigs;
}

void destroyConfigData(ConfigData *configData){
    int numConfigs = configData->numConfigs;
    int config;
    for(config = 0; config < numConfigs; config++){
        // Free input node weights.
        int index;
        for(index = 0; index < configData->configDescriptions[config].numINodes; index++){
            if(configData->configDescriptions[config].iNodes[index].weigths){
                free(configData->configDescriptions[config].iNodes[index].weigths);
            }
        }
        // Free hidden node weights.
        for(index = 0; index < configData->configDescriptions[config].numHNodes; index++){
            if(configData->configDescriptions[config].hNodes[index].weigths){
                free(configData->configDescriptions[config].hNodes[index].weigths);
            }
        }
        // Free config description nodes.
        if(configData->configDescriptions[config].iNodes){
            free(configData->configDescriptions[config].iNodes);
        }
        if(configData->configDescriptions[config].hNodes){
            free(configData->configDescriptions[config].hNodes);
        }
    }
    // Free config description.
    if(configData->configDescriptions){
        free(configData->configDescriptions);
    }
}
