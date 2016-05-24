import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import { ScriptEditor } from './script_editor'
import Divider from 'material-ui/Divider'
import Subheader from 'material-ui/Subheader'

export class CampaignScriptsForm extends Component {
  renderScriptRow(script) {
    const {
      onScriptChange,
      onScriptDelete,
      sampleContact,
      customFields } = this.props
    console.log("the script!", script)
    return (!script ? '' :
      <div>
        <ScriptEditor
          expandable
          key={script._id}
          script={script}
          sampleContact={sampleContact}
          customFields={customFields}
          onScriptChange={onScriptChange}
          onScriptDelete={onScriptDelete}
        />
        <Divider/>
      </div>
    )
  }
  render() {
    const { faqScripts, script, handleAddScriptRow } = this.props
    console.log(script, faqScripts)
    return (
      <div>
        <Subheader>Default script</Subheader>
          {this.renderScriptRow(script)}
        <Subheader>Saved replies</Subheader>
          { faqScripts.map((faqScript) => this.renderScriptRow(faqScript))}
        <FlatButton
          label="Add saved reply"
          onTouchTap={handleAddScriptRow}
          secondary
        />
      </div>
    )
  }
}
