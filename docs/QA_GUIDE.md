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

### Editing names and email as an admin or a texter
1. As an admin, visit the people tab and click on `Edit` next to your logged in user's name
2. Edit the name, click save and return to the people's menu. Make sure your edits saved.
3. As an admin, click on the corner menu (should be a circle with the first letter of the first name of a user). Click on the name/email and edit.
4. Edit the name, click save and return to the previous screen. Make sure your edits saved.
5. As a texter, click on the corner menu (should be a circle with the first letter of the first name of a user). Click on the name/email and edit.

### Texting people in different Timezones

### Copying Campaigns

### Editing Campaigns

### Creating New Users
