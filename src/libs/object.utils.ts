/**
 * A generic deep cloning function that creates a new object or array
 * with all its nested properties and elements recursively copied.
 * It handles primitive types, Arrays, Objects, Dates, RegExps, Maps, and Sets.
 * It also prevents infinite loops due to circular references by using a WeakMap.
 *
 * @template T The type of the value to be cloned.
 * @param {T} obj The object or value to deep clone.
 * @param {WeakMap<object, any>} [hash=new WeakMap()] An internal WeakMap used to track
 * objects already cloned during the current operation to handle circular references.
 * @returns {T} A deep clone of the input object or value.
 */
export const deepClone = <T>(obj: T, hash = new WeakMap<object, any>()): T => {
  // 1. Handle primitive types and null/undefined
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 2. Handle circular references
  // If this object has already been processed in the current cloning operation,
  // return the already-cloned version to prevent infinite loops.
  if (hash.has(obj)) {
    return hash.get(obj);
  }

  // 3. Handle specific built-in objects that need special instantiation
  // (e.g., Date, RegExp, Map, Set)

  // Handle Date objects
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  // Handle RegExp objects
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T;
  }

  // Handle Map objects
  if (obj instanceof Map) {
    const clonedMap = new Map();
    hash.set(obj, clonedMap); // Store reference before recursion for circularity
    obj.forEach((value, key) => {
      // Recursively clone both keys and values
      clonedMap.set(deepClone(key, hash), deepClone(value, hash));
    });
    return clonedMap as T;
  }

  // Handle Set objects
  if (obj instanceof Set) {
    const clonedSet = new Set();
    hash.set(obj, clonedSet); // Store reference before recursion for circularity
    obj.forEach((value) => {
      // Recursively clone each value
      clonedSet.add(deepClone(value, hash));
    });
    return clonedSet as T;
  }

  // 4. Handle Arrays
  if (Array.isArray(obj)) {
    const clonedArr: any[] = [];
    hash.set(obj, clonedArr); // Store reference before recursion for circularity
    obj.forEach((item, index) => {
      clonedArr[index] = deepClone(item, hash);
    });
    return clonedArr as T;
  }

  // 5. Handle Objects (plain objects)
  // At this point, if it's an object and not one of the above special types,
  // it's treated as a plain object.
  const clonedObj = Object.create(Object.getPrototypeOf(obj)); // Preserve prototype chain
  hash.set(obj, clonedObj); // Store reference before recursion for circularity

  for (const key in obj) {
    // Ensure we only copy own enumerable properties
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key], hash);
    }
  }

  return clonedObj as T;
};
