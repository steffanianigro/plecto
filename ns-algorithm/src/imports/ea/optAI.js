import ctrnn from '../ctrnn/ctrnn';
import _ from 'lodash';
import async from 'async';

import * as EAUtils from '../utils/EAUtils';
import DSP from '../utils/dsp.js';
const dsp = new DSP

export default class optAINet {

    constructor() {
        this.population = [];
        this.neuralNetwork = new ctrnn;
        this.oldError = {};
        this.metrics = [];
        this.baseMetrics = [];
        this.noveltyThresholds = {};
        this.stagnateThresholds = {};
        this.supressionThresholds = {};
        this.individualsToSave = [];
        this.iteration = 0;
    }

    setPopulation(population) {
        this.population = population;
    }

    setExistingPopulation(population) {
        this.existingPopulation = population;
    }

    setMetrics(metrics, baseMetrics) {
        this.metrics = metrics;
        this.baseMetrics = baseMetrics;
        _.forEach(metrics, (metric) => {
            this.oldError[metric.type] = 0;
        });
    }

    setThresholds(novelty, stagnate, supression) {
        this.stagnateThresholds = stagnate;
        this.supressionThresholds = supression;
        this.noveltyThresholds = novelty;
    }

    evolvePopulation(networkInputs, numberIndividuals, numberClones, iNodes, hNodes, oNodes, numIndividualsToAdd, count, cb) {
        // Ranks the population. Gives a single novelty mesure based on rank.
        EAUtils.rankPopulation(this.population, this.existingPopulation, this.metrics);
        // Gives novelty measures for each metric type. Based on distance between merics.
        EAUtils.calculateMetricNovelty(this.population, this.existingPopulation, this.metrics);
        // Iterate until a number of individuals surpass novelty threshold.
        async.whilst(() => {
            this.iteration ++;
            this.individualsToSave = EAUtils.calculateAndRemoveIndividualsToSave(this.population, this.baseMetrics, this.noveltyThresholds);
            return !this.individualsToSave.length;
        }, (iterationDone) => {
            // Create clone clusters.
            var clonedPopulations = {};
            EAUtils.generateSubPopulations(this.population, numberClones, clonedPopulations);
            // Mutate clones in pop.
            async.eachOfSeries(Object.keys(clonedPopulations), (clonedPopKey, clonedPopIndex, clonePopDone) => {
                async.eachOfSeries(clonedPopulations[clonedPopKey], (clone, cloneIndex, cloneDone) => {
                    EAUtils.mutateConfig(this.neuralNetwork, networkInputs, clone, this.population[clonedPopIndex].novelty, (err, processedConfig) => {
                        clonedPopulations[clonedPopKey][cloneIndex] = processedConfig
                        cloneDone(err)
                    });
                }, (err) => {
                    if(err){
                        return clonePopDone(err)
                    }
                    // Add parent to population to ensure population does not digress evaulation.
                    clonedPopulations[clonedPopKey].push(this.population[clonedPopIndex]);
                    EAUtils.rankPopulation(clonedPopulations[clonedPopKey], this.existingPopulation, this.metrics);
                    clonePopDone()
                })
            }, (err) => {
                if(err){
                    return iterationDone(err)
                }
                // Clear population.
                this.population.splice(0, this.population.length);
                // Push fittest of cloned pops.
                var noClonedPops = Object.keys(clonedPopulations).length;
                for (var clonedPop = 0; clonedPop < noClonedPops; clonedPop++) {
                    this.population.push(clonedPopulations['clonePop' + clonedPop][0]);
                }
                // Calculate metric novelty for population comparison.
                EAUtils.calculateMetricNovelty(this.population, this.existingPopulation, this.metrics);
                // If population stagnates.
                var averageError = EAUtils.calculateAverageNovelty(this.population, this.baseMetrics);
                let stagnateCount = 0;
                let numMetrics = Object.keys(averageError).length;
                _.forOwn(averageError, (error, type) => {
                    let difference = Math.abs(error - this.oldError[type]);
                    averageError[type] = difference;
                    if(difference < this.stagnateThresholds[type]){
                        stagnateCount++;
                    }
                });
                console.log('stagenate', averageError, stagnateCount, numMetrics);
                if (stagnateCount === numMetrics) {
                    this.oldError = averageError;
                    // Rank so that fittest are compared to least fit.
                    EAUtils.rankPopulation(this.population, this.existingPopulation, this.metrics);
                    EAUtils.supressIndividuals(this.population, this.supressionThresholds, this.metrics);
                    EAUtils.addRanCells(this.neuralNetwork, networkInputs, this.population, numIndividualsToAdd, iNodes, hNodes, oNodes, (err) => {
                        if(err){
                            return iterationDone(err)
                        }
                        // Rank whole population.
                        EAUtils.rankPopulation(this.population, this.existingPopulation, this.metrics);
                        EAUtils.calculateMetricNovelty(this.population, this.existingPopulation, this.metrics);
                        EAUtils.logPop(this.population, count);
                        count++;
                        iterationDone()
                    });
                } else {
                    this.oldError = averageError;
                    // Rank whole population.
                    EAUtils.rankPopulation(this.population, this.existingPopulation, this.metrics);
                    EAUtils.calculateMetricNovelty(this.population, this.existingPopulation, this.metrics);
                    EAUtils.logPop(this.population, count);
                    count++;
                    iterationDone()
                }
            })
        }, (err) => {
            if(err) {
                return cb(err)
            }
            let numNewIndividualsToAdd = numberIndividuals - this.population.length;
            console.log("before", numNewIndividualsToAdd, numberIndividuals, this.population.length)
            if(numNewIndividualsToAdd > 0){
                EAUtils.addRanCells(this.neuralNetwork, networkInputs, this.population, numNewIndividualsToAdd, iNodes, hNodes, oNodes, (err) => {
                    console.log("after", numNewIndividualsToAdd, numberIndividuals, this.population.length)
                    cb(err, this.individualsToSave);
                });
            }else {
                cb(err, null);
            }
        });
    }

}
