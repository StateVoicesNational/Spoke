import React, { Component } from 'react'
import AutoComplete from 'material-ui/AutoComplete'
import Avatar from 'material-ui/Avatar'
import RaisedButton from 'material-ui/RaisedButton'
import Divider from 'material-ui/Divider'
import { ListItem, List } from 'material-ui/List'
import { parseCSV } from '../../api/campaign_contacts/parse_csv'
import Formsy from 'formsy-react'
import { FormsyText } from 'formsy-material-ui/lib'
import { Chip } from './chip'
import Subheader from 'material-ui/Subheader'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';

export class CampaignAssignmentForm extends Component {
  constructor(props) {
    super(props)
    this.handleNewRequest = this.handleNewRequest.bind(this)
  }

  handleNewRequest(value) {
    // If you're searching but get no match, value is a string
    // representing your search term, but we only want to handle matches
    if (typeof(value) === 'object') {
      const texterId = value.value.key
      // TODO react addon for modifying immutable state
      let newAssignedTexters
      if (texterId === 'allTexters') {
        const { texters } = this.props
        newAssignedTexters = texters.map((texter) => texter._id)
      } else {
        const { assignedTexters } = this.props
        newAssignedTexters = assignedTexters.concat([texterId])
      }

      const { onTexterAssignment } = this.props
      onTexterAssignment(newAssignedTexters)
    }
  }

  dataSourceItem(name, key, image) {
    return {
      text: name,
      value: (
        <ListItem
          key={key}
          primaryText={name}
          avatar={<Avatar src={image} />}
        />
      )
    }
  }

  render() {
    const { texters, assignedTexters } = this.props
    // TODO remove already assigned texters
    const dataSource = [this.dataSourceItem('Assign all texters', 'allTexters', null)].concat(
      texters.filter((texter) =>
        assignedTexters.indexOf(texter._id) === -1).map((texter) =>
          this.dataSourceItem(
          `${texter.firstName} ${texter.lastName}`,
          texter._id,
          'images/chexee-128.jpg'
        )
      )
    )
    // TODO helper function for the names

    const filter = (searchText, key) => (key === 'allTexters') ? true : AutoComplete.caseInsensitiveFilter(searchText, key)

    // TODO https://github.com/callemall/material-ui/pull/4193/commits/8e80a35e8d2cdb410c3727333e8518cadc08783b
    const autocomplete = (
      <AutoComplete
        openOnFocus
        filter={filter}
        hintText="Search for texters to assign"
        dataSource={dataSource}
        onNewRequest={this.handleNewRequest}
      />
    )

    return (
      <div>
       {autocomplete}
       { assignedTexters.map((texterId) => {
          const user = Meteor.users.findOne({_id: texterId})
          return (
              <Chip
                text={user.firstName}
              />
          )
       }) }
      </div>
    )
  }
}
