// pathsToSearch can search nested fields with ["field.subfield"]. Use [""] if objectsToSearch is an array of strings.
export function searchFor(query, objectsToSearch, pathsToSearch) {
  const results = [];

  objectsToSearch.forEach(o => {
    for (let j = 0; j < pathsToSearch.length; j++) {
      const keys = pathsToSearch[j].split(".");
      let value = o;
      while (keys.length > 0) {
        value = value[keys.shift()];
      }

      if (
        value &&
        value.toLowerCase().indexOf(query.trim().toLowerCase()) !== -1
      ) {
        results.push(o);
        break; // Don't add it more than once if it matches on multiple fields.
      }
    }
  });

  return results;
}
