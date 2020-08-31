// pathsToSearch can search nested fields with ["field.subfield"].
export function searchFor(query, objectsToSearch, pathsToSearch) {
  return objectsToSearch.filter(o => {
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
        return true;
      }
    }
    return false;
  });
}
