import { getConfig } from "../server/api/lib/config";

function getComponents() {
  // TODO: default will be csv-upload for real version
  const enabledComponents = (getConfig("CONTACT_LOADERS") || "test-fakedata").split(",");
  const components = {}
  enabledComponents.forEach(componentName => {
    try {
      const c = require(`./${componentName}/react-component.js`);
      components[componentName] = c.CampaignContactsForm;
    } catch(err) {
      console.error(
        "CONTACT_LOADERS failed to load component", componentName
      );
    }
  });
  return components
}

const componentList = getComponents();

export default componentList;
