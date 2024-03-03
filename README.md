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
  <img src="https://views.whatilearened.today/views/github/rogerluan/app-store-connect-notifier.svg"></br>
</div>

# Intro

App Store Connect Notifier is a node.js app that fetches your app and build info directly from App Store Connect and posts changes in Slack as a bot. Since App Store Connect doesn't provide event webhooks (yet), these scripts use polling with the help of _fastlane_'s [Spaceship](https://github.com/fastlane/fastlane/tree/master/spaceship).

# Preview

## App Status

![](docs/assets/preview-app-status.png)

## Build Status

Be notified when your builds are ready to be submitted!

![](docs/assets/preview-build-status.png)

# Set Up

There are 2 versions of this service: a self-hosted version and a SaaS version — [Statused](https://statused.com?ref=app-store-connect-notifier).

While the self-hosted version is free, it requires you to host and maintain its server yourself. The SaaS version is a paid service, but it's fully managed and has a lot more features, such as support for Android apps, and a web dashboard to manage multiple apps, workflows, Slack channels, notification preferences, and more.

## SaaS

You can use the SaaS version of this app, which evolved from this project, but eventually became a much more complete version of this simple tool. You can find out about it here:

<img width="400" alt="Statused Social Banner" src="https://statused.com/assets/social-banner.png">

Forget about _"When did release v2.1.3 go live again?"_ and _"Is the app ready to be tested yet?"_

Statused monitors App Store Connect and Google Play Store and sends you notifications about the status of your app release progress directly on Slack.

Learn more: [statused.com](https://statused.com?ref=app-store-connect-notifier)

## Self-hosted

If you prefer to host it yourself, you can follow the instructions below.

### Prerequisites

You will need a Slack Bot to post updates on your behalf to your Slack workspace.
If you still don't have one, check out this article on [how to create a bot for your workspace](https://slack.com/intl/en-br/help/articles/115005265703-Create-a-bot-for-your-workspace).

#### Method 1: Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

#### Method 2: Hosting Manually

##### Environment Variables

Be sure to set these to the appropriate values:

```bash
# Your App Store Connect username. Required when SPACESHIP_CONNECT_API_KEY is not used.
export ITC_USERNAME="username@example.email"

# Your App Store Connect password. Required if you're in a non-interactive environment. In interactive environments, it will ask for the password when executing and save it in Keychain.
export ITC_PASSWORD="your-app-store-connect-account-password"

# The [App Store Connect API key](https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api). Use this when on a non-interactive environment and you have 2FA set up. When using this, neither ITC_USERNAME or ITC_PASSWORD are used.
export SPACESHIP_CONNECT_API_KEY='-----BEGIN PRIVATE KEY-----
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxx
-----END PRIVATE KEY-----'

# The App Store Connect API Issuer ID. Required when SPACESHIP_CONNECT_API_KEY is used
export SPACESHIP_CONNECT_API_ISSUER_ID='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxxxx'

# The App Store Connect API Key ID. Required when SPACESHIP_CONNECT_API_KEY is used
export SPACESHIP_CONNECT_API_KEY_ID='xxxxxxxxxx'

# Optional: If you're in multiple teams, enter the IDs of your App Store Connect team here (comma separated).
export ITC_TEAM_IDS=132123123,456456456

# Comma-separated list of bundle identifiers of the apps you want these scripts to monitor. If this is not set, it will monitor all apps of your team.
export BUNDLE_IDENTIFIERS="com.apple.swift"

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

# How many builds do you want to track simultaneously? Defaults to 1, as you usually just want to track the latest build. Set to 0 if you're not interested in receiving status updates on the builds.
export NUMBER_OF_BUILDS=1
```

#### Method 3: Docker

Use environment variables similarly to Method 2

``` bash
docker run \
  -e SPACESHIP_CONNECT_API_KEY="$(cat api_key.p8)" \
  -e SPACESHIP_CONNECT_API_ISSUER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxxxx" \
  -e SPACESHIP_CONNECT_API_KEY_ID="xxxxxxxxxx" \
  -e BOT_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/XXXXXXXX/XXXXXXXX/XxxxXXXXXxxxxxxxxxxxx" \
  rogerluan/app-store-connect-notifier:latest
```

#### Method 4: Docker Compose

Use environment variables similarly to Method 2

``` yaml
services:
  app-store-connect-notifier:
    container_name: app-store-connect-notifier
    hostname: app-store-connect-notifier
    image: rogerluan/app-store-connect-notifier
    environment:
      SPACESHIP_CONNECT_API_KEY: |
        -----BEGIN PRIVATE KEY-----
        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        xxxxxxxxxxxxxx
        -----END PRIVATE KEY-----
      SPACESHIP_CONNECT_API_ISSUER_ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxxxx
      SPACESHIP_CONNECT_API_KEY_ID: xxxxxxxxxx
      BOT_SLACK_WEBHOOK_URL: https://hooks.slack.com/services/XXXXXXXX/XXXXXXXX/XxxxXXXXXxxxxxxxxxxxx
```

##### Install

```bash
bundle install
npm install
```

##### Store your App Store Connect password

You can use _fastlane_'s [CredentialsManager](https://github.com/fastlane/fastlane/tree/master/credentials_manager) to store your password. Enter this command and it will prompt you for your password:

```bash
bundle exec fastlane fastlane-credentials add --username itc_username@example.com
```

##### Using App Store Connect API

For more information on how to use `SPACESHIP_CONNECT_API_KEY`, `SPACESHIP_CONNECT_API_ISSUER_ID` and `SPACESHIP_CONNECT_API_KEY_ID` to skip 2FA authentication, check out [Apple Documentation](https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api) and [Using App Store Connect API on fastlane](https://docs.fastlane.tools/app-store-connect-api).

##### Running

```bash
npm start
```

Or you can use the [forever](https://github.com/foreverjs/forever) tool to keep it up indefinitely:

```base
forever start src/poll-itc.js
```

# Project Structure

## `fetch_app_status.rb`

Ruby script that uses [Spaceship](https://github.com/fastlane/fastlane/tree/master/spaceship) to connect to App Store Connect. It then stdouts a JSON blob with your app info.

## `poll-itc.js`

Node script to invoke the ruby script at certain intervals. It uses a key/value store to keep track of app status changes, and then invokes `post-update.js` once the status changes.

## `post-update.js`

Node script that uses Slack's node.js SDK to send a message as a bot. It also calculates the number of hours since submission.

# Troubleshooting

## Why does my app hosted on Heroku reboots all the time?

Heroku does something called _Dyno cycling_ [at least once a day](https://devcenter.heroku.com/articles/dynos#automatic-dyno-restarts), and you can't prevent that from happening, unfortunately. Rebooting is fine, actually, except that you will lose all your database of app statuses that you collected since the last reboot. This means that we can't add nice features such as tracking the delta time between status changes (reliably) without persisting the information using an external service.

# Vision

The long-term goal of this project is to retire itself once App Store Connect finally starts supporting webhooks.

Once the App Store Connect APIs support webhooks, if a 3rd party app is still needed to receive those webhooks and post to Slack (i.e. if Apple doesn't provide one), then this project will be updated to provide those features as well.

# Credits

This app is heavily based on [@erikvillegas](https://github.com/erikvillegas)'s [itunes-connect-slack](https://github.com/erikvillegas/itunes-connect-slack). Most of the credit goes to him for figuring out the integration between ruby and javascript.

# License

This project is open source and covered by a standard 2-clause BSD license. That means you have to mention **Roger Oba** as the original author of this code and reproduce the LICENSE text inside your app, repository, project or research paper.
