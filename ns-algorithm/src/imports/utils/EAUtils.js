import util, { callbackify } from 'util';
import _ from 'lodash';
import fs from 'fs';
import * as gaussian from './gaussian';
import clone from 'clone';
import async from 'async';
import { ctrnnConfiguration } from '../utils/ctrnnUtils';
import DTW from './dtw/dtw';
import DSP from './dsp.js';
const dsp = new DSP
const CTRNNUtil = new dsp.CTRNNUtil
const WavEncoder = require("wav-encoder");

const transpose = (original) => {
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
}

export const generatePopulation = (neuralNetwork, networkInputs, numIndividuals, iNodes, hNodes, oNodes, cb) => {
    let population = []
    async.whilst(() => {
        return population.length < numIndividuals;
    }, (individualDone) => {
        generateConfig(neuralNetwork, networkInputs, iNodes, hNodes, oNodes, (err, config) => {
            if(err) {
                return individualDone(err)
            }
            population.push(config)
            individualDone()
        });
    }, (err) => {
        cb(err, population)
    })
}

export const logPop = (population, count) => {
    var popLength = population.length;
    for (var i = 0; i < popLength; i++) {
        console.log(count + " novelty: " + population[i].novelty);
    }
    console.log('length:' + popLength);
}

export const addRanCells = (neuralNetwork, networkInputs, population, numIndividualsToAdd, iNodes, hNodes, oNodes, cb) => {
    let individualsAdded = 0
    async.whilst(() => {
        return individualsAdded < numIndividualsToAdd;
    }, (individualDone) => {
        generateConfig(neuralNetwork, networkInputs, iNodes, hNodes, oNodes, (err, config) => {
            if(err) {
                return individualDone(err)
            }
            population.push(config)
            individualsAdded++
            individualDone()
        });
    }, (err) => {
        cb(err)
    })
}

export const generateSubPopulations = (population, nClones, clonedPopulations) => {
    let popLength = population.length;
    for (var clonedPop = 0; clonedPop < popLength; clonedPop++) {
        clonedPopulations['clonePop' + clonedPop] = [];
        for (var ind = 0; ind < nClones; ind++) {
            clonedPopulations['clonePop' + clonedPop].push(clone(population[ind]));
        }
    }
}

export const clonePopulation = (population) => {
    let clonedPopulation = [];
    let popLength = population.length;
    for (var i = 0; i < popLength; i++) {
        clonedPopulation.push(clone(population[i]));
    }
    return clonedPopulation;
}

export const supressIndividuals = (population, supressionThresholds, metrics) => {
    for (var i = 0; i < population.length; i++) {
        for (var j = 0; j < population.length; j++) {
            if (i != j) {
                var networkDistances = calculateNetworkDistance(population[i], population[j], metrics);
                console.log('distance', networkDistances);
                let supressCount = 0;
                let numMetrics = Object.keys(networkDistances).length;
                _.forOwn(networkDistances, (error, type) => {
                    if(networkDistances < supressionThresholds[type]){
                        supressCount++;
                    }
                })
                if (supressCount === numMetrics) {
                    population.splice(j, 1);
                    if (j < i) {
                        i--;
                    }
                    j--;
                }
            }
        }
    }
}

export const calculateNewValue = (currentVal, novelty) => {
    let inverseNovelty = 1 - novelty;
    var beta = 5;
    var alpha = (1 / beta) * Math.exp(inverseNovelty * -1);
    var newValue = currentVal + (alpha * gaussian.genValue(0, 1));
    if (newValue > 1) {
        newValue = 1;
    }
    if (newValue < 0) {
        newValue = 0;
    }
    return newValue;
}

export const mutationThresh = (novelty) => {
    let inverseNovelty = 1 - novelty;
    var beta = 2;
    var alpha = (1 / beta) * Math.exp(inverseNovelty * -1);
    return alpha;
}

export const calculateAndRemoveIndividualsToSave = (population, baseMetrics, noveltyThreshholds) => {
    let popToSave = [];
    _.remove(population, (individual) => {
        let metricNovelty = {};
        baseMetrics.map((metric) => {
            metricNovelty[metric] = individual[metric + 'Novelty'];
        });
        let noveltyExceededCount = 0;
        _.forOwn(metricNovelty, (novelty, type) => {
            console.log(type, novelty, noveltyThreshholds[type])
            if(novelty > noveltyThreshholds[type]){
                noveltyExceededCount++;
            }
        });
        // If there are one or more metrics that surpass novelty threshold.
        console.log(noveltyExceededCount, Object.keys(metricNovelty).length)
        if(noveltyExceededCount == Object.keys(metricNovelty).length){
        // if(noveltyExceededCount >= 1){
            popToSave.push(_.cloneDeep(individual))
            // Remove individual after saving to population.
            return true
        }
    });
    return popToSave;
}

