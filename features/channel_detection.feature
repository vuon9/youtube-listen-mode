Feature: Scoped Channel Name Detection
  As a YouTube user
  I want the channel name to be detected from the video owner area only
  So that sidebar or search page channel names are not picked up

  Background:
    Given the page has channel name elements

  Scenario: Picks video owner channel over sidebar channels
    Given "#owner" contains channel "Rick Astley"
    And a non-owner channel "Deep Horizon" also exists
    When I get the channel name
    Then the detected channel should be "Rick Astley"

  Scenario: Returns null when no video is loaded
    Given there is no "#owner" element
    When I get the channel name
    Then the detected channel should be "null"

  Scenario: Falls back to bare selector when #owner is empty
    Given "#owner" contains no channel name
    And a non-owner channel "Fallback Channel" exists
    When I get the channel name
    Then the detected channel should be "Fallback Channel"
