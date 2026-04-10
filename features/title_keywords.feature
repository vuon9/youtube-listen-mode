Feature: Title Keyword Matching for Auto-Enable
  As a YouTube user
  I want Listen Mode to auto-enable based on video title keywords
  So that audio content like podcasts and music are handled automatically

  Background:
    Given global auto-enable is "OFF"

  Scenario: Title keyword triggers listen mode enable
    Given I have added "podcast" to title keywords
    When I check the mode for channel "RandomChannel" with title "Best Podcast Episode 123"
    Then the mode should be "ENABLED"

  Scenario: Regex pattern in title triggers enable
    Given I have added "/(Audio|Lyrics)/i" to title keywords
    When I check the mode for channel "RandomChannel" with title "Song Title (Audio)"
    Then the mode should be "ENABLED"

  Scenario: Title keyword does not match
    Given I have added "podcast" to title keywords
    When I check the mode for channel "RandomChannel" with title "Tutorial: How to Code"
    Then the mode should be "DISABLED"

  Scenario: Channel match takes precedence over title match reason
    Given "Lofi Girl" is in the "Always Enable" list
    And I have added "podcast" to title keywords
    When I check the mode for channel "Lofi Girl" with title "Best Podcast Episode"
    Then the mode should be "ENABLED"

  Scenario: Disable list overrides title match
    Given "Marques Brownlee" is in the "Always Disable" list
    And I have added "podcast" to title keywords
    When I check the mode for channel "Marques Brownlee" with title "WVFRM Podcast Episode"
    Then the mode should be "DISABLED"

  Scenario: Channel OR title match enables listen mode
    Given I have added "podcast" to title keywords
    And "Lofi Girl" is in the "Always Enable" list
    When I check the mode for channel "Lofi Girl" with title "Ambient Stream"
    Then the mode should be "ENABLED"
