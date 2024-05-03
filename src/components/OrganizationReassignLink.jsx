import PropTypes from "prop-types";
import React from "react";
import DisplayLink from "./DisplayLink";

const OrganizationReassignLink = ({ organizationUuid, campaignId }) => {
  let baseUrl = "http://base";
  if (typeof window !== "undefined") {
    baseUrl = window.location.origin;
  }

  const replyUrl = `${baseUrl}/${organizationUuid}/replies/${campaignId}`;
  const textContent = `Send your texting volunteers this link! Once they sign up, they\'ll be automatically assigned replies for this campaign.`;

  return <DisplayLink url={replyUrl} textContent={textContent} />;
};

OrganizationReassignLink.propTypes = {
  organizationUuid: PropTypes.string,
  campaignId: PropTypes.string
};

export default OrganizationReassignLink;
