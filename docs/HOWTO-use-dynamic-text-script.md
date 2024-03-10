# Dynamic Text Script

Sometimes, we want to send unique and dynamic text messages to our all of our contacts.  This functionality exists within Spoke, and I will guide you on how to use it in a dev environment.


## Enabling contact loader for dev environment
- Ensure that you have CONTACT_LOADERS in your .env file and set the value to `csv-upload`
- type `yarn dev` and get your local instance working.  
- If you have trouble, reference the [Local Development documentation.](https://github.com/StateVoicesNational/Spoke/blob/main/docs/HOWTO_DEVELOPMENT_LOCAL_SETUP.md)


## CSV Upload
- Please refer to the document `female_scientists_external_ids_check.csv` located in `__test__/test_data/`
- You'll notice that this document has three custom fields added to about 20 contacts.  
- You can change the additional columns to any header-title you desire
- For this example, we have the contacts favorite color, home state, and lucky flower to remind them to vote!
- Once you have logged in, created your organization, you'll want to click the "CREATE NEW CAMPAIGN" button
- When uploading your csv document, make sure that your custom fields have loaded, in our test case it's color, state, and flower.

![Confirmation Image](https://i.ibb.co/T8G9MQh/confirmation-of-custom-fields.png)

- Add yourself as a texter, and click `Split assignments` toggle. Click save.

- Now that you've confirmed your custom fields are loaded, the magic comes in on the `Interactions`
- Click `Script` under `Start` and wait for the pop-up screen.

![pop-up-screen](https://i.ibb.co/khPNym4/pop-up-screen.png)

- Under `Total characters` copy+paste the text below and save.  Once the headers are green, scroll to the top and click `START THIS CAMPAIGN!`

```
Hello {firstName},
Your favorite color is {color}
Your home state is {state}
And your lucky flower is {flower}
Don't forget to vote!
```

## Sending the Dynamic Text!
- Click on `Switch to texter`
- Click on `SEND FIRST TEXTS`
- Notice howthere is now information where there was {header titles} in brackets.
- When you click send, notice how those parts of the text are auto-compiled into the initial text.

![dynamic script in action](https://i.ibb.co/Tkp5Pf8/evidence-of-dynamic-script-text-in-action.png)





