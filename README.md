# Plecto

## Motivation

This is a research project that explores the use of Continuous Time Recurrent Neural Networks (CTRNNs) as a low-frequency oscillator (LFO). Included in this repository are C and Java libraries that can be used with the plectomusic.com API.

___
### Usage
___
**C**

Include the **ctrnn.h**, **ctrnnConfig.h** and **jsonUtils.h** files into your project.

You can pass the JSON response directly from the Plecto API (**https://api.plectomusic.com/profile?profile=plecto**) into the renderCTRNNConfigs function as the jsonCtrnnConfigs argument.

Initialise CTRNN:
```c
  // Convert serialised JSON to the ConfigData structure that contains the parsed CTRNN configurations as ConfigDesc structures for use when initialising the CTRNN structure.
  renderCTRNNConfigs(configData, jsonCtrnnConfigs);
  // Initialise the CTRNN structure by passing in a single parsed CTRNN configuration (ConfigDesc structure) from the configData and the timeStep (double) parameter. Use a timeStep value of 0.01 and adjust accordingly.
  initialiseCTRNN(ctrnn, configuration, timeStep);
```

Loop the following logic:
```c
  // Feed in CTRNN inputs as an array of doubles. If using the Plecto API, four values should be passed in (the number of input nodes).
  feedCTRNNInputs(ctrnn, inputs);
  // Update CTRNN.
  updateCTRNN(ctrnn);
  // Get CTRNN outputs by passing in a pointer to an array of doubles and an integer representing the number of output nodes (this can be any integer value up to the number of CTRNN hidden nodes). If using the Plecto API, 6 is the recommended number of outputs.
  getCTRNNOutput(ctrnn, outputs, numOutputNodes);
```

Additional functions:
```c
  // Reset CTRNN to starting values.
  resetCTRNN(ctrnn);
  // Change time step parameter (double).
  changeCTRNNTimestep(ctrnn, timeStep);
  // Free memory allocation.
  destroyCTRNN(ctrnn);
```

___
### **Java**

Include the **CTRNN.java**, **LeakyIntegrator.java** and **Params.java** files into your project.

This library does not accept the response from the Plecto API but a single JSON CTRNN configuration that can be derived from the API response.

Initialise CTRNN:
```java
  // Initialise by passing in the timeStep (float) parameter and a serialised JSON CTRNN configuration. Use a timeStep value of 0.01 and adjust accordingly.
  CTRNN ctrnn = new CTRNN(timeStep, ctrnn);
```

Loop the following logic:
```java
  // Feed in CTRNN inputs as an array of floats. If using the Plecto API, four values should be passed in (the number of input nodes).
  ctrnn.feedCTRNNInputs(inputs);
  // Update CTRNN.
  ctrnn.updateCTRNN(ctrnn);
  // Get CTRNN outputs by passing in the number of output nodes (this can be any integer value up to the number of CTRNN hidden nodes). If using the Plecto API, 6 is the recommended number of outputs.
  ctrnn.getOutput(numOutputNodes);
```

Additional functions:
```java
  // Reset CTRNN to starting values.
  ctrnn.reset()
  // Change time step (float).
  ctrnn.changeTimeStep(timeStep);
```

If you have any issues utilising these libraries, please contact me via plectomusic.com.

## MIT License

Copyright (c) 2016 Steffan Ianigro, Oliver Bown

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
