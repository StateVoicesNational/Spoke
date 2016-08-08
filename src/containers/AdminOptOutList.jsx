import React from 'react'
import { List, ListItem } from 'material-ui/List'
import ProhibitedIcon from 'material-ui/svg-icons/av/not-interested'
import Empty from '../components/Empty'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'

class AdminOptOutList extends React.Component {
  render() {
    const { data } = this.props
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
