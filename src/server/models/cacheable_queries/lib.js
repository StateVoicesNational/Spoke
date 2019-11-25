export const modelWithExtraProps = (obj, Model, props) => {
  // This accepts a Model type and adds extra properties to it
  // while preserving its Model prototype
  // This is useful so we can return Model types so .save() and other
  // methods are available, but we decorate it with additional
  // properties which are distilled from separate tables
  // e.g. campaign.interactionSteps
  const newObj = { ...obj };
  const extraProps = {};
  props.forEach(prop => {
    extraProps[prop] = newObj[prop];
    delete newObj[prop];
  });
  const newModel = new Model(newObj);
  props.forEach(prop => {
    newModel[prop] = extraProps[prop];
  });
  return newModel;
};
