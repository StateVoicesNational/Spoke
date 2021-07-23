# Spoke Testing
Suggested steps for testing Spoke. These steps allow us to see if Spoke's 'basic' functionality works before updating the main branch and production.

## Testing Steps:
### Basic text manager workflow, for at least one existing texter:
1. Login as an admin user
2. Create a new campaign in an existing organization
3. Create a csv with columns firstName, lastName, cell and add a few sample people to text
   * with optOuts
   * without optOut
4. Assign a test texter, all the contacts
5. Create a script with a question
   * Define a few answers, and test saving with no answers, blank answers, and good answers.
   * Link at least one question to a next step
6. Add a canned response
7. Click "Start this campaign!"

### Texter workflow:
1. As a texter that was just assigned to a campaign, login and visit dashboard
2. As a texter, work through the assigned list of contacts
3. As the message recipient, reply to the texts you received
4. As the texter, view the question responses

### Basic text manager workflow, for an organization with no existing texters:
1. Login as the test admin user (who you logged in as previously)
2. Create a new campaign in the default organization
3. Create a csv with columns firstName, lastName, cell and add a few sample people to text. Use list of test users provided to you.
   * with optOuts
   * without optOut
4. Generate an invite for this campaign to send to texters
5. As a texter (in a different browser window or chrome incognito window) load up the invite link
6. As test admin user, proceed with campaign steps above

### Editing names and email as an admin or a texter:
1. As an admin, visit the people tab and click on `Edit` next to your logged in user's name
2. Edit the name, click save and return to the people's menu. Make sure your edits saved.
3. As an admin, click on the corner menu (should be a circle with the first letter of the first name of a user). Click on the name/email and edit.
4. Edit the name, click save and return to the previous screen. Make sure your edits saved.
5. As a texter, click on the corner menu (should be a circle with the first letter of the first name of a user). Click on the name/email and edit.

### Creating New Users:
1. As an admin, visit the people tab and click on the `+` button in the lower right hand corner. A modal titled `Invite new texters` should pop up. Copy the join link and then open it in a different browser (if using chrome, you can use an incognito window). Paste the link and try to signup a new user (from list of fake emails). Return to admin account (in the other browser or login again) and visit the people tab. Make sure the new user shows up with their role as texter.

### Copying Campaigns:
1. Click on a live campaign by visiting the `Campaigns` tab.
2. Click on the `Copy` button.
3. Revisit the `Campaigns`. You should see a new (not live) campaign (highlighted yellow).
4. Click on the campaign. The interactions tab and Canned Response tab should already be green.
5. Click on basics. You should see the `COPY + (your campaign title)` and the description filled out - these should be identical to the original campaign.
6. Contacts should not be loaded.
7. Texters should not be loaded.
8. Interactions should be loaded with the same script, answers and tree structure.
9. Canned responses should be loaded with the same canned responses from the original campaign.

### Editing Campaigns:
1. Click on a live campaign by visiting the `Campaigns` tab.
2. Click on the `Edit` button and change something in the basic info, script or in canned response. Make sure you press save in the corresponding tab.
3. Revisit tab and verify that the change has saved.

### Texting people in different Timezones:
1. As an Admin, create a campaign with at least one contact in a non EST timezone (ex. PST) and one contact in EST
2. In Settings: Enable Set Enforce texting hours (if needed given the current time, adjust the timezone settings so that one contact is within the texting hours and one is out of the hours)
3. As a texter, verify that you can text the contact that’s within the texting hours and that you can’t text the contact that out of the texting hours (‘Send Later’ button is displayed and greyed out for the latter)
4. As an Admin, disable Enforce texting hours
5. As a texter, verify that you can text any contact

