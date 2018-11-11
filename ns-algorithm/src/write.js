'use strict';

import async from 'async';
import _ from 'lodash';
import { MongoClient } from 'mongodb';
const url = 'mongodb://plecto:p1ect0@galaga.3.mongolayer.com:10099,galaga.2.mongolayer.com:10095/plecto?replicaSet=set-56bd713fa7bdd444e4001400';

import ctrnn from './imports/ctrnn/ctrnn.js';
import * as EAUtils from './imports/utils/EAUtils.js';
import DSP from './imports/utils/dsp.js';
const dsp = new DSP

MongoClient.connect(url, function (err, db) {
    if (err) {
        console.log(err)
    } else {
        console.log('Connected correctly to server');
    }


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
    let iNodes = 2;
    let numberInputInterations = 4;
    let networkInputs = []
    for (let interationNumber = 0; interationNumber < numberInputInterations; interationNumber++) {
        let iteration = []
        for (let inputNum = 0; inputNum < iNodes; inputNum++) {
            var inputOscillator = new dsp.Oscillator(inputs[interationNumber].type, inputs[interationNumber].freq[inputNum], 0.5, 524288, 44100)
            let iterationInput = inputOscillator.generate()
            iteration.push(iterationInput)
        }
        networkInputs.push(iteration)
    }
    var eaDB = db.collection('ns-configs');
    eaDB.find({}).toArray((err, existingIndividuals) => {
        if(err){
            console.log(err);
            process.exit();
        }
        let neuralNetwork = new ctrnn;
        async.eachOfSeries(existingIndividuals, (configuration, index, configurationSaved) => {
            configuration.tag = index
            EAUtils.writeCTRNNOutputs(neuralNetwork, networkInputs, configuration, () => {
                configurationSaved()
            })
        }, (err) => {
            console.log(err);
            process.exit();
        });
    });
});
