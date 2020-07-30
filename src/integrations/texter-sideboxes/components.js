import React from "react";

function getComponents() {
  const enabledComponents =
    "TEXTER_SIDEBOXES" in global
      ? (global.TEXTER_SIDEBOXES && global.TEXTER_SIDEBOXES.split(",")) || []
      : [];
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

export const componentList = getComponents();

export const getSideboxes = ({
  settingsData,
  campaign,
  contact,
  assignment,
  texter,
  navigationToolbarChildren,
  messageStatusFilter,
  finished,
  loading
}) => {
  const popups = [];
  const enabledSideboxes = campaign.texterUIConfig.sideboxChoices
    .filter(sb => {
      if (
        settingsData[sb] ||
        (sb.startsWith("default") && settingsData[sb] !== false)
      ) {
        const res = componentList[sb].showSidebox({
          settingsData,
          campaign,
          contact,
          assignment,
          texter,
          navigationToolbarChildren,
          messageStatusFilter,
          finished,
          loading
        });
        if (res === "popup") {
          popups.push(sb);
        }
        return res;
      }
      return false;
    })
    .map(sb => ({
      name: sb,
      Component: componentList[sb].TexterSidebox
    }));
  enabledSideboxes.popups = popups;
  return enabledSideboxes;
};

export const renderSidebox = (
  sideBox,
  settingsData,
  parentComponent,
  moreProps
) => {
  const Component = sideBox.Component;
  return (
    <Component
      key={sideBox.name}
      settingsData={settingsData}
      {...parentComponent.props}
      {...(moreProps || {})}
      updateState={state => {
        // allows a component to preserve state across dialog open/close
        parentComponent.setState({ [`sideboxState${name}`]: state });
      }}
      persistedState={parentComponent.state[`sideboxState${name}`]}
    />
  );
};

export default componentList;