export const calculateAverageNovelty = (population, baseMetrics) => {
    let metricNovelty = {};
    let popLength = population.length;
    // Initialise 0 values.
    baseMetrics.map((metric) => {
        metricNovelty[metric] = 0;
    });
    _.forEach(population, (individual) => {
        // Should be for base types, not all.
        baseMetrics.map((metric) => {
            metricNovelty[metric] += individual[metric + 'Novelty'];
        });
    });
    _.forOwn(metricNovelty, (errorTotal, metricType) => {
        metricNovelty[metricType] = errorTotal / popLength;
    });
    return metricNovelty;
}

export const calculateNetworkDistance = (configOne, configTwo, metrics) => {
    let networkDistances = {};
    let metricCounts = {};
    let metricNovelty = {};
    // Reset novelty and count.
    metrics.map((metric) => {
        metricCounts[metric.type] = 0;
        metricNovelty[metric.type] = 0;
    });
    // Get distance for each metric. 
    metrics.map((metric) => {
        let distance = compareArray(configOne[metric.id], configTwo[metric.id]);
        metricCounts[metric.type] += 1;
        metricNovelty[metric.type] += distance;
    });
    _.forOwn(metricCounts, (count, metricType) => {
        // Get average for all metric types.
        let distance = metricNovelty[metricType] / metricCounts[metricType];
        // The distance is used to determine if this individual is close enough to be supressed. 
        networkDistances[metricType] = distance;
    });
    return networkDistances;
}

export const logMem = () => {
    var mem = util.inspect(process.memoryUsage());
    console.log(mem);
}

