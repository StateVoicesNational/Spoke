import React from 'react'
import { branch, renderComponent } from 'recompose'
import LoadingIndicator from '../../components/LoadingIndicator'
import { log } from '../../lib'

const loadData = branch(
  (props) => props.data.loading && props.data.networkStatus !== 7,
  renderComponent(LoadingIndicator)
)

export default loadData
