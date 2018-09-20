

export const modelWithExtraProps = (obj, Model, props) => {
  const newObj = { ...obj }
  const extraProps = {}
  props.forEach(prop => {
    extraProps[prop] = newObj[prop]
    delete newObj[prop]
  })
  const newModel = new Model(newObj)
  props.forEach(prop => {
    newModel[prop] = extraProps[prop]
  })
  return newModel
}

