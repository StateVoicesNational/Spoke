export const tagsFilterStateFromTagsFilter = tagsFilter => {
  const newTagsFilter = {};
  if (tagsFilter.anyTag) {
    newTagsFilter.include = ["*"];
  } else if (tagsFilter.noTag) {
    newTagsFilter.include = [];
  } else if (!tagsFilter.ignoreTags) {
    newTagsFilter.include = Object.values(tagsFilter.selectedTags || {}).map(
      tagFilter => (tagFilter || {}).id
    );
    newTagsFilter.suppress = Object.values(tagsFilter.suppressedTags || {}).map(
      tagFilter => (tagFilter || {}).id
    );
  }
  return newTagsFilter;
};

export function getCampaignsFilterForCampaignArchiveStatus(
  includeActiveCampaigns,
  includeArchivedCampaigns
) {
  let isArchived = undefined;
  if (!includeActiveCampaigns && includeArchivedCampaigns) {
    isArchived = true;
  } else if (
    (includeActiveCampaigns && !includeArchivedCampaigns) ||
    (!includeActiveCampaigns && !includeArchivedCampaigns)
  ) {
    isArchived = false;
  }

  if (isArchived !== undefined) {
    return { isArchived };
  }

  return {};
}

export function getContactsFilterForConversationOptOutStatus(
  includeNotOptedOutConversations,
  includeOptedOutConversations
) {
  let isOptedOut = undefined;
  if (!includeNotOptedOutConversations && includeOptedOutConversations) {
    isOptedOut = true;
  } else if (
    (includeNotOptedOutConversations && !includeOptedOutConversations) ||
    (!includeNotOptedOutConversations && !includeOptedOutConversations)
  ) {
    isOptedOut = false;
  }

  if (isOptedOut !== undefined) {
    return { isOptedOut };
  }

  return {};
}

export const getConversationFiltersFromQuery = (query, organizationTags) => {
  const includeArchivedCampaigns = query.archived
    ? Boolean(parseInt(query.archived))
    : false;
  const includeActiveCampaigns = query.active
    ? Boolean(parseInt(query.active))
    : true;
  const includeNotOptedOutConversations = query.notOptedOut
    ? Boolean(parseInt(query.notOptedOut))
    : true;
  const includeOptedOutConversations = query.optedOut
    ? Boolean(parseInt(query.optedOut))
    : false;
  const filters = {
    campaignsFilter: getCampaignsFilterForCampaignArchiveStatus(
      includeActiveCampaigns,
      includeArchivedCampaigns
    ),
    contactsFilter: getContactsFilterForConversationOptOutStatus(
      includeNotOptedOutConversations,
      includeOptedOutConversations
    ),
    messageTextFilter: query.messageText ? query.messageText : "",
    assignmentsFilter: query.texterId
      ? { texterId: Number(query.texterId), sender: query.sender === "1" }
      : {},
    texterSearchText: query.texterId == "-2" ? " Unassigned" : undefined,
    includeArchivedCampaigns,
    includeActiveCampaigns,
    includeNotOptedOutConversations,
    includeOptedOutConversations,
    tagsFilter: { ignoreTags: true }
  };
  if (query.campaigns) {
    filters.campaignsFilter.campaignIds = query.campaigns.split(",");
  }
  if (query.messageStatus) {
    filters.contactsFilter.messageStatus = query.messageStatus;
  }
  if (query.errorCode) {
    filters.contactsFilter.errorCode = query.errorCode.split(",");
  }
  if (query.tags) {
    if (/^[a-z]/.test(query.tags)) {
      filters.tagsFilter = { [query.tags]: true };
    } else {
      const selectedTags = {};
      const suppressedTags = {};
      query.tags.split(",").forEach(t => {
        if (isNaN(parseInt(t, 10))) {
          const tag = organizationTags.find(ot => `s_${ot.id}` === t);
          tag.id = t;
          suppressedTags[t] = tag;
        } else {
          selectedTags[t] = organizationTags.find(ot => ot.id === t);
        }
      });
      filters.tagsFilter = { selectedTags, suppressedTags };
    }
  }
  const newTagsFilter = tagsFilterStateFromTagsFilter(filters.tagsFilter);
  filters.contactsFilter.tags = newTagsFilter.include;
  filters.contactsFilter.suppressedTags = newTagsFilter.suppress;
  return filters;
};
