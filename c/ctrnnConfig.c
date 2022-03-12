//
//  Created by Steffan Ianigro on 4/06/2016.
//

#include "ctrnnConfig.h"

void initConfigDesc(ConfigDesc *configDesc, int numInputNodes, int numberHiddenNodes){
    // Assign membery for config description elements.
    configDesc->inputNodes = (ConfigNode *)malloc(sizeof(ConfigNode) * numInputNodes);
    configDesc->hiddenNodes = (ConfigNode *)malloc(sizeof(ConfigNode) * numberHiddenNodes);
    configDesc->numInputNodes = numInputNodes;
    configDesc->numHiddenNodes = numberHiddenNodes;
}

void initConfigData(ConfigData *configData, int numConfigs){
    if(configData && configData->initialised == 1){
        destroyConfigData(configData);
    }
    configData->configDescriptions = (ConfigDesc *)malloc(sizeof(ConfigDesc) * numConfigs);
    configData->numConfigs = numConfigs;
}

void destroyConfigData(ConfigData *configData){
    int numConfigs = configData->numConfigs;
    int config;
    for(config = 0; config < numConfigs; config++){
        // Free input node weights.
        int index;
        for(index = 0; index < configData->configDescriptions[config].numInputNodes; index++){
            if(configData->configDescriptions[config].inputNodes[index].weights){
                free(configData->configDescriptions[config].inputNodes[index].weights);
            }
        }
        // Free hidden node weights.
        for(index = 0; index < configData->configDescriptions[config].numHiddenNodes; index++){
            if(configData->configDescriptions[config].hiddenNodes[index].weights){
                free(configData->configDescriptions[config].hiddenNodes[index].weights);
            }
        }
        // Free config description nodes.
        if(configData->configDescriptions[config].inputNodes){
            free(configData->configDescriptions[config].inputNodes);
        }
        if(configData->configDescriptions[config].hiddenNodes){
            free(configData->configDescriptions[config].hiddenNodes);
        }
    }
    // Free config description.
    if(configData->configDescriptions){
        free(configData->configDescriptions);
    }
    configData->initialised = 0;
}
