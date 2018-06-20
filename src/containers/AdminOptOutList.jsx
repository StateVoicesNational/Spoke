import PropTypes from 'prop-types'
import React from 'react'
import gql from 'graphql-tag'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import NotInterestedIcon from '@material-ui/icons/NotInterested'

import loadData from './hoc/load-data'
import Empty from '../components/Empty'

const AdminOptOutList = function AdminOptOutList(props) {
  const { data } = props
  const { optOuts } = data.organization
  return (
    <div>
      {optOuts.length === 0 ?
        <Empty
          title='Yay, no one has opted out!'
          icon={<NotInterestedIcon />}
        /> :
        <List>
          {optOuts.map((optOut) => (
            <ListItem key={optOut.id}>
              <ListItemText primary={optOut.cell} />
            </ListItem>
          ))}
        </List>
      }
    </div>
  )
}

AdminOptOutList.propTypes = {
  data: PropTypes.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getOptOuts($organizationId: String!) {
      organization(id: $organizationId) {
        id
        optOuts {
          id
          cell
        }
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
})

export default loadData(AdminOptOutList, { mapQueriesToProps })
