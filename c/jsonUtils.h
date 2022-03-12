//
//  Created by Steffan Ianigro on 4/06/2016.
//

#ifndef jsonSorter_h
#define jsonSorter_h

#ifdef __cplusplus 
extern "C" { 
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "parson.h"			// include JSON parser
#include "ctrnnConfig.h"
    

void renderCTRNNConfigs(ConfigData *configData, char *json);
    
char * extractConfigData(char *json);

#ifdef __cplusplus 
}
#endif

#endif /* jsonSorter_h */
