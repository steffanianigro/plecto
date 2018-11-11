export const ctrnnConfiguration = class ctrnnConfiguration {
    constructor(inputNodes, hiddenNodes, outputNodes) {
        this.iNs = inputNodes;
        this.hNs = hiddenNodes;
        this.oNs = outputNodes;
        this.inputNodes = []
        this.hiddenNodes = []
        var numNodes = this.iNs + this.hNs;
        for (var i = 0; i < this.iNs; i++) {
            this.inputNodes.push(new inputNode())
        }
        for (var i = 0; i < this.hNs; i++) {
            this.hiddenNodes.push(new hiddenNode(numNodes))
        }
    }
}

const hiddenNode = class hiddenNode {
    constructor(numNodes) {
        this.w = [];
        this.t = Math.random();
        this.sineCoefficient = Math.random();
        this.frequencyMultiplier = Math.random();
        this.gain = Math.random();
        this.bias = Math.random();

        for (var node = 0; node < numNodes; node++) {
            this.w.push(Math.random());
        }
    }
}

const inputNode = class inputNode {
    constructor() {
        this.w = [Math.random()];
        this.t = Math.random();
        this.sineCoefficient = Math.random();
        this.frequencyMultiplier = Math.random();
        this.gain = Math.random();
        this.bias = Math.random();
    }
}
