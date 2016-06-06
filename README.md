# Installation/setup

After cloning, install necessary packages

```
meteor npm install

```

Run script to create settings file

```
./setup

```

Edit the newly created `private/settings.json` to add any API keys, etc.


# Running app

```
meteor --settings private/settings.json`
```

# Creating dummy data
To create dummy data, change refreshTestData in `private/settings.json` to `true` and refresh server (then change back to `false` or it'll recreate data every time any file changes.)
