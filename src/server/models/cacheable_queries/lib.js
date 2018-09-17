

export const modelWithExtraProps = (obj, model, props) => {
  const extraProps = {}
  props.forEach(prop => {
    extraProps[prop] = obj[prop]
    delete obj[prop]
  })
  const newModel = new model(obj)
  props.forEach(prop => {
    newModel[prop] = extraProps[prop]
  })
  return newModel
}

