function getComponents() {
  const enabledComponents = (
    global.TEXTER_SIDEBOXES || "contact-reference"
  ).split(",");
  const components = {};
  enabledComponents.forEach(componentName => {
    try {
      const c = require(`./${componentName}/react-component.js`);
      components[componentName] = c;
    } catch (err) {
      console.error("TEXTER_SIDEBOXES failed to load component", componentName);
    }
  });
  return components;
}

const componentList = getComponents();

export default componentList;
