class Resource {
  constructor(name, amount = 0) {
    this.name = name;
    this.amount = amount;
  }
}
class TheriumNode {
  constructor() {
    this.assignedWorkers = 0;
  }

  // Todo: more complex therium if needed

  canAssignWorker() {
    return true;
  }

  assignWorker() {
    if (this.canAssignWorker()) {
      this.assignedWorkers++;
      return true;
    }
    return false;
  }

  removeWorker() {
    if (this.assignedWorkers > 0) {
      this.assignedWorkers--;
    }
  }

  getCurrentMiningTime() {
    return 11.1; // Fixed mining time for therium
  }
}
class GoldNode {
  constructor(baseTime, isCloseNode) {
    this.baseTime = baseTime;
    this.isCloseNode = isCloseNode;
    this.assignedWorkers = 0;
  }

  canAssignWorker() {
    return this.assignedWorkers < 4;
  }

  assignWorker() {
    if (this.canAssignWorker()) {
      this.assignedWorkers++;
      return true;
    }
    return false;
  }

  removeWorker() {
    if (this.assignedWorkers > 0) {
      this.assignedWorkers--;
    }
  }

  getCurrentMiningTime() {
    if (this.isCloseNode) {
      switch (this.assignedWorkers) {
        case 1:
        case 2:
          return 3.94;
        case 3:
          return 4.55;
        default:
          return this.baseTime;
      }
    } else {
      switch (this.assignedWorkers) {
        case 1:
        case 2:
          return 5.54;
        case 3:
          return 5.12;
        default:
          return this.baseTime;
      }
    }
  }
}

class Building {
  constructor(
    type,
    constructionTime = 0,
    constructed = false,
    supplyProvided = 0
  ) {
    this.type = type;
    this.queue = [];
    this.constructionTime = constructionTime;
    this.constructed = constructed;
    this.supplyProvided = supplyProvided;
    this.assignedWorkers = 0;
    this.constructionProgress = 0;
  }

  assignWorker() {
    if (this.assignedWorkers < 4) {
      this.assignedWorkers++;
      return true;
    }
    return false;
  }

  removeWorker() {
    if (this.assignedWorkers > 0) {
      this.assignedWorkers--;
    }
  }

  getConstructionSpeed() {
    // Calculate the total speed increase
    const totalSpeed = 1 + (this.assignedWorkers - 1) * 0.5;
    // Return the fraction of speed for each worker
    return totalSpeed / this.assignedWorkers;
  }
}

class Unit {
  constructor(type, unitTypeInfo, delay = 0) {
    this.type = type;
    this.buildTime = unitTypeInfo.buildTime;
    this.cost = unitTypeInfo.cost;
    this.supplyCost = unitTypeInfo.supplyCost;
    this.busy = false;
    this.miningProgress = 0;
    this.assignedNode = null;
    this.initialDelay = delay;
    this.constructingBuilding = null;
    this.overcharged = false;
    this.overchargeTimeLeft = 0;
    this.assignedTheriumNode = null;
  }

  assignToTheriumNode(node) {
    if (node.assignWorker()) {
      this.assignedTheriumNode = node;
      return true;
    }
    return false;
  }

  unassignFromTheriumNode() {
    if (this.assignedTheriumNode) {
      this.assignedTheriumNode.removeWorker();
      this.assignedTheriumNode = null;
    }
  }

  mineTherium(resource, deltaTime) {
    if (this.initialDelay > 0) {
      this.initialDelay -= deltaTime;
      return;
    }
    if (!this.busy && this.assignedTheriumNode) {
      this.miningProgress += deltaTime;
      const miningCycleTime = this.assignedTheriumNode.getCurrentMiningTime();
      const theriumPerCycle = 5;

      if (this.miningProgress >= miningCycleTime) {
        const cyclesCompleted = Math.floor(
          this.miningProgress / miningCycleTime
        );
        resource.amount += cyclesCompleted * theriumPerCycle;
        this.miningProgress %= miningCycleTime;
      }
    }
  }

  assignToNode(node) {
    if (node.assignWorker()) {
      this.assignedNode = node;
      return true;
    }
    return false;
  }

  unassignFromNode() {
    if (this.assignedNode) {
      this.assignedNode.removeWorker();
      this.assignedNode = null;
    }
  }

  mine(resource, deltaTime) {
    if (this.initialDelay > 0) {
      this.initialDelay -= deltaTime;
      return;
    }
    if (!this.busy && this.assignedNode) {
      this.miningProgress += deltaTime;
      const miningCycleTime = this.assignedNode.getCurrentMiningTime();
      const goldPerCycle = 4;

      if (this.miningProgress >= miningCycleTime) {
        const cyclesCompleted = Math.floor(
          this.miningProgress / miningCycleTime
        );
        resource.amount += cyclesCompleted * goldPerCycle;
        this.miningProgress %= miningCycleTime;
      }
    }
  }

