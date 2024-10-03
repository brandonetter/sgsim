import { RTSEconomySimulation } from './sim.js';


const possibleCommandsStandard =[
    'overcharge',
    'assignWorkerToTherium',
    // 'removeWorkerFromTherium',
    'buildWorker',
    // 'buildLancer',
    'buildHedgehog',
    // 'buildExo'
];
const possibleCommandsBuildings =[
    'buildBarracks',
    'buildHabitat',
    'buildMechBay' ,
    // 'buildBiokineticsLab'
];

// add 1,2,3,4 to the end of each building commdand
const buildingCommands = possibleCommandsBuildings.map(command => {
    return [command + 1, command + 2, command + 3, command + 4];
});

const possibleCommands = [...possibleCommandsStandard, ...buildingCommands.flat()];
console.log(possibleCommands);

/**
 * TODO: add meteors
 *
 */
class GeneticAlgorithm {
    constructor(populationSize, mutationRate, crossoverRate, elitismCount, maxChromosomeLength,goal) {
        this.populationSize = populationSize;
        this.mutationRate = mutationRate;
        this.crossoverRate = crossoverRate;
        this.elitismCount = elitismCount;
        this.maxChromosomeLength = maxChromosomeLength;
        this.goal = goal;
    }

    analyzeGoal(goal, initialState = { workers: 8, lancers: 0, exos: 0 }) {
        const requiredCommands = [];

        if (goal.workers > initialState.workers) {
            const workersToBuild = goal.workers - initialState.workers;
            for (let i = 0; i < workersToBuild; i++) {
                requiredCommands.push('buildWorker');
            }
        }

        if (goal.lancers > initialState.lancers) {
            for (let i = 0; i < goal.lancers; i++) {
                requiredCommands.push('buildLancer');
            }
        }

        if (goal.exos > initialState.exos) {

            for (let i = 0; i < goal.exos; i++) {
                requiredCommands.push('buildExo');
            }
        }

        return requiredCommands;
    }
    // not actually functional or used
    // todo
    optimizeBuildOrder(chromosome, goal, maxTime) {
        console.log("optimizeBuildOrder");
        let optimizedChromosome = [...chromosome];
        let time = 0;

        while (optimizedChromosome.length > 0) {
            const testChromosome = optimizedChromosome.slice(0, -1);
            const sim = new RTSEconomySimulation({}, goal);
            sim.run(maxTime, testChromosome);
            const result = sim.getState();

            if (this.goalReached(result, goal)) {
                time = result.goalReachedTime;
                optimizedChromosome = testChromosome;
            } else {
                break;
            }
        }

        return {optimizedChromosome, time};
    }
    goalReached(state, goal) {
        return Object.entries(goal).every(([key, value]) => state[key] >= value);
    }

    generateRandomChromosome(maxTime) {
        const requiredCommands = this.analyzeGoal(this.goal);

        // add random times to required commands
        for (let i = 0; i < requiredCommands.length; i++) {
            requiredCommands[i] = {
                type: requiredCommands[i],
                time: Math.floor(Math.random() * maxTime)
            };
        }

        const length = Math.floor(Math.random() * this.maxChromosomeLength) + 1 + requiredCommands.length;
        const commands = [...requiredCommands]


        for (let i = 0; i < length; i++) {
          const commandType = possibleCommands[Math.floor(Math.random() * possibleCommands.length)];
          commands.push({
            type: commandType,
            time: Math.floor(Math.random() * maxTime)
          });
        }

        return commands.sort((a, b) => a.time - b.time);
      }

    calculateFitness(state, maxTime) {
        if (!state.goalReached) {
          return 1 / (maxTime + 1); // Penalize solutions that don't reach the goal
        }

        const timeFitness = 1 / (state.goalReachedTime + 1);
        const efficiencyFitness = 1 / (state.successfulActions.length + 1);

        return timeFitness;
      }

    selection(population, fitnessScores) {
        const totalFitness = fitnessScores.reduce((sum, fitness) => sum + fitness, 0);
        const selectionProbabilities = fitnessScores.map(fitness => fitness / totalFitness);

        const selected = [];
        for (let i = 0; i < this.populationSize; i++) {
            let r = Math.random();
            let index = 0;
            while (r > 0 && index < selectionProbabilities.length) {
                r -= selectionProbabilities[index];
                index++;
            }
            selected.push(population[index - 1]);
        }
        return selected;
    }

