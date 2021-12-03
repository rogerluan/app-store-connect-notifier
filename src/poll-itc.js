require("./string-utilities.js")
const poster = require("./post-update.js")
const dirty = require("dirty")
const db = dirty("kvstore.db")
const debug = false
var pollIntervalSeconds = process.env.POLL_TIME_IN_SECONDS

function checkAppStatus() {
    console.log("Fetching latest app status...")
    // Invoke ruby script to grab latest app status
    const exec = require("child_process").exec
    exec("ruby src/fetch_app_status.rb", function(err, stdout, stderr) {
        if (stdout) {
            console.log(stdout)
            // Compare new app info with last one (from database)
            if (stdout.includes("Couldn't find valid authentication token or credentials.")) {
                console.log("Did you forget to set the correct Environment Variables?")
                console.log("Exiting.")
                process.exit(1)
            } else if (stdout.includes("Available session is not valid any more. Continuing with normal login.")) {
                console.log("We need to retry.")
                checkAppStatus()
                return
            }
            const versions = JSON.parse(stdout)
            for (let version of versions) {
                _checkAppStatus(version)
            }
        } else {
            console.log("There was a problem fetching the status of the app!")
            console.log(stderr)
        }
    })
}

function _checkAppStatus(currentAppInfo) {
    // Use the live version if edit version is unavailable
    const appInfoKey = "appInfo-" + currentAppInfo.appId
    const buildInfoKey = "builds-appInfo-" + currentAppInfo.appId
    const submissionStartkey = "submissionStart" + currentAppInfo.appId
    const lastAppInfo = db.get(appInfoKey)
    const lastBuildInfo = db.get(buildInfoKey) || {}

    if (!lastAppInfo || lastAppInfo.status != currentAppInfo.status || debug) {
        if (!lastAppInfo) {
            poster.slackMessage("App Store Connect Notifier Bot has just restarted.")
        } else {
            poster.slackApp(currentAppInfo, db.get(submissionStartkey))
        }
        // Store submission start time
        if (currentAppInfo.status == "WAITING_FOR_REVIEW") {
            db.set(submissionStartkey, new Date())
        }
    } else if (currentAppInfo) {
        console.log(`Current status "${currentAppInfo.status}" matches previous status. AppName: "${currentAppInfo.name}"`)
    } else {
        console.log("Could not fetch app status")
    }

    // Store latest app info in database
    db.set(appInfoKey, currentAppInfo)

    const buildChange = lastAppInfo && JSON.stringify(lastAppInfo.builds) != JSON.stringify(currentAppInfo.builds)
    if (lastAppInfo && buildChange) {
        const builds = currentAppInfo.builds
        const newBuildInfo = {}

        builds.forEach((buildInfo) => {
            const oldBuildInfo = lastBuildInfo[buildInfo.version]
            if (!oldBuildInfo) {
                poster.slackBuild(currentAppInfo, buildInfo)
                newBuildInfo[buildInfo.version] = buildInfo
            } else if (oldBuildInfo.status != buildInfo.status) {
                poster.slackBuild(currentAppInfo, buildInfo)
                newBuildInfo[buildInfo.version] = buildInfo
            } else {
                console.log("No build change detected.")
            }
        })

        // Store latest build info in database
        db.set(buildInfoKey, newBuildInfo)
    }
}

if (!pollIntervalSeconds) {
    pollIntervalSeconds = 60 * 2
}

setInterval(checkAppStatus, pollIntervalSeconds * 1000)
checkAppStatus()