  assignToBuilding(building) {
    if (building.assignWorker()) {
      this.constructingBuilding = building;
      this.busy = true;
      return true;
    }
    return false;
  }

  unassignFromBuilding() {
    if (this.constructingBuilding) {
      this.constructingBuilding.removeWorker();
      this.constructingBuilding = null;
      this.busy = false;
    }
  }

  construct(deltaTime) {
    if (this.constructingBuilding && !this.constructingBuilding.constructed) {
      const constructionSpeed =
        this.constructingBuilding.getConstructionSpeed() *
        (this.overcharged ? 1.5 : 1);
      this.constructingBuilding.constructionProgress +=
        deltaTime * constructionSpeed;

      if (
        this.constructingBuilding.constructionProgress >=
        this.constructingBuilding.constructionTime
      ) {
        const completedBuilding = this.constructingBuilding;
        this.unassignFromBuilding();
        return completedBuilding;
      }
    }
    return null;
  }

  updateOvercharge(deltaTime) {
    if (this.overcharged) {
      this.overchargeTimeLeft -= deltaTime;
      if (this.overchargeTimeLeft <= 0) {
        this.overcharged = false;
        this.overchargeTimeLeft = 0;
      }
    }
  }
}

export class RTSEconomySimulation {
  constructor(initialState = {}, goal = false) {
    this.resources = {
      gold: new Resource('Gold', initialState.gold || 150),
      supply: new Resource('Supply', 15),
      therium: new Resource('Therium', initialState.therium || 0),
      orbitalEnergy: new Resource('OrbitalEnergy', 25),
    };

    this.goal = goal;
    this.goalReached = false;
    this.goalReachedTime = null;

    this.currentSupply = 9;
    this.units = [];
    this.buildings = [];
    this.goldNodes = [];
    this.theriumNodes = [];
    this.elapsedTime = 0;
    this.speedMultiplier = 1;
    this.successfulActions = [];
    this.lastOrbitalEnergyUpdate = 0;

    this.resourceSnapshots = [];
    this.completionTimestamps = {
      workers: [],
      buildings: [],
      units: [],
    };
    this.lastSnapshotTime = 0;

    // Initialize therium nodes
    this.theriumNodes.push(new TheriumNode());

    // Initialize gold nodes
    for (let i = 0; i < 2; i++) {
      this.goldNodes.push(new GoldNode(3.94, true)); // Close nodes
    }
    for (let i = 0; i < 2; i++) {
      this.goldNodes.push(new GoldNode(5.54, false)); // Far nodes
    }

    this.unitTypes = {
      worker: {
        buildTime: 17,
        cost: { type: 'gold', amount: 50 },
        supplyCost: 1,
      },
      lancer: {
        buildTime: 24,
        cost: { type: 'gold', amount: 100 },
        supplyCost: 2,
      },
      scout: {
        buildTime: 18,
        cost: { type: 'gold', amount: 50 },
        supplyCost: 1,
      },
      exo: {
        buildTime: 30,
        cost: {
          gold: 100,
          therium: 25
        },
        supplyCost: 3,
        requirements: {
          buildings: [{ type: 'biokineticsLab', count: 1 }]
        }
      },
    };

    this.buildingTypes = {
      townCenter: { unitProduction: ['worker'], constructionTime: 0, cost: 0 },
      barracks: { unitProduction: ['lancer','exo'], constructionTime: 40, cost: 150 },
      habitat: {
        unitProduction: [],
        constructionTime: 20,
        cost: 100,
        supplyProvided: 15,
      },
      biokineticsLab: {
        unitProduction: [],
        constructionTime: 50,
        cost: 100,
        requirements: {
          buildings: [{ type: 'barracks', count: 1 }],
        },
      },
    };

    // Initialize with 8 workers
    for (let i = 0; i < 8; i++) {
      let worker = new Unit('worker', this.unitTypes.worker, i < 4 ? 0 : 1);
      this.assignWorkerToNode(worker);
      this.units.push(worker);
    }
    // initialize scout
    this.units.push(
      new Unit('scout', {
        buildTime: 18,
        cost: { type: 'gold', amount: 50 },
        supplyCost: 1,
      })
    );

    this.addBuilding('townCenter');
  }


