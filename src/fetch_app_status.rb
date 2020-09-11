# frozen_string_literal: true

require "spaceship"
require "json"

def get_version_info(app)
  latest_version_info = app.get_latest_app_store_version(platform: Spaceship::ConnectAPI::Platform::IOS)
  icon_url = latest_version_info.store_icon["templateUrl"]
  icon_url["{w}"] = "340"
  icon_url["{h}"] = "340"
  icon_url["{f}"] = "png"
  {
    "name" => app.name,
    "version" => latest_version_info.version_string,
    "status" => latest_version_info.app_store_state.gsub("_", " ").capitalize, # Replace with Spaceship map to copy when available
    "appId" => app.id,
    "iconUrl" => icon_url,
  }
end

def get_app_version_from(bundle_id)
  apps = []
  if bundle_id
    apps.push(Spaceship::ConnectAPI::App.find(bundle_id))
  else
    apps = Spaceship::ConnectAPI::App.all
  end
  apps.map { |app| get_version_info(app) }
end

# Constants
itc_username = ENV["ITC_USERNAME"]
itc_password = ENV["ITC_PASSWORD"]
# Split team_id
itc_team_id_array = ENV["ITC_TEAM_IDS"].to_s.split(",")
bundle_id = ENV["BUNDLE_IDENTIFIER"]

unless itc_username
  puts "did not find username"
  exit
end

Spaceship::ConnectAPI.login(itc_username, itc_password)
# All json data
versions = []

# Add for the team_ids
# Test if itc_team doesnt exists
if itc_team_id_array.length.zero?
  versions += get_app_version_from(bundle_id)
else
  itc_team_id_array.each do |itc_team_id|
    Spaceship::ConnectAPI.select_team(tunes_team_id: itc_team_id) if itc_team_id
    versions += get_app_version_from(bundle_id)
  end
end

puts JSON.dump versions
