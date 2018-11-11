'use strict';

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _mongodb = require('mongodb');

var _ctrnn = require('./imports/ctrnn/ctrnn.js');

var _ctrnn2 = _interopRequireDefault(_ctrnn);

var _optAI = require('./imports/ea/optAI');

var _optAI2 = _interopRequireDefault(_optAI);

var _EAUtils = require('./imports/utils/EAUtils');

var EAUtils = _interopRequireWildcard(_EAUtils);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _dsp = require('./imports/utils/dsp.js');

var _dsp2 = _interopRequireDefault(_dsp);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var url = 'mongodb://plecto:p1ect0@galaga.3.mongolayer.com:10099,galaga.2.mongolayer.com:10095/plecto?replicaSet=set-56bd713fa7bdd444e4001400';

var dsp = new _dsp2.default();

var network = new _ctrnn2.default();

var readFile = function readFile(filepath) {
    return new Promise(function (resolve, reject) {
        _fs2.default.readFile(filepath, function (err, buffer) {
            if (err) {
                reject(err);
            }
            resolve(buffer);
        });
    });
};

var readMidiDir = function readMidiDir(dir) {
    return new Promise(function (resolve, reject) {
        _fs2.default.readdir(dir, function (err, files) {
            if (err) {
                reject(err);
            }
            var iterations = [];
            _async2.default.each(files, function (fileName, fileDone) {
                _fs2.default.readFile(dir + '/' + fileName, 'utf8', function (err, midi) {
                    if (err) {
                        fileDone(err);
                    } else {
                        midi = JSON.parse(midi);
                        _lodash2.default.forEach(midi, function (inputs) {
                            _lodash2.default.forEach(inputs, function (input, index) {
                                inputs[index] = input / 127 * 2 - 1;
                            });
                        });
                        iterations.push(midi);
                        fileDone();
                    }
                });
            }, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(iterations);
                }
            });
        });
    });
};

var readConfigFile = function readConfigFile(filepath) {
    return new Promise(function (resolve, reject) {
        _fs2.default.readFile(filepath, 'utf8', function (err, buffer) {
            if (err) {
                reject(err);
            }
            resolve(JSON.parse(buffer));
        });
    });
};

var writeConfigFile = function writeConfigFile(population) {
    return new Promise(function (resolve, reject) {
        _fs2.default.writeFile('./configs/configs.json', JSON.stringify(population), function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
};

var readMidiFile = function readMidiFile(filepath) {
    return new Promise(function (resolve, reject) {
        _fs2.default.readFile(filepath, 'utf8', function (err, buffer) {
            if (err) {
                reject(err);
            }
            resolve(buffer);
        });
    });
};

var downloadConfigurations = function downloadConfigurations(existingIndividuals) {
    _async2.default.eachOfSeries(existingIndividuals, function (individual, index, callback) {
        _fs2.default.writeFile('./configs/config' + index + '.json', JSON.stringify(individual), function (err) {
            if (err) throw err;
            callback();
        });
    }, function (err) {
        console.log('done');
        process.exit();
    });
};

_mongodb.MongoClient.connect(url, function (err, db) {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected correctly to server');
    }

    var numberToAdd = 100;

    var iNodes = 2;
    var hNodes = 6;
    var oNodes = 2;

    var numIndividuals = 10;
    var numberClones = 5;

    var numIndividualsToAdd = 1;

    var optAI = new _optAI2.default();

    var number = 0;

    var noveltyThresholds = {
        mfcc: 3,
        variance: 5,
        freq: 2,
        centroid: 5
    };
    var supressionThresholds = {
        mfcc: 0.005,
        variance: 0.005,
        freq: 0.005,
        centroid: 0.005
    };
    var stagnateThresholds = {
        mfcc: 0.5,
        variance: 0.5,
        freq: 0.5,
        centroid: 0.5
    };

    var inputs = [{
        type: dsp.types.waveforms.FLAT,
        freq: [0, 1]
    }, {
        type: dsp.types.waveforms.FLAT,
        freq: [0, 0.5]
    }, {
        type: dsp.types.waveforms.FLAT,
        freq: [0.5, 1]
    }, {
        type: dsp.types.waveforms.FLAT,
        freq: [1, 1]
    }];

    // While the exisitingIndividuals are < desired population size, keep itterating.
    _async2.default.whilst(function () {
        number++;
        return number < numberToAdd;
    }, function (individualDone) {
        var expandedMetrics = [];
        var itterationCount = 0;
        var numberInputInterations = 4;
        var networkInputs = [];
        for (var interationNumber = 0; interationNumber < numberInputInterations; interationNumber++) {
            var iteration = [];
            for (var inputNum = 0; inputNum < iNodes; inputNum++) {
                //2097152
                var inputOscillator = new dsp.Oscillator(inputs[interationNumber].type, inputs[interationNumber].freq[inputNum], 0.5, 524288, 44100);
                var iterationInput = inputOscillator.generate();
                iteration.push(iterationInput);
            }
            networkInputs.push(iteration);
        }
        var baseMetrics = ['mfcc', 'variance'];
        _lodash2.default.forEach(baseMetrics, function (metricType) {
            for (var _interationNumber = 0; _interationNumber < numberInputInterations; _interationNumber++) {
                for (var outputNum = 0; outputNum < oNodes; outputNum++) {
                    expandedMetrics.push({
                        type: metricType,
                        id: 'iteration-' + _interationNumber + '-output-' + outputNum + '-' + metricType
                    });
                }
            }
        });
        // Create a random population to start evolving.
        EAUtils.generatePopulation(network, networkInputs, numIndividuals, iNodes, hNodes, oNodes, function (err, randPopulation) {
            if (err) {
                return individualDone(err);
            }
            var eaDB = db.collection('ns-configs');
            eaDB.find({}).toArray(function (err, existingIndividuals) {
                // downloadConfigurations(existingIndividuals);
                if (!existingIndividuals.length) {
                    eaDB.insert(randPopulation[0], function (err, result) {
                        if (err) {
                            individualDone(err);
                        } else {
                            individualDone('Population seeded. Please resart EA.');
                        }
                    });
                } else {
                    // Setup EA.
                    optAI.setThresholds(noveltyThresholds, stagnateThresholds, supressionThresholds);
                    optAI.setMetrics(expandedMetrics, baseMetrics);
                    optAI.setPopulation(randPopulation);
                    optAI.setExistingPopulation(existingIndividuals);
                    // Evolve pop.
                    optAI.evolvePopulation(networkInputs, numberClones, iNodes, hNodes, oNodes, numIndividualsToAdd, itterationCount, function (err, individualsToSave) {
                        if (err) {
                            return individualDone(err);
                        }
                        // Add most novel individual to population.
                        eaDB.insert(individualsToSave, function (err, result) {
                            console.log('saved to db');
                            individualDone(err);
                        });
                    });
                }
            });
        });
    }, function (err) {
        console.log(err);
        process.exit();
    });
});