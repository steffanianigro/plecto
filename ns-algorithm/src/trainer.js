'use strict';

import async from 'async';
import _ from 'lodash';
import { MongoClient } from 'mongodb';
const url = 'db-url';

import ctrnn from './imports/ctrnn/ctrnn.js';
import optAINet from './imports/ea/optAI';
import * as EAUtils from './imports/utils/EAUtils';
import fs from 'fs';
import DSP from './imports/utils/dsp.js';
const dsp = new DSP

const network = new ctrnn();

const readFile = (filepath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, buffer) => {
            if (err) {
                reject(err);
            }
            resolve(buffer);
        });
    });
};

const readMidiDir = (dir) => {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) {
                reject(err);
            }
            let iterations = [];
            async.each(files, (fileName, fileDone) => {
                fs.readFile(dir + '/' + fileName, 'utf8', (err, midi) => {
                    if (err) {
                        fileDone(err);
                    } else {
                        midi = JSON.parse(midi);
                        _.forEach(midi, (inputs) => {
                            _.forEach(inputs, (input, index) => {
                                inputs[index] = (input / 127) * 2 - 1;
                            });
                        });
                        iterations.push(midi);
                        fileDone();
                    }
                });
            }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(iterations);
                }
            });
        });
    });
};

const readConfigFile = (filepath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, 'utf8', (err, buffer) => {
            if (err) {
                reject(err);
            }
            resolve(JSON.parse(buffer));
        });
    });
};

const writeConfigFile = (population) => {
    return new Promise((resolve, reject) => {
        fs.writeFile('./configs/configs.json', JSON.stringify(population), (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
};

const readMidiFile = (filepath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, 'utf8', (err, buffer) => {
            if (err) {
                reject(err);
            }
            resolve(buffer);
        });
    });
};

const downloadConfigurations = (existingIndividuals) => {
    async.eachOfSeries(existingIndividuals, function (individual, index, callback) {
        fs.writeFile('./configs/config' + index + '.json', JSON.stringify(individual), (err) => {
            if (err) throw err;
            callback();
        });
    }, function (err) {
        console.log('done');
        process.exit();
    });
};

MongoClient.connect(url, function (err, db) {
    if (err) {
        console.log(err)
    } else {
        console.log('Connected correctly to server');
    }

    let numberToAdd = 100;

    let iNodes = 2;
    let hNodes = 6;
    let oNodes = 2;

    let numberIndividuals = 10;
    let numberClones = 5;

    let numberIndividualsToAdd = 1;

    let optAI = new optAINet();

    let number = 0;

    let noveltyThresholds = {
        mfcc: 10,
        variance: 10,
        freq: 2,
        centroid: 5
    };
    let supressionThresholds = {
        mfcc: 0.005,
        variance: 0.005,
        freq: 0.005,
        centroid: 0.005
    };
    let stagnateThresholds ={
        mfcc: 0.5,
        variance: 0.5,
        freq: 0.5,
        centroid: 0.5
    };

    let inputs = [
        {
            type: dsp.types.waveforms.FLAT,
            freq: [-1, 1]
        },
        {
            type: dsp.types.waveforms.FLAT,
            freq: [-0.5, 0.5]
        },
        {
            type: dsp.types.waveforms.FLAT,
            freq: [0, 1]
        },
        {
            type: dsp.types.waveforms.FLAT,
            freq: [-1, 0]
        }
    ]

    // let inputs = [
    //     {
    //         type: dsp.types.waveforms.SINE,
    //         freq: [100, 100]
    //     },
    //     {
    //         type: dsp.types.waveforms.SINE,
    //         freq: [200, 200]
    //     },
    //     {
    //         type: dsp.types.waveforms.SINE,
    //         freq: [400, 400]
    //     },
    //     {
    //         type: dsp.types.waveforms.SINE,
    //         freq: [800, 800]
    //     }
    // ]

    let numberInputInterations = 4;
    let networkInputs = []
    for (let interationNumber = 0; interationNumber < numberInputInterations; interationNumber++) {
        let iteration = []
        for (let inputNum = 0; inputNum < iNodes; inputNum++) {
            //2097152
            var inputGenerator = new dsp.InputGenerator(inputs[interationNumber].freq[inputNum], 524288)
            // var inputOscillator = new dsp.Oscillator(inputs[interationNumber].type, inputs[interationNumber].freq[inputNum], 0.5, 524288, 44100)
            let iterationInput = inputGenerator.generate()
            iteration.push(iterationInput)
        }
        networkInputs.push(iteration)
    }
    let expandedMetrics = [];
    let itterationCount = 0;    
    let baseMetrics = ['mfcc', 'variance'];
    _.forEach(baseMetrics, (metricType) => {
        for (let interationNumber = 0; interationNumber < numberInputInterations; interationNumber++) {
            for (let outputNum = 0; outputNum < oNodes; outputNum++) {
                expandedMetrics.push({
                    type: metricType,
                    id: 'iteration-' + interationNumber + '-output-' + outputNum + '-' + metricType
                });
            }
        }
    });
    // Create a random population to start evolving.
    EAUtils.generatePopulation(network, networkInputs, numberIndividuals, iNodes, hNodes, oNodes, (err, randPopulation) => {
        if(err){
            console.log(err);
            process.exit();
        }
        var eaDB = db.collection('ns-configs-2-sinetanh');
        eaDB.find({}).toArray((err, existingIndividuals) => {
            // downloadConfigurations(existingIndividuals);
            console.log(existingIndividuals.length)
            if (!existingIndividuals.length) {
                randPopulation[0].createdAt = new Date()
                randPopulation[0].iteration = 0
                eaDB.insert(randPopulation[0], (err, result) => {
                    if (err) {
                        console.log(err);
                        process.exit();
                    } else {
                        console.log('Population seeded. Please resart EA.');
                        process.exit();
                    }
                });
            } else {
                // Setup EA.
                optAI.setThresholds(noveltyThresholds, stagnateThresholds, supressionThresholds);
                optAI.setMetrics(expandedMetrics, baseMetrics);
                optAI.setPopulation(randPopulation);
                optAI.setExistingPopulation(existingIndividuals);
                const evolveCallback = (err, individualsToSave) => {
                    if(err){ 
                        console.log(err);
                        return process.exit();
                    }
                    if(individualsToSave){
                        _.forEach(individualsToSave, (individual) => {
                            individual.createdAt = new Date()
                            individual.iteration = optAI.iteration
                        })
                        // Add most novel individual to population.
                        eaDB.insert(individualsToSave, (err, result) => {
                            console.log('saved to db');
                            if(number > numberIndividualsToAdd){
                                console.log("Compelted");
                                return process.exit();
                            }else{
                                optAI.evolvePopulation(networkInputs, numberIndividuals, numberClones, iNodes, hNodes, oNodes, numberIndividualsToAdd, itterationCount, evolveCallback);
                            }
                        });
                    } else {
                        optAI.evolvePopulation(networkInputs, numberIndividuals, numberClones, iNodes, hNodes, oNodes, numberIndividualsToAdd, itterationCount, evolveCallback);
                    }
                }
                // Evolve pop.
                optAI.evolvePopulation(networkInputs, numberIndividuals, numberClones, iNodes, hNodes, oNodes, numberIndividualsToAdd, itterationCount, evolveCallback);
            }
        });
    });
});
