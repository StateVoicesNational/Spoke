export function shouldShowCampaignBudgetColumn(campaigns) {
  const campaignsWithBudget = campaigns.filter(campaign => !!campaign.budget);
  return !!campaignsWithBudget.length;
}

export function campaignCostCalculator(
  sentTotal,
  replyTotal,
  outgoingMessageCost,
  incomingMessageCost
) {
  const sentTotalCost = outgoingMessageCost * sentTotal;
  const replyTotalCost = incomingMessageCost * replyTotal;

  return sentTotalCost + replyTotalCost;
}

export function getBudgetUsedPercentage(
  sentMessageTotal,
  replyMessageTotal,
  outgoingMessageCost,
  incomingMessageCost,
  campaignBudget
) {
  const totalCampaignCost = campaignCostCalculator(
    sentMessageTotal,
    replyMessageTotal,
    outgoingMessageCost,
    incomingMessageCost
  );

  const budgetUsedPercentage = (totalCampaignCost / campaignBudget) * 100;
  return budgetUsedPercentage.toFixed(0);
}
