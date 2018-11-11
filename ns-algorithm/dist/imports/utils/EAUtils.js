'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.expandMIDIInputs = exports.generateConfig = exports.mutateConfig = exports.rankPopulation = exports.calculateMetricNovelty = exports.logMem = exports.calculateNetworkDistance = exports.calculateAverageNovelty = exports.calculateIndividualsToSave = exports.mutationThresh = exports.calculateNewValue = exports.supressIndividuals = exports.clonePopulation = exports.generateSubPopulations = exports.addRanCells = exports.logPop = exports.generatePopulation = undefined;

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _gaussian = require('./gaussian');

var gaussian = _interopRequireWildcard(_gaussian);

var _clone = require('clone');

var _clone2 = _interopRequireDefault(_clone);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _ctrnnUtils = require('../utils/ctrnnUtils');

var _dtw = require('./dtw/dtw');

var _dtw2 = _interopRequireDefault(_dtw);

var _dsp = require('./dsp.js');

var _dsp2 = _interopRequireDefault(_dsp);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dsp = new _dsp2.default();
var CTRNNUtil = new dsp.CTRNNUtil();

var transpose = function transpose(original) {
    var copy = [];
    for (var i = 0; i < original.length; ++i) {
        for (var j = 0; j < original[i].length; ++j) {
            // skip undefined values to preserve sparse array
            if (original[i][j] === undefined) continue;
            // create row if it doesn't exist yet
            if (copy[j] === undefined) copy[j] = [];
            // swap the x and y coords for the copy
            copy[j][i] = original[i][j];
        }
    }
    return copy;
};

var generatePopulation = exports.generatePopulation = function generatePopulation(neuralNetwork, networkInputs, numIndividuals, iNodes, hNodes, oNodes, cb) {
    var population = [];
    _async2.default.whilst(function () {
        return population.length < numIndividuals;
    }, function (individualDone) {
        generateConfig(neuralNetwork, networkInputs, iNodes, hNodes, oNodes, function (err, config) {
            if (err) {
                return individualDone(err);
            }
            population.push(config);
            individualDone();
        });
    }, function (err) {
        cb(err, population);
    });
};

var logPop = exports.logPop = function logPop(population, count) {
    var popLength = population.length;
    for (var i = 0; i < popLength; i++) {
        console.log(count + " novelty: " + population[i].novelty);
    }
    console.log('length:' + popLength);
};

var addRanCells = exports.addRanCells = function addRanCells(neuralNetwork, networkInputs, population, numIndividualsToAdd, iNodes, hNodes, oNodes, cb) {
    var individualsAdded = 0;
    _async2.default.whilst(function () {
        return individualsAdded < numIndividualsToAdd;
    }, function (individualDone) {
        generateConfig(neuralNetwork, networkInputs, iNodes, hNodes, oNodes, function (err, config) {
            if (err) {
                return individualDone(err);
            }
            population.push(config);
            individualsAdded++;
            individualDone();
        });
    }, function (err) {
        cb(err);
    });
};

var generateSubPopulations = exports.generateSubPopulations = function generateSubPopulations(population, nClones, clonedPopulations) {
    var popLength = population.length;
    for (var clonedPop = 0; clonedPop < popLength; clonedPop++) {
        clonedPopulations['clonePop' + clonedPop] = [];
        for (var ind = 0; ind < nClones; ind++) {
            clonedPopulations['clonePop' + clonedPop].push((0, _clone2.default)(population[ind]));
        }
    }
};

var clonePopulation = exports.clonePopulation = function clonePopulation(population) {
    var clonedPopulation = [];
    var popLength = population.length;
    for (var i = 0; i < popLength; i++) {
        clonedPopulation.push((0, _clone2.default)(population[i]));
    }
    return clonedPopulation;
};

var supressIndividuals = exports.supressIndividuals = function supressIndividuals(population, supressionThresholds, metrics) {
    for (var i = 0; i < population.length; i++) {
        for (var j = 0; j < population.length; j++) {
            if (i != j) {
                var networkDistances;

                (function () {
                    networkDistances = calculateNetworkDistance(population[i], population[j], metrics);

                    console.log('distance', networkDistances);
                    var supressCount = 0;
                    var numMetrics = Object.keys(networkDistances).length;
                    _lodash2.default.forOwn(networkDistances, function (error, type) {
                        if (networkDistances < supressionThresholds[type]) {
                            supressCount++;
                        }
                    });
                    if (supressCount === numMetrics) {
                        population.splice(j, 1);
                        if (j < i) {
                            i--;
                        }
                        j--;
                    }
                })();
            }
        }
    }
};

