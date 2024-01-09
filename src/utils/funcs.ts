export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Returns the index of the first appearance of the element at the given index in the given sorted array
 * @param sortedArray the sorted array
 * @param knownIndexOfElement the index of the element
 * @returns the index of the first appearance of the element at the sorted array
 */
export function getIndexOfFirstAppearanceOfElement(sortedArray: any[], knownIndexOfElement: number){
  for (let i = 0; i <= knownIndexOfElement; i++) {
    if(sortedArray[knownIndexOfElement - 1 - i] !== sortedArray[knownIndexOfElement - i]){
        return knownIndexOfElement - i;
    }
  }

  return 0;
}

/**
 * Returns the index of the last appearance of the element at the given index in the given sorted array
 * @param sortedArray the sorted array
 * @param knownIndexOfElement the index of the element
 * @returns the index of the last appearance of the element at the sorted array
 */
export function getIndexOfLastAppearanceOfElement(sortedArray: any[], knownIndexOfElement: number){
  for (let i = 0; i <= knownIndexOfElement; i++) {
    if(sortedArray[knownIndexOfElement + 1 + i] !== sortedArray[knownIndexOfElement + i]){
        return knownIndexOfElement + i;
    }
  }

  return 0;
}