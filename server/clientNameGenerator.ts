export class ClientNameGenerator {
  private readonly colors: string[] = [
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Purple",
    "Orange",
    "Black",
    "White",
  ];
  private readonly animals: string[] = [
    "Tiger",
    "Shark",
    "Monkey",
    "Elephant",
    "Eagle",
    "Dolphin",
    "Panda",
    "Wolf",
  ];
  private usedCombinations: Set<string> = new Set();

  constructor() {
    this.usedCombinations = new Set();
  }

  private getAllPossibleCombinations(): string[] {
    const combinations: string[] = [];
    for (const color of this.colors) {
      for (const animal of this.animals) {
        combinations.push(`${color} ${animal}`);
      }
    }
    return combinations;
  }

  public getAvailableName(): string | null {
    const allCombinations = this.getAllPossibleCombinations();
    const availableCombinations = allCombinations.filter(
      (combo) => !this.usedCombinations.has(combo)
    );

    if (availableCombinations.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(
      Math.random() * availableCombinations.length
    );
    const selectedCombination = availableCombinations[randomIndex];
    this.usedCombinations.add(selectedCombination);

    return selectedCombination;
  }

  public releaseName(name: string): void {
    this.usedCombinations.delete(name);
  }

  public getRemainingCombinations(): number {
    return (
      this.getAllPossibleCombinations().length - this.usedCombinations.size
    );
  }
}
