import PropTypes from "prop-types";
import React from "react";
import DisplayLink from "./DisplayLink";

const OrganizationReassignLink = ({ joinToken, campaignId }) => {
  let baseUrl = "https://base";
  if (typeof window !== "undefined") {
    baseUrl = window.location.origin;
  }

  const replyUrl = `${baseUrl}/${joinToken}/replies/${campaignId}`;
  const textContent = `Send your texting volunteers this link! Once they sign up, they\'ll be automatically assigned replies for this campaign.`;

  return <DisplayLink url={replyUrl} textContent={textContent} />;
};

OrganizationReassignLink.propTypes = {
  joinToken: PropTypes.string,
  campaignId: PropTypes.string
};

export default OrganizationReassignLink;
