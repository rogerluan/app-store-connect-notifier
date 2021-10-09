<div align="center">
  <img width=100 src="docs/assets/app-icon.png">
  <h1>App Store Connect Notifier</h1>
  <p><strong>Get those App Store Connect notifications delivered directly to Slack.</strong></p>
  <a href="https://github.com/rogerluan/app-store-connect-notifier/releases">
    <img alt="Latest Release" src="https://img.shields.io/github/v/release/rogerluan/app-store-connect-notifier?sort=semver">
  </a>
  <a href="https://github.com/rogerluan/app-store-connect-notifier/actions?query=workflow%3A%22Build%20%26%20Lint%22">
    <img alt="Build Status" src="https://github.com/rogerluan/app-store-connect-notifier/workflows/Build%20%26%20Lint/badge.svg">
  </a>
  <a href="https://github.com/rogerluan/app-store-connect-notifier/issues">
    <img alt="Issues" src="https://img.shields.io/github/issues/rogerluan/app-store-connect-notifier?color=#86D492" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=rogerluan_">
    <img src="https://img.shields.io/twitter/follow/rogerluan_?&logo=twitter" alt="Follow on Twitter">
  </a>

  <p align="center">
    <a href="#preview">View Demo</a>
    ·
    <a href="https://github.com/rogerluan/app-store-connect-notifier/issues/new/choose">Report Bug</a>
    ·
    <a href="https://github.com/rogerluan/app-store-connect-notifier/issues/new/choose">Request Feature</a>
  </p>
</div>

# Intro

App Store Connect Notifier is a node.js app fetches your app info directly from App Store Connect and posts changes in Slack as a bot. Since App Store Connect doesn't provide event webhooks (yet), these scripts use polling with the help of _fastlane_'s [Spaceship](https://github.com/fastlane/fastlane/tree/master/spaceship).

# Preview

![](docs/assets/preview.png)

# Set Up

## Prerequisites

You will need a Slack Bot to post updates on your behalf to your Slack workspace.
If you still don't have one, check out this article on [how to create a bot for your workspace](https://slack.com/intl/en-br/help/articles/115005265703-Create-a-bot-for-your-workspace).

### Method 1: Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Method 2: Hosting Manually

#### Environment Variables

Be sure to set these to the appropriate values:

```bash
# Your App Store Connect username. Required.
export ITC_USERNAME="username@example.email"

# Your App Store Connect password. Required if you're in a non-interactive environment. In interactive environments, it will ask for the password when executing and save it in Keychain.
export ITC_PASSWORD="your-app-store-connect-account-password"

# Optional: If you're in multiple teams, enter the IDs of your App Store Connect team here (comma separated).
export ITC_TEAM_IDS=132123123,456456456

# The bundle identifier of the app you want these scripts to monitor the status. Required.
export BUNDLE_IDENTIFIER="com.apple.swift"

# Specify the channel you'd like the bot to post App Store Connect status updates. Don't forget to add the bot to this channel in Slack so it can post there. Required when BOT_SLACK_WEBHOOK_URL is not set.
export SLACK_CHANNEL_NAME="#ios-app-updates"

# Optional: Specify the channel you'd like the bot to post its uptime updates. Don't forget to add the bot to this channel in Slack so it can post there. If not provided, it won't post status updates. Not used when BOT_STATUS_SLACK_WEBHOOK_URL is set
export BOT_STATUS_SLACK_CHANNEL_NAME="#ios-bot-status-updates"

# The API token for your bot, provided by Slack. Required when BOT_SLACK_WEBHOOK_URL is not set.
export BOT_API_TOKEN="xoxb-123123123123-ASDASDASDASD-FGHFGHFGHFGH"

# The incoming webhook URL provided by Slack for your channel. When using this, SLACK_CHANNEL_NAME and BOT_API_TOKEN are not used.
export BOT_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/XXXXXXXX/XXXXXXXX/XxxxXXXXXxxxxxxxxxxxx"

# Optional: Specify the incoming webhook URL for the channel you'd like the bot to post its uptime updates. When using this, BOT_STATUS_SLACK_CHANNEL_NAME is not used.
export BOT_STATUS_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/XXXXXXXX/XXXXXXXX/XxxxXXXXXxxxxxxxxxxxx"

# How often the script should check for updates (in seconds). Required.
export POLL_TIME_IN_SECONDS=120
```

#### Install

```bash
bundle install
npm install
```

#### Store your App Store Connect password

You can use _fastlane_'s [CredentialsManager](https://github.com/fastlane/fastlane/tree/master/credentials_manager) to store your password. Enter this command and it will prompt you for your password:

```bash
bundle exec fastlane fastlane-credentials add --username itc_username@example.com
```

#### Running

```bash
npm start
```

Or you can use the [forever](https://github.com/foreverjs/forever) tool to keep it up indefinitely:

```base
forever start src/poll-itc.js
```

# Project Structure

### fetch_app_status.rb
Ruby script that uses [Spaceship](https://github.com/fastlane/fastlane/tree/master/spaceship) to connect to App Store Connect. It then stdouts a JSON blob with your app info.

### poll-itc.js
Node script to invoke the ruby script at certain intervals. It uses a key/value store to keep track of app status changes, and then invokes `post-update.js` once the status changes.

### post-update.js
Node script that uses Slack's node.js SDK to send a message as a bot. It also calculates the number of hours since submission.

# Troubleshooting

#### Why does my app hosted on Heroku reboots all the time?

Heroku does something called _Dyno cycling_ [at least once a day](https://devcenter.heroku.com/articles/dynos#automatic-dyno-restarts), and you can't prevent that from happening, unfortunately. Rebooting is fine, actually, except that you will lose all your database of app statuses that you collected since the last reboot. This means that we can't add nice features such as tracking the delta time between status changes (reliably) without persisting the information using an external service.

# Vision

The long-term goal of this project is to retire itself once App Store Connect finally starts supporting webhooks.

Once the App Store Connect APIs support webhooks, if a 3rd party app is still needed to receive those webhooks and post to Slack (i.e. if Apple doesn't provide one), then this project will be updated to provide those features as well.

# Credits

This app is heavily based on [@erikvillegas](https://github.com/erikvillegas)'s [itunes-connect-slack](https://github.com/erikvillegas/itunes-connect-slack). Most of the credit goes to him for figuring out the integration between ruby and javascript.

# License

This project is open source and covered by a standard 2-clause BSD license. That means you have to mention *Roger Oba* as the original author of this code and reproduce the LICENSE text inside your app, repository, project or research paper.
