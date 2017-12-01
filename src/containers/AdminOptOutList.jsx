import PropTypes from 'prop-types';
import React from 'react'
import { List, ListItem } from 'material-ui/List'
import ProhibitedIcon from 'material-ui/svg-icons/av/not-interested'
import Empty from '../components/Empty'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import { compose } from 'recompose'
import { graphql } from 'react-apollo'

const AdminOptOutList = function AdminOptOutList(props) {
  const { data } = props
  const { optOuts } = data.organization
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
  data: PropTypes.object
}

const query = graphql(gql`
  query getOptOuts($organizationId: String!) {
    organization(id: $organizationId) {
      id
      optOuts {
        id
        cell
      }
    }
  }
`, {
  options: ({ params: { organizationId } }) => ({ variables: { organizationId } })
})

export default compose(query, loadData)(AdminOptOutList)