    crossover(parent1, parent2) {
        if (Math.random() < this.crossoverRate) {
            const crossoverPoint = Math.floor(Math.random() * Math.min(parent1.length, parent2.length));
            const child1 = [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
            const child2 = [...parent2.slice(0, crossoverPoint), ...parent1.slice(crossoverPoint)];
            return [child1, child2];
        }
        return [parent1, parent2];
    }

    mutate(chromosome, maxTime) {
        return chromosome.map(gene => {
            if (Math.random() < this.mutationRate) {
                const commandTypes = [...possibleCommands];
                return {
                    type: commandTypes[Math.floor(Math.random() * commandTypes.length)],
                    time: Math.floor(Math.random() * maxTime)
                };
            }
            return gene;
        }).sort((a, b) => a.time - b.time);
    }

    evolvePopulation(population, fitnessScores, maxTime) {
        const sortedPopulation = population
            .map((chromosome, index) => ({ chromosome, fitness: fitnessScores[index] }))
            .sort((a, b) => b.fitness - a.fitness);

        const newPopulation = sortedPopulation.slice(0, this.elitismCount).map(individual => individual.chromosome);

        while (newPopulation.length < this.populationSize) {
            const parent1 = this.selection(population, fitnessScores)[0];
            const parent2 = this.selection(population, fitnessScores)[0];
            const [child1, child2] = this.crossover(parent1, parent2);
            newPopulation.push(this.mutate(child1, maxTime));
            if (newPopulation.length < this.populationSize) {
                newPopulation.push(this.mutate(child2, maxTime));
            }
        }

        return newPopulation;
    }

    run(generations, initialMaxTime) {
        let maxTime = initialMaxTime;
        let bestChromosome = null;
        let bestFitness = -Infinity;
        let bestState = null;
        let bestSuccessfulActions = null;

        for (let gen = 0; gen < generations; gen++) {
          let population = Array(this.populationSize).fill().map(() => this.generateRandomChromosome(maxTime));

          const fitnessScores = population.map(chromosome => {
            const sim = new RTSEconomySimulation({}, this.goal);
            sim.run(maxTime, chromosome);
            const result = sim.getState();
            const fitness = this.calculateFitness(result, maxTime);

            return { fitness, state: result, chromosome };
          });

          const maxFitness = Math.max(...fitnessScores.map(f => f.fitness));
          const avgFitness = fitnessScores.reduce((sum, f) => sum + f.fitness, 0) / this.populationSize;

          console.log(`Generation ${gen + 1}: Max Fitness = ${maxFitness}, Avg Fitness = ${avgFitness.toFixed(2)}, Max Time = ${maxTime}`);

          const bestSolution = fitnessScores.reduce((best, current) => (current.fitness > best.fitness ? current : best));

          if (bestSolution.fitness > bestFitness) {
            bestFitness = bestSolution.fitness;
            bestChromosome = bestSolution.chromosome;
            bestState = bestSolution.state;
            bestSuccessfulActions = bestState.successfulActions;

            if (bestState.goalReached) {
              maxTime = Math.ceil(bestState.goalReachedTime ); // Set max time to slightly above the best time
            }
          }

          population = this.evolvePopulation(fitnessScores.map(f => f.chromosome), fitnessScores.map(f => f.fitness), maxTime);
        }

        // Optimize the build order
        const newC = this.optimizeBuildOrder(bestSuccessfulActions, this.goal, maxTime);

        console.log("Optimized Build Order:", newC);

        return {
          bestChromosome,
          bestFitness,
          bestState,
          finalMaxTime: maxTime
        };
      }
}

// Example usage
const goal = {
    workers:8,
    lancers: 0,
    hedgehogs: 2,
    exos:0,
};
const ga = new GeneticAlgorithm(
    8, // Population size
    0.18, // Mutation rate
    0.4, // Crossover rate
    1, // Elitism count
   80, // Max chromosome length,
    goal
);

const initialMaxTime = 700; // seconds

const { bestChromosome, bestFitness, bestState, finalMaxTime } = ga.run(4200, initialMaxTime, goal);

console.log("Best Build Order:", bestChromosome);
console.log("Best Fitness:", bestFitness);
// convert time in bestState.successfulActions to time in minutes:seconds, 00:00 format
for (let i = 0; i < bestState.successfulActions.length; i++) {
    let time = bestState.successfulActions[i].time;
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);
    bestState.successfulActions[i].time = minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
}
console.log("Best State:", bestState);
console.log("Final Max Time:", finalMaxTime);
