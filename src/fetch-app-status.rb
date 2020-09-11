require 'spaceship'
require 'json'

def getVersionInfo(app)
  latestVersionInfo = app.get_latest_app_store_version(platform: Spaceship::ConnectAPI::Platform::IOS)
	version = Hash.new

	if latestVersionInfo
		icon_url = latestVersionInfo.store_icon["templateUrl"]
		icon_url["{w}"] = "340"
		icon_url["{h}"] = "340"
		icon_url["{f}"] = "png"
		version["app_version"] = {
			"name" => app.name,
			"version" => latestVersionInfo.version_string,
			"status" => latestVersionInfo.app_store_state.gsub("_", " ").capitalize, # Replace with Spaceship mapping, when it's available
			"appId" => app.id,
			"iconUrl" => icon_url
		}
	end

	return version
end

def getAppVersionFrom(bundle_id)
	versions = []

	# All apps
	apps = []
	if (bundle_id)
		app = Spaceship::ConnectAPI::App.find(bundle_id)
		apps.push(app)
	else
		apps = Spaceship::ConnectAPI::App.all
	end

	for app in apps do
		version = getVersionInfo(app)
		versions.push(version)
	end
	return versions
end

# Constants
itc_username = ENV['ITC_USERNAME']
itc_password = ENV['ITC_PASSWORD']
# Split team_id
itc_team_id_array = ENV['ITC_TEAM_IDS'].to_s.split(",")
bundle_id = ENV['BUNDLE_IDENTIFIER']

if (!itc_username)
	puts "did not find username"
	exit
end

Spaceship::ConnectAPI.login(itc_username, itc_password)
# All json data
versions = []

# Add for the team_ids
# Test if itc_team doesnt exists
unless(itc_team_id_array.length.zero?)
	for itc_team_id in itc_team_id_array
		if (itc_team_id)
			Spaceship::ConnectAPI.select_team(tunes_team_id: itc_team_id)
		end
		versions += getAppVersionFrom(bundle_id)
	end
else
	versions += getAppVersionFrom(bundle_id)
end

puts JSON.dump versions
