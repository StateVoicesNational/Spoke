import PropTypes from 'prop-types'
import React from 'react'
import { List, ListItem } from 'material-ui/List'
import ProhibitedIcon from 'material-ui/svg-icons/av/not-interested'
import Empty from '../components/Empty'
import { newLoadData } from './hoc/load-data'
import gql from 'graphql-tag'

const AdminOptOutList = function AdminOptOutList(props) {
  const { getOptOuts } = props
  const { optOuts } = getOptOuts.organization
  return (
    <div>
      {optOuts.length === 0 ?
        <Empty
          title='Yay, no one has opted out!'
          icon={<ProhibitedIcon />}
        /> :
        <List>
          {optOuts.map((optOut) => (
            <ListItem
              key={optOut.id}
              primaryText={optOut.cell}
            />
          ))}
        </List>
      }
    </div>
  )
}

AdminOptOutList.propTypes = {
  getOptOuts: PropTypes.object
}

const queries = {
  getOptOuts: {
    gql: gql`
      query getOptOuts($organizationId: String!) {
        organization(id: $organizationId) {
          id
          optOuts {
            id
            cell
          }
        }
      }
    `,
    options: (props) => ({
      variables: { organizationId: props.params.organizationId },
      forceFetch: true
    })
  }
}

export default newLoadData({ queries })(AdminOptOutList)