var calculateNewValue = exports.calculateNewValue = function calculateNewValue(currentVal, novelty) {
    var inverseNovelty = 1 - novelty;
    var beta = 5;
    var alpha = 1 / beta * Math.exp(inverseNovelty * -1);
    var newValue = currentVal + alpha * gaussian.genValue(0, 1);
    if (newValue > 1) {
        newValue = 1;
    }
    if (newValue < 0) {
        newValue = 0;
    }
    return newValue;
};

var mutationThresh = exports.mutationThresh = function mutationThresh(novelty) {
    var inverseNovelty = 1 - novelty;
    var beta = 3;
    var alpha = 1 / beta * Math.exp(inverseNovelty * -1);
    return alpha;
};

var calculateIndividualsToSave = exports.calculateIndividualsToSave = function calculateIndividualsToSave(population, baseMetrics, noveltyThreshholds) {
    var popToSave = [];
    _lodash2.default.forEach(population, function (individual) {
        var metricNovelty = {};
        baseMetrics.map(function (metric) {
            metricNovelty[metric] = individual[metric + 'Novelty'];
        });
        var noveltyExceededCount = 0;
        _lodash2.default.forOwn(metricNovelty, function (novelty, type) {
            console.log(type, novelty, noveltyThreshholds[type]);
            if (novelty > noveltyThreshholds[type]) {
                noveltyExceededCount++;
            }
        });
        // If there are one or more metrics that surpass novelty threshold.
        if (noveltyExceededCount == baseMetrics.length) {
            popToSave.push(individual);
        }
    });
    return popToSave;
};

var calculateAverageNovelty = exports.calculateAverageNovelty = function calculateAverageNovelty(population, baseMetrics) {
    var metricNovelty = {};
    var popLength = population.length;
    // Initialise 0 values.
    baseMetrics.map(function (metric) {
        metricNovelty[metric] = 0;
    });
    _lodash2.default.forEach(population, function (individual) {
        // Should be for base types, not all.
        baseMetrics.map(function (metric) {
            metricNovelty[metric] += individual[metric + 'Novelty'];
        });
    });
    _lodash2.default.forOwn(metricNovelty, function (errorTotal, metricType) {
        metricNovelty[metricType] = errorTotal / popLength;
    });
    return metricNovelty;
};

var calculateNetworkDistance = exports.calculateNetworkDistance = function calculateNetworkDistance(configOne, configTwo, metrics) {
    var networkDistances = {};
    var metricCounts = {};
    var metricNovelty = {};
    // Reset novelty and count.
    metrics.map(function (metric) {
        metricCounts[metric.type] = 0;
        metricNovelty[metric.type] = 0;
    });
    // Get distance for each metric. 
    metrics.map(function (metric) {
        var distance = compareArray(configOne[metric.id], configTwo[metric.id]);
        metricCounts[metric.type] += 1;
        metricNovelty[metric.type] += distance;
    });
    _lodash2.default.forOwn(metricCounts, function (count, metricType) {
        // Get average for all metric types.
        var distance = metricNovelty[metricType] / metricCounts[metricType];
        // The distance is used to determine if this individual is close enough to be supressed. 
        networkDistances[metricType] = distance;
    });
    return networkDistances;
};

var logMem = exports.logMem = function logMem() {
    var mem = _util2.default.inspect(process.memoryUsage());
    console.log(mem);
};

