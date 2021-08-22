## CiviCRM Integration

This documentation provides a detailed description to integrate Spoke instance with CiviCRM instance.  CiviCRM and Spoke development environments are prerequisite for this. if you don’t have it yet, please check the link below:

- CiviCRM buildkit: https://docs.civicrm.org/dev/en/latest/tools/buildkit
- Spoke: https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_DEVELOPMENT_LOCAL_SETUP.md 

#### Configure Spoke env vars

To connect with CiviCRM you should include CIVICRM_API_KEY, CIVICRM_SITE_KEY, CIVICRM_DOMAIN in the .env file:

- CIVICRM_API_KEY: API Key is the API of a contact/user in your CiviCRM installation, More info [here](https://docs.civicrm.org/sysadmin/en/latest/setup/api-keys).
- CIVICRM_SITE_KEY: SITE key can be found in your CiviCRM's civicrm.settings.php file.
- CIVICRM_DOMAIN: CIVICRM_DOMAIN is the full URL of the CiviCRM API interface. You can get it from the CiviCRM dashboard > Help > Developer > API Explorer. 
 
#### CiviCRM contact loader

This extension helps to load contact from CiviCRM instance to Spoke instance. These are the step should be followed:

1. Get the civicrm contact loader folder from [here](https://www.google.com/url?q=https://lab.civicrm.org/asha/spoke-integration/-/tree/master/src/extensions/contact-loaders/civicrm&sa=D&source=editors&ust=1629657691875000&usg=AOvVaw2xEFAQqyN54_R46Vyuga5R) and paste inside spoke/src/extensions/contact-loaders folder. 
2. Enable the contact loader by adding ‘civicrm’ for CONTACT_LOADERS in the .env file. 

   Example: CONTACT_LOADERS=csv-upload,test-fakedata,civicrm
 
3. Run ‘Yarn dev’ to start the development. 
4. Go to Spoke from the web browser and create a new campaign.
5. Under the contact’s contact load method section select ‘CiviCRM’.
   ![contact_loader](/uploads/35de81ca1ab40c60123abca0a76d2643/contact_loader.png)
6. Type the group name you want to retrieve and click ‘SAVE AND GOTO NEXT SECTION’.
   ![contact_loader2](/uploads/d1c330f30acf851dcd4bd1b2542e7383/contact_loader2.png)
   
#### Do Not SMS Action Handler

During the conversation if a user requested not to SMS, as a respect of their preference we can use this action handler to note it in the civicrm database. These are the steps should needs to follow:

1. Get the civicrm action handler and place it inside the spoke/src/extensions/action-handlers folder.
2. Enable the action handler by adding ‘civicrm’ for ACTION_HANDLERS in the .env file. 

   Example :  ACTION_HANDLERS=test-action,complex-test-action,civicrm
   
3. Click the interaction section and create a script and a question.
4. Click ‘Add A RESPONSE’ and type the user response that you intend to select do not sms action handler.
5. Click ‘Action handler’ and select ‘civicrm’.
   ![action_handler](/uploads/4c59f927f341c40021e79fa3f00302eb/action_handler.png)
6. Under the ‘Answer Action Data’ select ‘Do Not SMS’.
   ![action_handler2](/uploads/6c6dc45107eca1ee4642de57097e6eab/action_handler2.png)
7. Click ‘SAVE AND GOTO NEXT SECTION’.

#### Wrong Number Action Handler 

If a user says the number is incorrect in the conversation, then it can be saved in the CiviCRM database using this action handler. 

1. Get the civicrm action handler and place it inside the spoke/src/extensions/action-handlers folder.
2. Enable the action handler by adding ‘civicrm’ for ACTION_HANDLERS in the .env file. 

   Example :  ACTION_HANDLERS=test-action,complex-test-action,civicrm

3. Click the interaction section and create a script and a question.
4. Click ‘Add A RESPONSE’ and type the user response that you intend to select wrong number action handler.
5. Click ‘Action handler’ and select ‘civicrm’.
6. Under the ‘Answer Action Data’ select ‘Wrong Number’.
   ![action_handler3](/uploads/83636c7ff61045089ae456aa91803b85/action_handler3.png)
7. Click ‘SAVE AND GOTO NEXT SECTION’.