  checkGoalReached() {
    if (this.goalReached) return true;

    const currentState = {
      workers: this.units.filter(u => u.type === 'worker').length,
      lancers: this.units.filter(u => u.type === 'lancer').length,
      exos: this.units.filter(u => u.type === 'exo').length,
      barracks: this.buildings.filter(b => b.type === 'barracks' && b.constructed).length,
      habitats: this.buildings.filter(b => b.type === 'habitat' && b.constructed).length,
      biokineticsLabs: this.buildings.filter(b => b.type === 'biokineticsLab' && b.constructed).length
    };

    const goalReached = Object.entries(this.goal).every(([key, value]) => currentState[key] >= value);

    if (goalReached && !this.goalReached) {
      this.goalReached = true;
      this.goalReachedTime = this.elapsedTime;
    }

    return goalReached;
  }

  checkUnitRequirements(unitInfo) {
    if (!unitInfo.requirements) return true;

    if (unitInfo.requirements.buildings) {
      for (const req of unitInfo.requirements.buildings) {
        const count = this.buildings.filter(b => b.type === req.type && b.constructed).length;
        if (count < req.count) return false;
      }
    }
    return true;
  }

  checkBuildingRequirements(buildingInfo) {
    if (!buildingInfo.requirements) return true;

    if (buildingInfo.requirements.buildings) {
      for (const req of buildingInfo.requirements.buildings) {
        const count = this.buildings.filter(
          (b) => b.type === req.type && b.constructed
        ).length;
        if (count < req.count) return false;
      }
    }
    return true;
  }
  addBuilding(buildingType, constructed = true) {
    const buildingInfo = this.buildingTypes[buildingType];
    this.buildings.push(
      new Building(
        buildingType,
        buildingInfo.constructionTime,
        constructed,
        buildingInfo.supplyProvided || 0
      )
    );
  }

  startBuildingConstruction(buildingType, workerCount) {
    const buildingInfo = this.buildingTypes[buildingType];
    if (!buildingInfo) return false;

    // Check building requirements
    if (!this.checkBuildingRequirements(buildingInfo)) return false;

    if (this.resources.gold.amount >= buildingInfo.cost) {
      const availableWorkers = this.units.filter(
        (unit) => unit.type === 'worker' && !unit.busy && !unit.assignedTheriumNode
      );

      if (availableWorkers.length >= workerCount) {
        this.resources.gold.amount -= buildingInfo.cost;
        const newBuilding = new Building(
          buildingType,
          buildingInfo.constructionTime,
          false,
          buildingInfo.supplyProvided || 0
        );
        this.buildings.push(newBuilding);

        for (let i = 0; i < workerCount; i++) {
          availableWorkers[i].assignToBuilding(newBuilding);
        }

        return true;
      }
    }
    return false;
  }

  startUnitProduction(unitType, buildingType) {
    const building = this.buildings.find(
      (b) =>
        b.type === buildingType &&
        b.constructed &&
        this.buildingTypes[b.type].unitProduction.includes(unitType)
    );
    if (building) {
      const unitTypeInfo = this.unitTypes[unitType];

      if (!this.checkUnitRequirements(unitTypeInfo)) return false;

      if (typeof unitTypeInfo.cost === 'object' && unitTypeInfo.cost.gold) {
        if (this.resources.gold.amount < unitTypeInfo.cost.gold) return false;
      } else if (typeof unitTypeInfo.cost === 'object' && unitTypeInfo.cost.type === 'gold') {
        if (this.resources.gold.amount < unitTypeInfo.cost.amount) return false;
      }

      if (unitTypeInfo.cost.therium && this.resources.therium.amount < unitTypeInfo.cost.therium) return false;

      if (!this.hasAvailableSupply(unitTypeInfo.supplyCost)) return false;

      if (typeof unitTypeInfo.cost === 'object' && unitTypeInfo.cost.gold) {
        this.resources.gold.amount -= unitTypeInfo.cost.gold;
      } else if (typeof unitTypeInfo.cost === 'object' && unitTypeInfo.cost.type === 'gold') {
        this.resources.gold.amount -= unitTypeInfo.cost.amount;
      }

      if (unitTypeInfo.cost.therium) {
        this.resources.therium.amount -= unitTypeInfo.cost.therium;
      }

      building.queue.push({ unitType, progress: 0 });
      return true;
    }
    return false;
  }

  assignWorkerToNode(worker) {
    const sortedNodes = this.goldNodes.sort(
      (a, b) => a.assignedWorkers - b.assignedWorkers
    );
    for (let node of sortedNodes) {
      if (worker.assignToNode(node)) {
        return true;
      }
    }
    return false;
  }