// Gives novelty measures for each metric type. Is based on distance between merics.
var calculateMetricNovelty = exports.calculateMetricNovelty = function calculateMetricNovelty(newPopulation, existingPopulation, metrics) {
    _lodash2.default.forEach(newPopulation, function (newIndividual) {
        // Reset novetly for individual.
        metrics.map(function (metric) {
            newIndividual[metric.type + 'Novelty'] = undefined;
        });
        _lodash2.default.forEach(existingPopulation, function (existingIndividual) {
            var metricCounts = {};
            var metricNovelty = {};
            // Reset novelty and count.
            metrics.map(function (metric) {
                metricCounts[metric.type] = 0;
                metricNovelty[metric.type] = 0;
            });
            // Get distance for each metric. 
            metrics.map(function (metric) {
                var distance = compareArray(newIndividual[metric.id], existingIndividual[metric.id]);
                metricCounts[metric.type] += 1;
                metricNovelty[metric.type] += distance;
            });
            _lodash2.default.forOwn(metricCounts, function (count, metricType) {
                // Get average for all metric type.
                var newNovelty = metricNovelty[metricType] / metricCounts[metricType];
                // An individual's novelty is measured by the smallest distance (closest) of each metric type. 
                var currentNovelty = newIndividual[metricType + 'Novelty'];
                if (!currentNovelty) {
                    newIndividual[metricType + 'Novelty'] = newNovelty;
                } else {
                    // Closest other individual.
                    if (newNovelty < currentNovelty) {
                        newIndividual[metricType + 'Novelty'] = newNovelty;
                    }
                }
            });
        });
    });
};

// Ranks the population. Gives a single novelty mesure based on rank.
var rankPopulation = exports.rankPopulation = function rankPopulation(newPopulation, existingPopulation, metrics) {
    //  For each new individual, compare to each of the old population and get smallest distance for each metric.
    _lodash2.default.forEach(newPopulation, function (newIndividual) {
        // Reset novetly for individual.
        metrics.map(function (metric) {
            newIndividual[metric.id + 'Rank'] = undefined;
        });
        _lodash2.default.forEach(existingPopulation, function (existingIndividual) {
            metrics.map(function (metric) {
                // Distance not average but calculated for each metric id (differs from novely search).
                var distance = compareArray(newIndividual[metric.id], existingIndividual[metric.id]);
                var currentDistance = newIndividual[metric.id + 'Rank'];
                if (!currentDistance) {
                    newIndividual[metric.id + 'Rank'] = distance;
                } else {
                    // Closest other individual.
                    if (distance < currentDistance) {
                        newIndividual[metric.id + 'Rank'] = distance;
                    }
                }
            });
        });
    });
    // Calculate rank for individuals.
    var popLength = newPopulation.length;
    metrics.map(function (metric) {
        newPopulation.sort(function (a, b) {
            return b[metric.id + 'Rank'] - a[metric.id + 'Rank'];
        });
        // Assign specific rank to individuals.
        for (var position = 0; position < popLength; position++) {
            newPopulation[position][metric.id + 'Rank'] = position;
        }
    });
    // Calculate novelty from various ranks.
    for (var individual = 0; individual < popLength; individual++) {
        newPopulation[individual].novelty = 0;
        _lodash2.default.forOwn(newPopulation[individual], function (rank, key) {
            if (key.indexOf('Rank') > -1) {
                newPopulation[individual].novelty += rank;
            }
        });
    }
    // Sort from best novelty to worst rank.
    newPopulation.sort(function (a, b) {
        return a.novelty - b.novelty;
    });
    // Normalise novelty value.
    var bestRank = metrics.length * popLength;
    for (var individual = 0; individual < popLength; individual++) {
        newPopulation[individual].novelty = newPopulation[individual].novelty / bestRank;
    }
};

var mutateConfig = exports.mutateConfig = function mutateConfig(neuralNetwork, networkInputs, oldConfig, novelty, cb) {
    var configuration = (0, _clone2.default)(oldConfig);
    _lodash2.default.forEach(configuration.inputNodes, function (node, index) {
        _lodash2.default.forOwn(node, function (param, key) {
            if (key == 'w') {
                _lodash2.default.forEach(param, function (w, index) {
                    // If change of mutation or mutate all cells.
                    var mutateChange = Math.random();
                    if (mutateChange < mutationThresh(novelty)) {
                        param[index] = calculateNewValue(w, novelty);
                    }
                });
            } else {
                // If change of mutation or mutate all cells.
                var mutateChange = Math.random();
                if (mutateChange < mutationThresh(novelty)) {
                    node[key] = calculateNewValue(param, novelty);
                }
            }
        });
    });
    _lodash2.default.forEach(configuration.hiddenNodes, function (node) {
        _lodash2.default.forOwn(node, function (param, key) {
            if (key == 'w') {
                _lodash2.default.forEach(param, function (w, index) {
                    // If change of mutation or mutate all cells.
                    var mutateChange = Math.random();
                    if (mutateChange < mutationThresh(novelty)) {
                        param[index] = calculateNewValue(w, novelty);
                    }
                });
            } else {
                // If change of mutation or mutate all cells.
                var mutateChange = Math.random();
                if (mutateChange < mutationThresh(novelty)) {
                    node[key] = calculateNewValue(param, novelty);
                }
            }
        });
    });
    getCTRNNOutputs(neuralNetwork, networkInputs, configuration, function (err, processedConfig) {
        cb(err, processedConfig);
    });
};

