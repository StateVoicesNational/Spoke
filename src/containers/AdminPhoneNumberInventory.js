import PropTypes from "prop-types";
import React from "react";
import gql from "graphql-tag";

import ContentAdd from "material-ui/svg-icons/content/add";
import DataTables from "material-ui-datatables";
import Dialog from "material-ui/Dialog";
import FloatingActionButton from "material-ui/FloatingActionButton";
import yup from "yup";
import GSForm from "../components/forms/GSForm";
import Form from "react-formal";

import theme from "../styles/theme";
import { dataTest } from "../lib/attributes";
import loadData from "./hoc/load-data";
import { CircularProgress, FlatButton } from "material-ui";

const inlineStyles = {
  column: {
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "pre-line"
  },
  dialogFields: {
    display: "flex",
    flexDirection: "column"
  },
  dialogActions: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  cancelButton: {
    marginTop: 15,
    marginRight: 5
  }
};

class AdminPhoneNumberInventory extends React.Component {
  static propTypes = {
    organizationData: PropTypes.object,
    mutations: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.state = {
      buyNumbersDialogOpen: false
    };
  }

  buyNumbersFormSchema() {
    return yup.object({
      areaCode: yup
        .string()
        .required()
        .length(3)
        .matches(/[0-9]+/),
      limit: yup
        .number()
        .required()
        .max(window.MAX_NUMBERS_PER_BUY_JOB)
        .min(1)
    });
  }

  handleBuyNumbersOpen = () => {
    this.setState({
      buyNumbersDialogOpen: true
    });
  };

  handleBuyNumbersCancel = () => {
    this.setState({
      buyNumbersDialogOpen: false
    });
  };

  handleBuyNumbersSubmit = async formData => {
    await this.props.mutations.buyPhoneNumbers(
      formData.areaCode,
      formData.limit
    );
    this.setState({
      buyNumbersDialogOpen: false
    });
  };

  tableColumns() {
    const { pendingPhoneNumberJobs } = this.props.organizationData.organization;
    return [
      {
        key: "areaCode",
        label: "Area Code",
        style: inlineStyles.column
      },
      {
        key: "allocatedCount",
        label: "Allocated",
        style: inlineStyles.column
      },
      {
        key: "availableCount",
        label: "Available",
        style: inlineStyles.column
      },
      // TODO: display additional information here about pending and past jobs
      {
        key: "pendingJobs",
        label: "",
        style: inlineStyles.column,
        render: (columnKey, row) => {
          if (pendingPhoneNumberJobs.some(j => j.areaCode === row.areaCode)) {
            return <CircularProgress size={25} />;
          }
        }
      }
    ];
  }

  renderBuyNumbersForm() {
    return (
      <GSForm
        schema={this.buyNumbersFormSchema()}
        onSubmit={this.handleBuyNumbersSubmit}
        {...dataTest("buyNumbersForm")}
      >
        <div style={inlineStyles.dialogFields}>
          <Form.Field
            label="Area Code"
            name="areaCode"
            value=""
            {...dataTest("areaCode")}
          />
          <Form.Field
            label="Limit"
            name="limit"
            value={0}
            {...dataTest("limit")}
          />
        </div>
        <div style={inlineStyles.dialogActions}>
          <FlatButton
            type="button"
            onClick={this.handleBuyNumbersCancel}
            style={inlineStyles.cancelButton}
            label="Cancel"
          />
          <Form.Button type="submit" label="Submit" />
        </div>
      </GSForm>
    );
  }

  render() {
    const {
      phoneNumberCounts,
      pendingPhoneNumberJobs
    } = this.props.organizationData.organization;

    // Push rows for pending jobs as a simple visual indication that counts are
    // being updated.
    // In the future we may want to add a header with more data about pending
    // and past jobs including a retry button and warnings if we failed to buy
    // as many numbers as requested.
    const ownedAreaCodes = phoneNumberCounts.map(count => count.areaCode);
    const newAreaCodeRows = pendingPhoneNumberJobs
      .filter(j => ownedAreaCodes.indexOf(j.areaCode) === -1)
      .map(j => ({
        areaCode: j.areaCode,
        allocatedCount: 0,
        availableCount: 0
      }));
    const tableData = [...newAreaCodeRows, ...phoneNumberCounts];
    return (
      <div>
        <DataTables
          data={tableData}
          columns={this.tableColumns()}
          selectable={false}
          count={tableData.length}
          showFooterToolbar={false}
          showRowHover
        />
        <FloatingActionButton
          {...dataTest("buyPhoneNumbers")}
          style={theme.components.floatingButton}
          onTouchTap={this.handleBuyNumbersOpen}
        >
          <ContentAdd />
        </FloatingActionButton>
        <Dialog
          title="Buy Numbers"
          modal={false}
          open={this.state.buyNumbersDialogOpen}
          onRequestClose={this.handleBuyNumbersCancel}
        >
          {this.renderBuyNumbersForm()}
        </Dialog>
      </div>
    );
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  organizationData: {
    query: gql`
      query getOrganizationData($organizationId: String!) {
        organization(id: $organizationId) {
          id
          phoneNumberCounts {
            areaCode
            availableCount
            allocatedCount
          }
          pendingPhoneNumberJobs {
            id
            assigned
            status
            resultMessage
            areaCode
            limit
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    pollingInterval: 5000,
    forceFetch: true
  }
});

const mapMutationsToProps = ({ ownProps }) => ({
  buyPhoneNumbers: (areaCode, limit) => ({
    mutation: gql`
      mutation buyPhoneNumbers(
        $organizationId: ID!
        $areaCode: String!
        $limit: Int!
      ) {
        buyPhoneNumbers(
          organizationId: $organizationId
          areaCode: $areaCode
          limit: $limit
        ) {
          id
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      areaCode,
      limit
    },
    refetchQueries: ["getOrganizationData"]
  })
});

export default loadData(AdminPhoneNumberInventory, {
  mapQueriesToProps,
  mapMutationsToProps
});
