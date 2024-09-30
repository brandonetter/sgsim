Early WIP of SG sim and GA for Build Orders.

You can run the sim by itself (included at the bottom of sim.js is an example list of commands).

`node sim.js`

Or you can run the GA which will run the sim with a goal (check the bottom of the ga.sim file to see a goal and example)

`node ga.js`

```js
// Example usage
const goal = {
    workers:10,
    lancers: 1,
    exos:0,
};
const ga = new GeneticAlgorithm(
    300, // Population size
    0.15, // Mutation rate
    0.2, // Crossover rate
    4, // Elitism count
    80, // Max chromosome length,
    goal
);

const initialMaxTime = 500; // seconds

const { bestChromosome, bestFitness, bestState, finalMaxTime } = ga.run(400, initialMaxTime, goal);
```
```js
OUTPUT:

Best State: {
  elapsedTime: 53.100000000000485,
  gold: 32,
  therium: 0,
  supply: "13/15",
  orbitalEnergy: 13,
  workers: 10,
  scouts: 1,
  lancers: 1,
  exos: 0,
  barracks: 1,
  habitats: 0,
  successfulActions: [
    {
      type: "buildBarracks1",
      time: "0:01",
    }, {
      type: "overcharge",
      time: "0:02",
    }, {
      type: "buildWorker",
      time: "0:14",
    }, {
      type: "buildLancer",
      time: "0:29",
    }, {
      type: "buildWorker",
      time: "0:36",
    }, {
      type: "buildHabitat1",
      time: "0:51",
    }, {
      type: "assignWorkerToTherium",
      time: "0:53",
    }
  ],
  goalReached: true,
  goalReachedTime: 53.100000000000485,
  debugInfo: {
    resourceSnapshots: "[{\"time\":10.09999999999998,\"gold\":40,\"supply\":\"9/15\",\"orbitalEnergy\":2,\"therium\":0},{\"time\":20.000000000000014,\"gold\":50,\"supply\":\"10/15\",\"orbitalEnergy\":5,\"therium\":0},{\"time\":30.000000000000156,\"gold\":14,\"supply\":\"12/15\",\"orbitalEnergy\":7,\"therium\":0},{\"time\":40.0000000000003,\"gold\":36,\"supply\":\"13/15\",\"orbitalEnergy\":10,\"therium\":0},{\"time\":50.00000000000044,\"gold\":112,\"supply\":\"13/15\",\"orbitalEnergy\":12,\"therium\":0}]",
    completionTimestamps: "{\"workers\":[],\"buildings\":[{\"type\":\"barracks\",\"time\":28.10000000000013}],\"units\":[]}",
  },
}
Final Max Time: 59
```
