//
//  Created by Steffan Ianigro on 4/06/2016.
//

#include "jsonUtils.h"

void renderCTRNNConfigs(ConfigData *configData, char *json){

    int inputNodes = 0;
    int hiddenNodes = 0;
    JSON_Value *root_value;
    JSON_Object *main_object;
    JSON_Array *config_data;
    JSON_Array *input_nodes;
    JSON_Array *hidden_nodes;

    /* parsing json and validating output */
    root_value = json_parse_string(json);
    
    main_object = json_value_get_object(root_value);
    
    config_data = json_object_get_array(main_object, "configs");
    int numConfigs = (int)json_object_get_number(main_object, "total");
    // Initialise config info.
    initConfigData(configData, numConfigs);
    // Iterate through configs.
    int i = 0;
    for (i = 0; i < numConfigs; i++) {
        // Get config from array.
        JSON_Object *config = json_array_get_object(config_data, i);
        // Get numbers of nodes.
        int val = (int)json_object_get_number(config, "iNs");
        inputNodes = val;
        val = (int)json_object_get_number(config, "hNs");
        hiddenNodes = val;
        // Initialise or assign memory for config.
        initConfigDesc(&configData->configDescriptions[i], inputNodes, hiddenNodes);
        // Get tag from config. Convert const to char.
        configData->configDescriptions[i].tag = strdup(json_object_get_string(config, "tag"));
        // Get input nodes from config.
        input_nodes = json_object_get_array(config, "inputNodes");
        int numInputNodes = json_array_get_count(input_nodes);
        if(numInputNodes != inputNodes){
            json_value_free(root_value);
            return;
        }
        char *params[] = {"bias", "gain", "t", "sineCoefficient", "frequencyMultiplier"};
        int node;
        int paramType;
        for(node = 0; node < numInputNodes; node++){
            // Get node from array.
            JSON_Object *inputNode = json_array_get_object(input_nodes, node);
            // For each param type, get data.
            for(paramType = 0; paramType < 5; paramType++){
                double paramVal = json_object_get_number(inputNode, params[paramType]);
                if(strcmp(params[paramType], "bias") == 0){
                    configData->configDescriptions[i].inputNodes[node].bias = paramVal;
                }
                if(strcmp(params[paramType], "gain") == 0){
                    configData->configDescriptions[i].inputNodes[node].gain = paramVal;
                }
                if(strcmp(params[paramType], "t") == 0){
                    configData->configDescriptions[i].inputNodes[node].t = paramVal;
                }
                if(strcmp(params[paramType], "sineCoefficient") == 0){
                    configData->configDescriptions[i].inputNodes[node].sineCoefficient = paramVal;
                }
                if(strcmp(params[paramType], "frequencyMultiplier") == 0){
                    configData->configDescriptions[i].inputNodes[node].frequencyMultiplier = paramVal;
                }
            }
            // Assign memory for number of weights.
            configData->configDescriptions[i].inputNodes[node].weights = (double *)malloc(sizeof(double) * 1);
            // Get weight array. There is always only one for input nodes.
            JSON_Array *weightArray = json_object_get_array(inputNode, "w");
            double paramVal = json_array_get_number(weightArray, 0);
            configData->configDescriptions[i].inputNodes[node].weights[0] = paramVal;
        }
        // Get hidden nodes from config
        hidden_nodes = json_object_get_array(config, "hiddenNodes");
        int numHiddenNodes = json_array_get_count(hidden_nodes);
        if(numHiddenNodes != hiddenNodes){
            json_value_free(root_value);
            return;
        }
        for(node = 0; node < numHiddenNodes; node++){
            // Get node from array.
            JSON_Object *hiddenNode = json_array_get_object(hidden_nodes, node);
            // For each param type, get data.
            for(paramType = 0; paramType < 5; paramType++){
                double paramVal = json_object_get_number(hiddenNode, params[paramType]);
                if(strcmp(params[paramType], "bias") == 0){
                    configData->configDescriptions[i].hiddenNodes[node].bias = paramVal;
                }
                if(strcmp(params[paramType], "gain") == 0){
                    configData->configDescriptions[i].hiddenNodes[node].gain = paramVal;
                }
                if(strcmp(params[paramType], "t") == 0){
                    configData->configDescriptions[i].hiddenNodes[node].t = paramVal;
                }
                if(strcmp(params[paramType], "sineCoefficient") == 0){
                    configData->configDescriptions[i].hiddenNodes[node].sineCoefficient = paramVal;
                }
                if(strcmp(params[paramType], "frequencyMultiplier") == 0){
                    configData->configDescriptions[i].hiddenNodes[node].frequencyMultiplier = paramVal;
                }
            }
            // Assign memory for number of weights.
            int numNodes = inputNodes + hiddenNodes;
            configData->configDescriptions[i].hiddenNodes[node].weights = (double *)malloc(sizeof(double) * numNodes);
            // Get weight array.
            JSON_Array *weightArray = json_object_get_array(hiddenNode, "w");
            int weight;
            for(weight = 0; weight < numNodes; weight++){
                double paramVal = json_array_get_number(weightArray, weight);
                configData->configDescriptions[i].hiddenNodes[node].weights[weight] = paramVal;
            }
        }
    }
    
    json_value_free(root_value);
    configData->initialised = 1;
}

char * extractConfigData(char *json){

    JSON_Value *root_value;
    JSON_Object *main_object;
    JSON_Object *body;
    JSON_Value *config_data;
    
    /* parsing json and validating output */
    root_value = json_parse_string(json);
    main_object = json_value_get_object(root_value);
    body = json_object_get_object(main_object, "data");
    config_data = json_object_get_value(body, "configs");
    char *modified = json_serialize_to_string_pretty(config_data);
    json_value_free(root_value);
    return modified;
}
