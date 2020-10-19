export function shouldShowMessageCost(campaign) {
  return true;
}

export function campaignCostCalculator(
  sentTotal,
  replyTotal,
  outgoingMessageCost
) {
  const sentTotalCost = outgoingMessageCost * sentTotal;
  const replyTotalCost = 0.05 * replyTotal;

  return sentTotalCost + replyTotalCost;
}