var generateConfig = exports.generateConfig = function generateConfig(neuralNetwork, networkInputs, numINodes, numNodes, numONodes, cb) {
    var configuration = new _ctrnnUtils.ctrnnConfiguration(numINodes, numNodes, numONodes);
    getCTRNNOutputs(neuralNetwork, networkInputs, configuration, function (err, processedConfig) {
        cb(err, processedConfig);
    });
};

var getCTRNNOutputs = function getCTRNNOutputs(neuralNetwork, networkInputs, configuration, cb) {
    neuralNetwork.setConfiguration(configuration);
    // Initialise netowrk with new configuration.
    neuralNetwork.initialise(0.01);
    // Itterate through inputs and transpose.
    _async2.default.eachOfSeries(networkInputs, function (iteration, iterationIndex, iterationDone) {
        var iterationOutputs = [];
        var transposedIteration = transpose(iteration);
        _lodash2.default.forEach(transposedIteration, function (inputs) {
            iterationOutputs.push(CTRNNUtil.renderIteration(neuralNetwork, inputs));
        });
        var transposedOutputs = transpose(iterationOutputs);
        // For each itteration. Has to be divided by power of two.
        var windowSize = transposedOutputs[0].length / 2;
        _async2.default.eachOfSeries(transposedOutputs, function (output, outputIndex, outputDone) {
            // let fft = dsp.getFFTBins(output, windowSize)
            dsp.getParallelFFTBins(output, windowSize, function (err, fft) {
                if (err) {
                    return outputDone(err);
                }
                var mfcc = dsp.getMFCC(fft.avg, 10, 1, 5);
                configuration['iteration-' + iterationIndex + '-output-' + outputIndex + '-mfcc'] = mfcc;
                var freq = dsp.getMaxFrequency(fft.avg, 44100);
                if (isNaN(freq)) {
                    freq = 0;
                }
                configuration['iteration-' + iterationIndex + '-output-' + outputIndex + '-freq'] = [freq];
                var centroid = dsp.getSpectralCentroid(fft.avg, 44100);
                if (isNaN(centroid)) {
                    centroid = 0;
                }
                configuration['iteration-' + iterationIndex + '-output-' + outputIndex + '-centroid'] = [centroid];
                var spectralSpread = dsp.getSpectralSpread(fft.avg, centroid);
                if (isNaN(spectralSpread)) {
                    spectralSpread = 0;
                }
                configuration['iteration-' + iterationIndex + '-output-' + outputIndex + '-spread'] = [spectralSpread];
                var outputVariance = dsp.calculateOutputVariance(fft.spectrum);
                configuration['iteration-' + iterationIndex + '-output-' + outputIndex + '-variance'] = outputVariance;
                console.log(freq, centroid, spectralSpread, outputVariance);
                outputDone();
            });
        }, function (err) {
            iterationDone(err);
        });
    }, function (err) {
        cb(err, configuration);
    });
};

var expandMIDIInputs = exports.expandMIDIInputs = function expandMIDIInputs(midiInputs, multiplier) {
    var newStruct = [];
    _lodash2.default.forEach(midiInputs, function (iteration, iterationIndex) {
        newStruct.push([]);
        _lodash2.default.forEach(iteration, function (inputs, inputItteration) {
            newStruct[iterationIndex].push([]);
            _lodash2.default.forEach(inputs, function (input) {
                for (var i = 0; i < multiplier; i++) {
                    newStruct[iterationIndex][inputItteration].push(input);
                }
            });
        });
    });
    return newStruct;
};

var compareArray = function compareArray(arrayOne, arrayTwo) {
    var dtw = new _dtw2.default();
    var cost = dtw.compute(arrayOne, arrayTwo);
    return cost;
};