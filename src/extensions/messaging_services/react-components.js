/* eslint no-console: 0 */
export const orgConfig = serviceName => {
  try {
    // eslint-disable-next-line global-require
    const component = require(`./${serviceName}/react-components/org-config.js`);
    return component.OrgConfig;
  } catch (caught) {
    console.log("caught", caught);
    console.error(
      `MESSAGING_SERVICES failed to load orgConfig reaction component for ${serviceName}`
    );
    return null;
  }
};

export default orgConfig;
