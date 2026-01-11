
// A simple check to see if a value is a non-null object
export function isObject(item: any): item is Record<string, any> {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

// Deep merge two objects.
// `target` is the object to merge into.
// `source` is the object with new data.
export function mergeWith(target: any, source: any, customizer?: (objValue: any, srcValue: any) => any): any {
  let output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeWith(target[key], source[key], customizer);
        }
      } else {
        const customValue = customizer ? customizer(target[key], source[key]) : undefined;
        if (customValue !== undefined) {
          Object.assign(output, { [key]: customValue });
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      }
    });
  }
  return output;
}
