# frozen_string_literal: true

# Needed to load gems from Gemfile
require 'rubygems'
require 'bundler/setup'

require "spaceship"
require "json"

# Constants
def bundle_id
  ENV["BUNDLE_IDENTIFIER"]
end

def itc_username
  ENV["ITC_USERNAME"]
end

def itc_password
  ENV["ITC_PASSWORD"]
end

def spaceship_connect_api_key_id
  ENV["SPACESHIP_CONNECT_API_KEY_ID"]
end

def spaceship_connect_api_issuer_id
  ENV["SPACESHIP_CONNECT_API_ISSUER_ID"]
end

def spaceship_connect_api_key
  ENV["SPACESHIP_CONNECT_API_KEY"]
end

def uses_app_store_connect_auth_token
  !spaceship_connect_api_key_id.nil? && !spaceship_connect_api_issuer_id.nil? && !spaceship_connect_api_key.nil?
end

def uses_app_store_connect_auth_credentials
  !uses_app_store_connect_auth_token && !itc_username.nil?
end

def itc_team_id_array
  # Split team_id
  ENV["ITC_TEAM_IDS"].to_s.split(",")
end

unless uses_app_store_connect_auth_token || uses_app_store_connect_auth_credentials
  puts "Couldn't find valid authentication token or credentials."
  exit
end

def get_version_info(app)
  latest_version_info = app.get_latest_app_store_version(platform: Spaceship::ConnectAPI::Platform::IOS)
  # FIXME: Analyze how to read the store icon. See https://github.com/fastlane/fastlane/issues/17370 for more info.
  if uses_app_store_connect_auth_credentials
    icon_url = latest_version_info.store_icon["templateUrl"]
    icon_url["{w}"] = "340"
    icon_url["{h}"] = "340"
    icon_url["{f}"] = "png"
  end
  {
    "name" => app.name,
    "version" => latest_version_info.version_string,
    "status" => latest_version_info.app_store_state,
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

if uses_app_store_connect_auth_token
  # FIXME: This is a temporary setup. See https://github.com/fastlane/fastlane/pull/17369 for more info.
  Spaceship::ConnectAPI.token = Spaceship::ConnectAPI::Token.create(key_id: spaceship_connect_api_key_id, issuer_id: spaceship_connect_api_issuer_id, key: spaceship_connect_api_key)
  # Should be replaced with this once the PR above is merged:
  # Spaceship::ConnectAPI.auth(key_id: spaceship_connect_api_key_id, issuer_id: spaceship_connect_api_issuer_id, key: spaceship_connect_api_key)
else
  Spaceship::ConnectAPI.login(itc_username, itc_password)
end

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
