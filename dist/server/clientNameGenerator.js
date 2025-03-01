"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientNameGenerator = void 0;
class ClientNameGenerator {
    constructor() {
        this.colors = [
            "Slate",
            "Gray",
            "Zinc",
            "Neutral",
            "Stone",
            "Red",
            "Orange",
            "Amber",
            "Yellow",
            "Lime",
            "Green",
            "Emerald",
            "Teal",
            "Cyan",
            "Sky",
            "Blue",
            "Indigo",
            "Violet",
            "Purple",
            "Fuchsia",
            "Pink",
            "Rose",
        ];
        this.animals = [
            "Cat",
            "Panda",
            "Bear",
            "Rabbit",
            "Chicken",
            "Dog",
            "Gorilla",
            "Koala",
            "Meerkat",
            "Duck",
            "Giraffe",
            "Hippopotamus",
            "Dragon",
            "Shark",
            "Sloth",
            "Penguin",
            "Lion",
            "Weasel",
        ];
        this.usedCombinations = new Set();
        this.usedCombinations = new Set();
    }
    getAllPossibleCombinations() {
        const combinations = [];
        for (const color of this.colors) {
            for (const animal of this.animals) {
                combinations.push(`${color} ${animal}`);
            }
        }
        return combinations;
    }
    getAvailableName() {
        const allCombinations = this.getAllPossibleCombinations();
        const availableCombinations = allCombinations.filter((combo) => !this.usedCombinations.has(combo));
        if (availableCombinations.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * availableCombinations.length);
        const selectedCombination = availableCombinations[randomIndex];
        this.usedCombinations.add(selectedCombination);
        return selectedCombination;
    }
    releaseName(name) {
        this.usedCombinations.delete(name);
    }
    getRemainingCombinations() {
        return (this.getAllPossibleCombinations().length - this.usedCombinations.size);
    }
}
exports.ClientNameGenerator = ClientNameGenerator;
