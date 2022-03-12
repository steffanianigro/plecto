# Plecto

## Motivation

This is a research project that explores the use of Continuous Time Recurrent Neural Networks (CTRNNs) as a low-frequency oscillator (LFO). Included is C and Java source code that can be used with the plectomusic.com API.

## Installation

- **C**

Include the **ctrnn.h**, **ctrnnConfig.h** and **jsonUtils.h** files into your project.

```c
  // Convert serialised JSON to ConfigDesc structure.
  renderCTRNNConfigs(configDesc, jsonCtrnnConfig, 1);
  // Initialise by passing in CTRNN structure, and parsed JSON configuration (ConfigDesc structure).
  initialiseCTRNN(ctrnn, configuration, timeStep);
  // Feed in CTRNN inputs as an array of doubles.
  feedCTRNNInputs(ctrnn, inputs);
  // Update CTRNN.
  updateCTRNN(ctrnn);
  // Get CTRNN outputs by passing in a pointer to an array of doubles and an integer representing the number of output nodes.
  getCTRNNOutput(ctrnn, outputs, numOutputNodes);
  // Reset CTRNN to starting values.
  resetCTRNN(ctrnn);
  // Change time step parameter (double).
  changeCTRNNTimestep(ctrnn, timeStep);
  // Free memory allocation.
  destroyCTRNN(ctrnn);
```

- **Java**

Include the **CTRNN.java**, **LeakyIntegrator.java** and **Params.java** files into your project.

```java
  // Initialise by passing in timeStep (float) and a serialised JSON CTRNN configuration.
  CTRNN ctrnn = new CTRNN(timeStep, ctrnn);
  // Feed in CTRNN inputs as an array of floats.
  ctrnn.feedCTRNNInputs(inputs);
  // Update CTRNN.
  ctrnn.updateCTRNN(ctrnn);
  // Get CTRNN outputs by passing in the number of output nodes (int).
  ctrnn.getOutput(numOutputNodes);
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
