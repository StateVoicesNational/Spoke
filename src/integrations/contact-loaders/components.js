import { getConfig } from "../../server/api/lib/config";

function getComponents() {
  const enabledComponents = (
    global.CONTACT_LOADERS || "csv-upload,test-fakedata,datawarehouse"
  ).split(",");
  const components = {};
  enabledComponents.forEach(componentName => {
    try {
      const c = require(`./${componentName}/react-component.js`);
      components[componentName] = c.CampaignContactsForm;
    } catch (err) {
      console.error("CONTACT_LOADERS failed to load component", componentName);
    }
  });
  return components;
}

const componentList = getComponents();

export default componentList;