// Gives novelty measures for each metric type. Is based on distance between merics.
export const calculateMetricNovelty = (newPopulation, existingPopulation, metrics) => {
    _.forEach(newPopulation, (newIndividual) => {
        // Reset novetly for individual.
        metrics.map((metric) => {
            newIndividual[metric.type + 'Novelty'] = null;
        });
        _.forEach(existingPopulation, (existingIndividual) => {
            let metricCounts = {};
            let metricNovelty = {};
            // Reset novelty and count.
            metrics.map((metric) => {
                metricCounts[metric.type] = 0;
                metricNovelty[metric.type] = 0;
            });
            // Get distance for each metric. 
            metrics.map((metric) => {
                let distance = compareArray(newIndividual[metric.id], existingIndividual[metric.id]);
                metricCounts[metric.type] += 1;
                metricNovelty[metric.type] += distance;
            });
            _.forOwn(metricCounts, (count, metricType) => {
                // Get average for all metric types.
                let newNovelty = metricNovelty[metricType] / metricCounts[metricType];
                // An individual's novelty is measured by the smallest distance (closest) of each metric type. 
                let currentNovelty = newIndividual[metricType + 'Novelty'];
                if (currentNovelty === null) {
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
}

// Ranks the population. Gives a single novelty mesure based on rank.
export const rankPopulation = (newPopulation, existingPopulation, metrics) => {
    //  For each new individual, compare to each of the old population and get smallest distance for each metric.
    _.forEach(newPopulation, (newIndividual) => {
        // Reset novetly for individual.
        metrics.map((metric) => {
            newIndividual[metric.id + 'Rank'] =  null;
        });
        _.forEach(existingPopulation, (existingIndividual) => {
            metrics.map((metric) => {
                // Distance not average but calculated for each metric id (differs from novely search).
                let distance = compareArray(newIndividual[metric.id], existingIndividual[metric.id]);
                let currentDistance = newIndividual[metric.id + 'Rank'];
                if (currentDistance === null) {
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
    let popLength = newPopulation.length;
    metrics.map((metric) => {
        newPopulation.sort((a, b) => {
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
        _.forOwn(newPopulation[individual], (rank, key) => {
            if (key.indexOf('Rank') > -1) {
                newPopulation[individual].novelty += rank
            }
        })
    }
    // Sort from best novelty to worst rank.
    newPopulation.sort((a, b) => {
        return a.novelty - b.novelty;
    });
    // Normalise novelty value.
    var bestRank = metrics.length * popLength;
    for (var individual = 0; individual < popLength; individual++) {
        newPopulation[individual].novelty = newPopulation[individual].novelty / bestRank;
    }
}

export const mutateConfig = (neuralNetwork, networkInputs, oldConfig, novelty, cb) => {
    var configuration = clone(oldConfig);
    _.forEach(configuration.inputNodes, (node, index) => {
        _.forOwn(node, (param, key) => {
            if (key == 'w') {
                _.forEach(param, (w, index) => {
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
    })
    _.forEach(configuration.hiddenNodes, (node) => {
        _.forOwn(node, (param, key) => {
            if (key == 'w') {
                _.forEach(param, (w, index) => {
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
    })
    getCTRNNOutputs(neuralNetwork, networkInputs, configuration, (err, processedConfig) => {
        cb(err, processedConfig)
    })
}

export const generateConfig = (neuralNetwork, networkInputs, numINodes, numNodes, numONodes, cb) => {
    var configuration = new ctrnnConfiguration(numINodes, numNodes, numONodes);
    getCTRNNOutputs(neuralNetwork, networkInputs, configuration, (err, processedConfig) => {
        cb(err, processedConfig)
    })
}

const getCTRNNOutputs = (neuralNetwork, networkInputs, configuration, cb) => {
    neuralNetwork.setConfiguration(configuration);
    // Initialise netowrk with new configuration.
    neuralNetwork.initialise(0.01);
    // Itterate through inputs and transpose.
    async.eachOfSeries(networkInputs, (iteration, iterationIndex, iterationDone) => {
        let iterationOutputs = [];
        let transposedIteration = transpose(iteration);
        _.forEach(transposedIteration, (inputs) => {
            iterationOutputs.push(CTRNNUtil.renderIteration(neuralNetwork, inputs));
        });
        let transposedOutputs = transpose(iterationOutputs);
        // For each itteration. Has to be divided by power of two.
        var windowSize = transposedOutputs[0].length / 2;
        async.eachOfSeries(transposedOutputs, (output, outputIndex, outputDone) => {
            // let fft = dsp.getFFTBins(output, windowSize)
            dsp.getParallelFFTBins(output, windowSize, (err, fft) => {
                if(err){
                    return outputDone(err)
                }
                var mfcc = dsp.getMFCC(fft.avg, 10, 1, 5);
                configuration['iteration-' + iterationIndex + '-output-' + outputIndex + '-mfcc'] = mfcc;
                var freq = dsp.getMaxFrequency(fft.avg, 44100);
                if(isNaN(freq)){
                    freq = 0
                }
                configuration['iteration-' + iterationIndex + '-output-' + outputIndex + '-freq'] = [freq];
                var centroid = dsp.getSpectralCentroid(fft.avg, 44100);
                if(isNaN(centroid)){
                    centroid = 0
                }
                configuration['iteration-' + iterationIndex + '-output-' + outputIndex + '-centroid'] = [centroid];
                var spectralSpread = dsp.getSpectralSpread(fft.avg, centroid);
                if(isNaN(spectralSpread)){
                    spectralSpread = 0
                }
                configuration['iteration-' + iterationIndex + '-output-' + outputIndex + '-spread'] = [spectralSpread];
                var outputVariance = dsp.calculateOutputVariance(fft.spectrum)
                configuration['iteration-' + iterationIndex + '-output-' + outputIndex + '-variance'] = outputVariance
                console.log(freq, centroid, spectralSpread, outputVariance)
                outputDone()
            });
        }, (err) => {
            iterationDone(err)
        })
    }, (err) => {
        cb(err, configuration)
    })
}

export const writeCTRNNOutputs = (neuralNetwork, networkInputs, configuration, cb) => {
    neuralNetwork.setConfiguration(configuration);
    // Initialise netowrk with new configuration.
    neuralNetwork.initialise(0.01);
    // Itterate through inputs and transpose.
    async.eachOfSeries(networkInputs, (iteration, iterationIndex, iterationDone) => {
        let iterationOutputs = [];
        let transposedIteration = transpose(iteration);
        _.forEach(transposedIteration, (inputs) => {
            iterationOutputs.push(CTRNNUtil.renderIteration(neuralNetwork, inputs));
        });
        let transposedOutputs = transpose(iterationOutputs);
        const smapleData = {
            sampleRate: 44100,
            channelData: [
                new Float32Array(transposedOutputs[0]),
                new Float32Array(transposedOutputs[1])
            ]
        };
        WavEncoder.encode(smapleData).then((buffer) => {
            fs.writeFile(__dirname + '/wav/config-' + configuration.tag + '-iteration-' + iterationIndex + '.wav', new Buffer(buffer), (err) => {
                if(err){
                    console.log(err)
                }
                console.log(transposedOutputs.length)
                iterationDone(err)
            });
        });

    }, (err) => {
        cb(err, configuration)
    })
}

export const expandMIDIInputs = (midiInputs, multiplier) => {
    var newStruct = []
    _.forEach(midiInputs, (iteration, iterationIndex) => {
        newStruct.push([])
        _.forEach(iteration, (inputs, inputItteration) => {
            newStruct[iterationIndex].push([])
            _.forEach(inputs, input => {
                for(var i = 0; i < multiplier; i++){
                    newStruct[iterationIndex][inputItteration].push(input)
                }
            })
        })
    })
    return newStruct;
}

const compareArray = (arrayOne, arrayTwo) => {
    let dtw = new DTW();
    let cost = dtw.compute(arrayOne, arrayTwo);
    return cost;
}