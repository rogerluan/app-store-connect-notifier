const moment = require("moment")
require("./string-utilities.js")

function postToSlack(appInfo, submissionStartDate) {
    const message = `The status of your app *${appInfo.name}* has been changed to *${appInfo.status.formatted()}*`
    const attachment = slackAttachment(appInfo, submissionStartDate)
    const webhook_url = process.env.BOT_SLACK_WEBHOOK_URL
    if (webhook_url) {
        postUsingWebhook(message, webhook_url, [attachment])
    } else {
        const channel = process.env.SLACK_CHANNEL_NAME || "#ios-app-updates"
        post(message, channel, [attachment])
    }
}

function postMessageToSlack(message) {
    const webhook_url = process.env.BOT_STATUS_SLACK_WEBHOOK_URL
    if (webhook_url) {
        postUsingWebhook(message, webhook_url, null)
    } else {
        const channel = process.env.BOT_STATUS_SLACK_CHANNEL_NAME
        if (!channel) {
            return
        }
        post(message, channel, null)
    }
}

function post(message, channel, attachments) {
    const { WebClient } = require("@slack/web-api")
    const client = new WebClient(process.env.BOT_API_TOKEN)
    const request = async() => {
        // Post a message to the channel, and await the result.
        // Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
        const result = await client.chat.postMessage({
            text: message,
            channel: channel,
            attachments: attachments,
            as_user: true,
        })
        console.log(`Successfully sent message ${result.ts} in conversation ${channel}`)
    }
    request()
}

function postUsingWebhook(message, webhook_url, attachments) {
    var body = {
        "text": message
    }

    if (attachments) {
        body["attachments"] = attachments
    }

    sendSlackMessage(webhook_url, body)
}

/**
 * Handles the actual sending request.
 * We're turning the https.request into a promise here for convenience
 * @param webhookURL
 * @param messageBody
 * @return {Promise}
 */
function sendSlackMessage(webhookURL, messageBody) {
    const https = require("https")
    // Make sure the incoming message body can be parsed into valid JSON
    try {
        messageBody = JSON.stringify(messageBody)
    } catch (e) {
        throw new Error("Failed to stringify messageBody", e)
    }

    // Promisify the https.request
    return new Promise((resolve, reject) => {
        const requestOptions = {
            method: "POST",
            header: {
                "Content-Type": "application/json"
            }
        }

        // Actual request
        const req = https.request(webhookURL, requestOptions, (res) => {
            let response = ""

            res.on("data", (d) => {
                response += d
            })

            // Response finished, resolve the promise with data
            res.on("end", () => {
                resolve(response)
            })
        })

        // There was an error, reject the promise
        req.on("error", (e) => {
            reject(e)
        })

        // Send the message body that we already parsed to JSON
        req.write(messageBody)
        req.end()
    })
}

function slackAttachment(appInfo, submissionStartDate) {
    const attachment = {
        "fallback": `The status of your app ${appInfo.name} has been changed to ${appInfo.status.formatted()}`,
        "color": colorForStatus(appInfo.status),
        "title": "App Store Connect",
        "author_name": appInfo.name,
        "author_icon": appInfo.iconUrl,
        "title_link": `https://appstoreconnect.apple.com/apps/${appInfo.appId}/appstore`,
        "fields": [
            {
                "title": "Version",
                "value": appInfo.version,
                "short": true
            },
            {
                "title": "Status",
                "value": appInfo.status.formatted(),
                "short": true
            }
        ],
        "footer": "App Store Connect",
        "footer_icon": "https://devimages.apple.com.edgekey.net/app-store/marketing/guidelines/images/app-store-icon.png",
        "ts": new Date().getTime() / 1000
    }

    // Set elapsed time since "Waiting For Review" start
    if (submissionStartDate && appInfo.status != "PREPARE_FOR_SUBMISSION" && appInfo.status != "WAITING_FOR_REVIEW") {
        const elapsedHours = moment().diff(moment(submissionStartDate), "hours")
        // FIXME: Commented out for now until we find a reliable way to implement "Elapsed Time".
        //        Right now, if the bot reboots in-between status checks in Heroku, the "waiting for review"
        //        start time will be lost, thus making the "Elapsed Time" shorter than it actually was.
        console.log(`Here's where we'd add 'Elapsed Time' (${elapsedHours} hours) to the attachment, but this feature has been temporarily disabled.`)
        // attachment["fields"].push({
        //     "title": "Elapsed Time",
        //     "value": `${elapsedHours} hours`,
        //     "short": true
        // })
    }
    return attachment
}

function colorForStatus(status) {
    const infoColor = "#8e8e8e"
    const warningColor = "#f4f124"
    const successColor1 = "#1eb6fc"
    const successColor2 = "#14ba40"
    const failureColor = "#e0143d"
    const colorMapping = {
        "PREPARE_FOR_SUBMISSION" : infoColor,
        "WAITING_FOR_REVIEW" : successColor1,
        "IN_REVIEW" : successColor1,
        "PENDING_CONTRACT" : warningColor,
        "WAITING_FOR_EXPORT_COMPLIANCE" : warningColor,
        "PENDING_DEVELOPER_RELEASE" : successColor2,
        "PROCESSING_FOR_APP_STORE" : successColor2,
        "PENDING_APPLE_RELEASE" : successColor2,
        "READY_FOR_SALE" : successColor2,
        "REJECTED" : failureColor,
        "METADATA_REJECTED" : failureColor,
        "REMOVED_FROM_SALE" : failureColor,
        "DEVELOPER_REJECTED" : failureColor,
        "DEVELOPER_REMOVED_FROM_SALE" : failureColor,
        "INVALID_BINARY" : failureColor
    }
    return colorMapping[status]
}

module.exports = {
    slack: postToSlack,
    slackMessage: postMessageToSlack
}
