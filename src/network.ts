import * as THREE from "three";

export default class NeuralNetwork {
  levels: Level[];
  constructor(neuronCounts: number[]) {
    this.levels = [];
    for (let i = 0; i < neuronCounts.length - 1; i++) {
      this.levels.push(new Level(neuronCounts[i], neuronCounts[i + 1]));
    }
  }

  static feedForward(givenInputs: number[], network: NeuralNetwork) {
    let outputs = Level.feedForward(givenInputs, network.levels[0]);
    for (let i = 1; i < network.levels.length; i++) {
      outputs = Level.feedForward(outputs, network.levels[i]);
    }
    return outputs;
  }

  static mutate(network: NeuralNetwork, mutationRate: number = 1) {
    network.levels.forEach((level) => {
      level.weights.forEach((weight) => {
        weight.forEach((connection, i) => {
          if (Math.random() < mutationRate) {
            weight[i] = THREE.MathUtils.lerp(
              connection,
              Math.random() * 2 - 1,
              mutationRate
            );
          }
        });
      });
      level.biases.forEach((bias, i) => {
        if (Math.random() < mutationRate) {
          level.biases[i] = THREE.MathUtils.lerp(
            bias,
            Math.random() * 2 - 1,
            mutationRate
          );
        }
      });
    });
  }
}

class Level {
  inputs: number[];
  outputs: number[];
  biases: number[];
  weights: number[][];
  constructor(inputCount: number, outputCount: number) {
    this.inputs = new Array(inputCount);
    this.outputs = new Array(outputCount);
    this.biases = new Array(outputCount);

    this.weights = new Array(inputCount);
    this.weights.fill(new Array(outputCount));

    Level.#randomize(this);
  }

  static #randomize(level: Level) {
    // randomise the weights with values from -1 to 1
    for (let i = 0; i < level.inputs.length; i++) {
      for (let j = 0; j < level.outputs.length; j++) {
        level.weights[i][j] = Math.random() * 2 - 1;
      }
    }
    // randomise the biases with values from -1 to 1
    for (let i = 0; i < level.biases.length; i++) {
      level.biases[i] = Math.random() * 2 - 1;
    }
  }

  // function to quantify inputs to neurons
  static activationFunciton(x: number, bias: number) {
    return x > bias ? 1 : 0;
  }

  // function to feed forward the inputs to the outputs
  static feedForward(givenInputs: number[], level: Level) {
    for (let i = 0; i < level.inputs.length; i++) {
      level.inputs[i] = givenInputs[i];
    }

    for (let i = 0; i < level.outputs.length; i++) {
      let sum = 0;
      for (let j = 0; j < level.inputs.length; j++) {
        sum += level.inputs[j] * level.weights[j][i];
      }
      level.outputs[i] = Level.activationFunciton(sum, level.biases[i]);
    }
    return level.outputs;
  }
}
