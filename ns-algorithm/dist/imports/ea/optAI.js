'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ctrnn = require('../ctrnn/ctrnn');

var _ctrnn2 = _interopRequireDefault(_ctrnn);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _EAUtils = require('../utils/EAUtils');

var EAUtils = _interopRequireWildcard(_EAUtils);

var _dsp = require('../utils/dsp.js');

var _dsp2 = _interopRequireDefault(_dsp);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var dsp = new _dsp2.default();

var optAINet = function () {
    function optAINet() {
        _classCallCheck(this, optAINet);

        this.population = [];
        this.neuralNetwork = new _ctrnn2.default();
        this.oldError = {};
        this.metrics = [];
        this.baseMetrics = [];
        this.noveltyThresholds = {};
        this.stagnateThresholds = {};
        this.supressionThresholds = {};
    }

    _createClass(optAINet, [{
        key: 'setPopulation',
        value: function setPopulation(population) {
            this.population = population;
        }
    }, {
        key: 'setExistingPopulation',
        value: function setExistingPopulation(population) {
            this.existingPopulation = population;
        }
    }, {
        key: 'setMetrics',
        value: function setMetrics(metrics, baseMetrics) {
            var _this = this;

            this.metrics = metrics;
            this.baseMetrics = baseMetrics;
            _lodash2.default.forEach(metrics, function (metric) {
                _this.oldError[metric.type] = 0;
            });
        }
    }, {
        key: 'setThresholds',
        value: function setThresholds(novelty, stagnate, supression) {
            this.stagnateThresholds = stagnate;
            this.supressionThresholds = supression;
            this.noveltyThresholds = novelty;
        }
    }, {
        key: 'evolvePopulation',
        value: function evolvePopulation(networkInputs, numberClones, iNodes, hNodes, oNodes, numIndividualsToAdd, count, cb) {
            var _this2 = this;

            // Ranks the population. Gives a single novelty mesure based on rank.
            EAUtils.rankPopulation(this.population, this.existingPopulation, this.metrics);
            // Gives novelty measures for each metric type. Is based on distance between merics.
            EAUtils.calculateMetricNovelty(this.population, this.existingPopulation, this.metrics);
            _async2.default.whilst(function () {
                return !EAUtils.calculateIndividualsToSave(_this2.population, _this2.baseMetrics, _this2.noveltyThresholds).length;
            }, function (iterationDone) {
                // Create clone clusters.
                var clonedPopulations = {};
                EAUtils.generateSubPopulations(_this2.population, numberClones, clonedPopulations);
                // Mutate clones in pop.
                _async2.default.eachOfSeries(Object.keys(clonedPopulations), function (clonedPopKey, clonedPopIndex, clonePopDone) {
                    _async2.default.eachOfSeries(clonedPopulations[clonedPopKey], function (clone, cloneIndex, cloneDone) {
                        EAUtils.mutateConfig(_this2.neuralNetwork, networkInputs, clone, _this2.population[clonedPopIndex].novelty, function (err, processedConfig) {
                            clonedPopulations[clonedPopKey][cloneIndex] = processedConfig;
                            cloneDone(err);
                        });
                    }, function (err) {
                        if (err) {
                            return clonePopDone(err);
                        }
                        // Add parent to population to ensure population does not digress evaulation.
                        clonedPopulations[clonedPopKey].push(_this2.population[clonedPopIndex]);
                        EAUtils.rankPopulation(clonedPopulations[clonedPopKey], _this2.existingPopulation, _this2.metrics);
                        clonePopDone();
                    });
                }, function (err) {
                    if (err) {
                        return iterationDone(err);
                    }
                    // Clear population.
                    _this2.population.splice(0, _this2.population.length);
                    // Push fittest of cloned pops.
                    var noClonedPops = Object.keys(clonedPopulations).length;
                    for (var clonedPop = 0; clonedPop < noClonedPops; clonedPop++) {
                        _this2.population.push(clonedPopulations['clonePop' + clonedPop][0]);
                    }
                    // Calculate metric novelty for population comparison.
                    EAUtils.calculateMetricNovelty(_this2.population, _this2.existingPopulation, _this2.metrics);
                    // If population stagnates.
                    var averageError = EAUtils.calculateAverageNovelty(_this2.population, _this2.baseMetrics);
                    var stagnateCount = 0;
                    var numMetrics = Object.keys(averageError).length;
                    _lodash2.default.forOwn(averageError, function (error, type) {
                        var difference = Math.abs(error - _this2.oldError[type]);
                        averageError[type] = difference;
                        if (difference < _this2.stagnateThresholds[type]) {
                            stagnateCount++;
                        }
                    });
                    console.log('stagenate', averageError, stagnateCount, numMetrics);
                    if (stagnateCount === numMetrics) {
                        _this2.oldError = averageError;
                        // Rank so that fittest are compared to least fit.
                        EAUtils.rankPopulation(_this2.population, _this2.existingPopulation, _this2.metrics);
                        EAUtils.supressIndividuals(_this2.population, _this2.supressionThresholds, _this2.metrics);
                        EAUtils.addRanCells(_this2.neuralNetwork, networkInputs, _this2.population, numIndividualsToAdd, iNodes, hNodes, oNodes, function (err) {
                            if (err) {
                                return iterationDone(err);
                            }
                            // Rank whole population.
                            EAUtils.rankPopulation(_this2.population, _this2.existingPopulation, _this2.metrics);
                            EAUtils.calculateMetricNovelty(_this2.population, _this2.existingPopulation, _this2.metrics);
                            EAUtils.logPop(_this2.population, count);
                            count++;
                            iterationDone();
                        });
                    } else {
                        _this2.oldError = averageError;
                        // Rank whole population.
                        EAUtils.rankPopulation(_this2.population, _this2.existingPopulation, _this2.metrics);
                        EAUtils.calculateMetricNovelty(_this2.population, _this2.existingPopulation, _this2.metrics);
                        EAUtils.logPop(_this2.population, count);
                        count++;
                        iterationDone();
                    }
                });
            }, function (err) {
                cb(err, EAUtils.calculateIndividualsToSave(_this2.population, _this2.baseMetrics, _this2.noveltyThresholds));
            });
        }
    }]);

    return optAINet;
}();

exports.default = optAINet;