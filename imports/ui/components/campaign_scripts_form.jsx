import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import { ScriptEditor } from './script_editor'
import Divider from 'material-ui/Divider'


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
          {this.renderScriptRow(script)}
          { faqScripts.map((faqScript) => this.renderScriptRow(faqScript))}
        <FlatButton
          label="Add another script"
          onTouchTap={handleAddScriptRow}
          secondary
        />
      </div>
    )
  }
}
