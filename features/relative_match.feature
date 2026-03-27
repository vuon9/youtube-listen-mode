Feature: Substring Matching for Channel Names
  As a YouTube user
  I want Listen Mode to work with relative channel names
  So that collaborations and music channels are handled correctly

  Background:
    Given global auto-enable is "OFF"

  Scenario: Match a collaboration channel name
    Given "Trong N Nguyen" is in the "Always Enable" list
    When I check the mode for "Trong N Nguyen and 2 more"
    Then the mode should be "ENABLED"

  Scenario: Match a music channel with suffix
    Given " Official" is in the "Always Enable" list
    When I check the mode for "Artist Official"
    Then the mode should be "ENABLED"

  Scenario: Case insensitive substring match
    Given "official" is in the "Always Enable" list
    When I check the mode for "Artist OFFICIAL"
    Then the mode should be "ENABLED"

  Scenario: Match using Regex prefix
    Given "/^Artist/i" is in the "Always Enable" list
    When I check the mode for "Artist Official"
    Then the mode should be "ENABLED"

  Scenario: Match using Regex suffix
    Given "/Official$/i" is in the "Always Enable" list
    When I check the mode for "Artist Official"
    Then the mode should be "ENABLED"
    When I check the mode for "Official Artist"
    Then the mode should be "DISABLED"

  Scenario: Match music labels ending with Music, Records, or VEVO
    Given "/(Music|Records|VEVO)$/i" is in the "Always Enable" list
    When I check the mode for "Universal Music"
    Then the mode should be "ENABLED"
    When I check the mode for "Sony Records"
    Then the mode should be "ENABLED"
    When I check the mode for "Taylor Swift VEVO"
    Then the mode should be "ENABLED"
    When I check the mode for "Music Channel"
    Then the mode should be "DISABLED"

  Scenario: Invalid regex falls back to substring
    Given "/[invalid/" is in the "Always Enable" list
    When I check the mode for "Test /[invalid/"
    Then the mode should be "ENABLED"
