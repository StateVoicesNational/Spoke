import { r, Campaign, User, Organization } from "./models";
import { log } from "../lib";
import { sendEmail } from "./mail";

export const Notifications = {
  CAMPAIGN_STARTED: "campaign.started",
  ASSIGNMENT_CREATED: "assignment.created",
  ASSIGNMENT_UPDATED: "assignment.updated"
};

async function getOrganizationOwner(organizationId) {
  return await r
    .table("user_organization")
    .getAll(organizationId, { index: "organization_id" })
    .filter({ role: "OWNER" })
    .limit(1)
    .eqJoin(
      "user_id",
      r.table("user")
    )("right")(0);
}
const sendAssignmentUserNotification = async (assignment, notification) => {
  const campaign = await Campaign.get(assignment.campaign_id);

  if (!campaign.is_started) {
    return;
  }

  const organization = await Organization.get(campaign.organization_id);
  const user = await User.get(assignment.user_id);
  const orgOwner = await getOrganizationOwner(organization.id);

  let subject;
  let text;
  if (notification === Notifications.ASSIGNMENT_UPDATED) {
    subject = `[${organization.name}] Updated assignment: ${campaign.title}`;
    text = `Your assignment changed: \n\n${process.env.BASE_URL}/app/${campaign.organization_id}/todos`;
  } else if (notification === Notifications.ASSIGNMENT_CREATED) {
    subject = `[${organization.name}] New assignment: ${campaign.title}`;
    text = `You just got a new texting assignment from ${organization.name}. You can start sending texts right away: \n\n${process.env.BASE_URL}/app/${campaign.organization_id}/todos`;
  }

  try {
    await sendEmail({
      to: user.email,
      replyTo: orgOwner.email,
      subject,
      text
    });
  } catch (e) {
    log.error(e);
  }
};

export const sendUserNotification = async notification => {
  const { type } = notification;

  if (type === Notifications.CAMPAIGN_STARTED) {
    const assignments = await r
      .table("assignment")
      .getAll(notification.campaignId, { index: "campaign_id" })
      .pluck(["user_id", "campaign_id"]);

    const count = assignments.length;
    for (let i = 0; i < count; i++) {
      const assignment = assignments[i];
      await sendAssignmentUserNotification(
        assignment,
        Notifications.ASSIGNMENT_CREATED
      );
    }
  } else if (type === Notifications.ASSIGNMENT_CREATED) {
    const { assignment } = notification;
    await sendAssignmentUserNotification(assignment, type);
  }
};

const setupNewAssignmentNotification = () =>
  r
    .table("assignment")
    .changes()
    .then(function(assignment) {
      if (!assignment.old_val) {
        sendUserNotification({
          type: Notifications.ASSIGNMENT_CREATED,
          assignment: assignment.new_val
        });
      }
    });

let notificationObserversSetup = false;

export const setupUserNotificationObservers = () => {
  if (!notificationObserversSetup) {
    notificationObserversSetup = true;
    setupNewAssignmentNotification();
  }
};