  removeWorkerFromTherium() {
    const worker = this.units.find(
      (unit) => unit.type === 'worker' && unit.assignedTheriumNode
    );
    if (worker) {
      worker.unassignFromTheriumNode();
      // assign to gold node
      const goldNode = this.goldNodes.find((node) => node.assignedWorkers < 4);
      if(!goldNode) return false;
      if (goldNode.assignWorker()) {
        worker.assignToNode(goldNode);
        return true;
      }
      return true;
    }

    return false;
  }

  assignWorkerToTherium() {
    // remove worker from gold node
    const worker = this.units.find(
      (unit) => unit.type === 'worker' && !unit.busy && !unit.assignedTheriumNode && !unit.constructingBuilding
    );
    if (worker) {
      worker.unassignFromNode();
    }else{
      return false;
    }
    // assign worker to therium node
    const theriumNode = this.theriumNodes[0];
    if (theriumNode.assignWorker()) {
      worker.assignToTheriumNode(theriumNode);
      return true;
    }
  }

  executeCommand(command) {
    let success = false;

    const action = command.type;
    switch (action) {
      case 'buildBarracks1':
        success = this.startBuildingConstruction('barracks', 1);
        break;
      case 'buildBarracks2':
        success = this.startBuildingConstruction('barracks', 2);
        break;
      case 'buildBarracks3':
        success = this.startBuildingConstruction('barracks', 3);
        break;
      case 'buildBarracks4':
        success = this.startBuildingConstruction('barracks', 4);
        break;
      case 'buildHabitat1':
        success = this.startBuildingConstruction('habitat', 1);
        break;
      case 'buildHabitat2':
        success = this.startBuildingConstruction('habitat', 2);
        break;
      case 'buildHabitat3':
        success = this.startBuildingConstruction('habitat', 3);
        break;
      case 'buildHabitat4':
        success = this.startBuildingConstruction('habitat', 4);
        break;

      case 'buildBiokineticsLab1':
        success = this.startBuildingConstruction('biokineticsLab', 1);
        break;
      case 'buildBiokineticsLab2':
        success = this.startBuildingConstruction('biokineticsLab', 2);
        break;
      case 'buildBiokineticsLab3':
        success = this.startBuildingConstruction('biokineticsLab', 3);
        break;
      case 'buildBiokineticsLab4':
        success = this.startBuildingConstruction('biokineticsLab', 4);
        break;
      case 'buildWorker':
        success = this.startUnitProduction('worker', 'townCenter');
        break;
      case 'buildLancer':
        success = this.startUnitProduction('lancer', 'barracks');
        break;
      case 'buildExo':
        success = this.startUnitProduction('exo', 'barracks');
        break;
      case 'overcharge':
        success = this.activateOvercharge();
        break;
      case 'assignWorkerToTherium':
        success = this.assignWorkerToTherium();
        break;
      case 'removeWorkerFromTherium':
        success = this.removeWorkerFromTherium();
        break;
    }
    if (success) {
      this.successfulActions.push({ ...command, time: this.elapsedTime });
    }
  }

  activateOvercharge() {
    if (this.resources.orbitalEnergy.amount >= 25) {
      this.resources.orbitalEnergy.amount -= 25;
      this.units.forEach((unit) => {
        if (unit.type === 'worker') {
          unit.overcharged = true;
          unit.overchargeTimeLeft = 45;
        }
      });
      return true;
    }
    return false;
  }

  updateOrbitalEnergy(deltaTime) {
    this.lastOrbitalEnergyUpdate += deltaTime;
    while (this.lastOrbitalEnergyUpdate >= 4) {
      this.resources.orbitalEnergy.amount += 1;
      this.lastOrbitalEnergyUpdate -= 4;
    }
  }

  calculateCurrentSupply() {
    return (
      this.units.reduce((total, unit) => total + unit.supplyCost, 0) +
      this.buildings.reduce(
        (total, building) =>
          total +
          building.queue.reduce(
            (queueTotal, queueItem) =>
              queueTotal + this.unitTypes[queueItem.unitType].supplyCost,
            0
          ),
        0
      )
    );
  }

  hasAvailableSupply(supplyCost) {
    return (
      this.calculateCurrentSupply() + supplyCost <= this.resources.supply.amount
    );
  }

