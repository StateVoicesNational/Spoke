import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import { ScriptEditor } from './script_editor'


export class CampaignScriptsForm extends Component {
  renderScriptRow(script) {
    const { onScriptChange, sampleContact, customFields } = this.props
    console.log("the script!", script)
    return (!script ? '' :
          <ScriptEditor
            expandable
            key={script._id}
            title={script.title}
            script={script.script}
            titleEditable={!script.initial}
            sampleContact={sampleContact}
            customFields={customFields}
            onScriptChange={onScriptChange}
          />
    )
  }
  render() {
    const { faqScripts, script, handleAddScriptRow } = this.props
    return (
      <div>
        <h2>Scripts</h2>
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
