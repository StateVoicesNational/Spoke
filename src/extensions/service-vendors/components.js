/* eslint no-console: 0 */
export const getServiceVendorComponent = serviceName => {
  try {
    // eslint-disable-next-line global-require
    const component = require(`./${serviceName}/react-component.js`);
    return component;
  } catch (caught) {
    console.log("caught", caught);
    console.error(
      `SERVICE_VENDOR failed to load react component for ${serviceName}`
    );
    return null;
  }
};