  update(deltaTime) {
    this.elapsedTime += deltaTime;
    this.updateOrbitalEnergy(deltaTime);

    if (
      Math.floor(this.elapsedTime / 10) > Math.floor(this.lastSnapshotTime / 10)
    ) {
      this.takeResourceSnapshot();
    }

    // Update buildings under construction and handle unit production
    this.buildings.forEach((building) => {
      if (!building.constructed) {
        const constructingWorkers = this.units.filter(
          (unit) => unit.constructingBuilding === building
        );
        constructingWorkers.forEach((worker) => {
          const completedBuilding = worker.construct(deltaTime);
          if (completedBuilding) {
            completedBuilding.constructed = true;
            if (completedBuilding.type === 'habitat') {
              this.resources.supply.amount += completedBuilding.supplyProvided;
            }
            constructingWorkers.forEach((w) => w.unassignFromBuilding());

            this.completionTimestamps.buildings.push({
              type: completedBuilding.type,
              time: this.elapsedTime,
            });
          }
        });
      } else if (building.queue.length > 0) {
        const currentProduction = building.queue[0];
        currentProduction.progress += deltaTime;
        if (
          currentProduction.progress >=
          this.unitTypes[currentProduction.unitType].buildTime
        ) {
          building.queue.shift();
          const newUnitType = this.unitTypes[currentProduction.unitType];

          // Double-check supply availability before creating the unit
          if (this.hasAvailableSupply(newUnitType.supplyCost)) {
            const newUnit = new Unit(currentProduction.unitType, newUnitType);
            if (newUnit.type === 'worker') {
              if (this.units.filter((u) => u.type === 'worker').length < 16) {
                this.assignWorkerToNode(newUnit);
                this.units.push(newUnit);
              }
            } else {
              this.units.push(newUnit);
            }
          } else {
            console.log(
              `Cannot create ${currentProduction.unitType} due to supply limit`
            );
          }
        }
      }
    });

    // Units perform actions
    this.units.forEach((unit) => {
      unit.updateOvercharge(deltaTime);
      if (unit.type === 'worker' && !unit.constructingBuilding) {
        if (unit.assignedNode) {
          unit.mine(this.resources.gold, deltaTime);
        } else if (unit.assignedTheriumNode) {
          unit.mineTherium(this.resources.therium, deltaTime);
        }
      }
    });
  }

  takeResourceSnapshot() {
    this.resourceSnapshots.push({
      time: this.elapsedTime,
      gold: this.resources.gold.amount,
      supply: `${this.calculateCurrentSupply()}/${
        this.resources.supply.amount
      }`,
      orbitalEnergy: this.resources.orbitalEnergy.amount,
      therium: this.resources.therium.amount,
    });
    this.lastSnapshotTime = this.elapsedTime;
  }

  run(duration, commands = []) {
    let timeElapsed = 0;
    const timeStep = 0.1; // 100ms game time steps

    while (timeElapsed < duration && !this.goalReached) {
      // Execute any commands scheduled for this time
      const currentCommands = commands.filter((cmd) => cmd.time <= timeElapsed);
      currentCommands.forEach((cmd) => this.executeCommand(cmd));
      commands = commands.filter((cmd) => cmd.time > timeElapsed);

      this.update(timeStep);
      if(this.goal)
      this.checkGoalReached();
      timeElapsed += timeStep;
    }
  }

  getState() {
    return {
      elapsedTime: this.elapsedTime,
      gold: this.resources.gold.amount,
      therium: this.resources.therium.amount,
      supply: `${this.calculateCurrentSupply()}/${
        this.resources.supply.amount
      }`,
      orbitalEnergy: this.resources.orbitalEnergy.amount,
      workers: this.units.filter((u) => u.type === 'worker').length,
      scouts: this.units.filter((u) => u.type === 'scout').length,
      lancers: this.units.filter((u) => u.type === 'lancer').length,
      exos: this.units.filter((u) => u.type === 'exo').length,
      barracks: this.buildings.filter(
        (b) => b.type === 'barracks' && b.constructed
      ).length,
      habitats: this.buildings.filter(
        (b) => b.type === 'habitat' && b.constructed
      ).length,
      successfulActions: this.successfulActions,
      goalReached: this.goalReached,
      goalReachedTime: this.goalReachedTime,
      debugInfo: {
        resourceSnapshots: JSON.stringify(this.resourceSnapshots),
        completionTimestamps: JSON.stringify(this.completionTimestamps, 2),
      },
    };
  }
}

// // example usage
const sim = new RTSEconomySimulation();
sim.run(180, [
  { type: 'assignWorkerToTherium', time: 0 },
  { type: 'buildBarracks1', time: 0 },

  // overcharge
  { type: 'overcharge', time: 40 },
  { type: 'buildBiokineticsLab2', time: 41 },
  // buildExo
  { type: 'buildLancer', time: 90 },
  { type: 'buildExo', time: 64 },
]);

console.log(sim.getState());
