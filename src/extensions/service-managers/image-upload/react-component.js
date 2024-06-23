/* eslint no-console: 0 */
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";
import Autocomplete from "@material-ui/lab/Autocomplete";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

import axios from "axios";

export class CampaignConfig extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <CampaignScriptEditor
        serviceManagerInfo={this.props.serviceManagerInfo}
        campaign={this.props.campaign}
        onSubmit={this.props.onSubmit}
      />
    )
  }
}

CampaignConfig.propTypes = {
  user: PropTypes.object,
  campaign: PropTypes.object,
  serviceManagerInfo: PropTypes.object,
  saveLabel: PropTypes.string,
  onSubmit: PropTypes.func
};

export class CampaignScriptEditor extends React.Component {
  constructor(props) {
    super(props);
    console.log('image upload scripteditor', props);
    const { fileList } = props.serviceManagerInfo.data;
    const self = this;

    const fileOptions = (fileList && fileList.map(f => {
      const name = self.getNameFromPath(f);
      return name && {id: f, name};
    }).filter(f => f)) || [];
    console.log('fileOptions', fileOptions);

    this.state = { fileOptions };
  }

  getNameFromPath = (path) => {
    const name_parts = path.match(/\/([^_/]+)_(.*)$/);
    return name_parts && name_parts[2];
  }

  handleUploadError = message => {
    this.setState({
      uploading: false,
      uploadError: message
    });
  }

  handleUpload = async event => {
    event.preventDefault();
    const file = event.target.files[0];
    //const { s3Url, s3key } = this.props.serviceManagerInfo.data;
    this.setState({
      uploading: true,
      uploadError: null,
      fileName: file.name,
    });
    const self = this;
    console.log('UPLOADING', file.name, file.type, file);
    if (!/^image\//.test(file.type)) {
      return this.handleUploadError(`File of type ${file.type} is not an image`);
    }
    const signalRes = await self.props.onSubmit({ fileName: file.name, fileType: file.type });
    console.log('image upload updateSignalRes', signalRes);
    if (!signalRes || signalRes.errors || !signalRes.data.updateServiceManager.data.s3Url) {
      const errorMessage = (signalRes && signalRes.errors && signalRes.errors[0].message) || "Upload token unavailable";
      return this.handleUploadError(`Server error: ${errorMessage}`);
    } else if (signalRes && signalRes.data.updateServiceManager && signalRes.data.updateServiceManager.data.s3Url) {
      const { s3key, s3Url } = signalRes.data.updateServiceManager.data;
      console.log("uploading", s3key, s3Url);
      axios.put(
        s3Url, 
        file,
        { headers: {'Content-Type': file.type } }
      ).then(
        res => {
          console.log('uploaded', res);
          const name = self.getNameFromPath(s3key);
          self.setState({
            uploading: false,
            uploadError: null,
            //fileOptions: [...this.state.fileOptions, {id: s3key, name }]
          });
          self.insertURL(s3key);
        },
        err => {
          console.log('ERROR', err);
          self.handleUploadError(`Upload error: ${err}`);
        }
      );
    }
  }

  renderUploadButton() {
    const { uploading, uploadError } = this.state;
    return (
      <div>
        <Button
          variant="contained"
          disabled={uploading}
          onClick={() => this.uploadButton.click()}
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>
        <div>{uploadError}</div>
        <input
          id="image-s3-upload"
          ref={input => input && (this.uploadButton = input)}
          type="file"
          onChange={this.handleUpload}
          style={{ display: "none" }}
        />
      </div>
    );
  }

  insertURL = (path) => {
    console.log(path, this.props.formValues);
    if (this.props.formValues && this.props.formValues.insertText) {
      this.props.formValues.insertText(`\n[${this.props.serviceManagerInfo.data.baseUrl}/${path}]`);
    }
  }

  renderFileList() {
    const { fileOptions } = this.state;
    if (fileOptions && fileOptions.length) {
      const self = this;
      return (
        <Autocomplete
          autoFocus
          disablePortal
          getOptionLabel={o => o.name}
          // style={inlineStyles.autocomplete}
          options={fileOptions}
          style={{
            marginBottom: 24,
            width: 250
          }}
          renderInput={params => {
            return <TextField {...params} label="Past uploaded files" />;
          }}
          onChange={(event, value) => {
            console.log('autocomplete selected', value);
            if (value && value.id) {
              self.insertURL(value.id);
            }
          }}
        />
      );
    }
  }

  render() {
    console.log("image-upload", this.props);
    return (
      <div>
        {this.renderUploadButton()}
        {this.renderFileList()}
      </div>
    );
  }
}

CampaignScriptEditor.propTypes = {
  serviceManagerInfo: PropTypes.object,
  campaign: PropTypes.object,
  formValues: PropTypes.object,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  campaignConfig: PropTypes.bool
};

