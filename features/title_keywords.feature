Feature: Title Keyword Matching for Auto-Enable
  As a YouTube user
  I want Listen Mode to auto-enable based on video title keywords
  So that audio content like podcasts and music are handled automatically

  Background:
    Given global auto-enable is "OFF"

  Scenario: Keyword with matchTitle ON triggers on title
    Given I have added "podcast" to title keywords
    When I check the mode for channel "RandomChannel" with title "Best Podcast Episode 123"
    Then the mode should be "ENABLED"

  Scenario: Regex pattern with matchTitle ON triggers on title
    Given I have added "/(Audio|Lyrics)/i" to title keywords
    When I check the mode for channel "RandomChannel" with title "Song Title (Audio)"
    Then the mode should be "ENABLED"

  Scenario: Keyword with matchTitle OFF does not trigger on title
    Given I have added "podcast" as channel-only keyword
    When I check the mode for channel "RandomChannel" with title "Best Podcast Episode 123"
    Then the mode should be "DISABLED"

  Scenario: Keyword with matchTitle ON also matches channel name
    Given I have added "Lofi Girl" to title keywords
    When I check the mode for channel "Lofi Girl" with title "Ambient Stream"
    Then the mode should be "ENABLED"

  Scenario: Disable list overrides title match
    Given "Marques Brownlee" is in the "Always Disable" list
    And I have added "podcast" to title keywords
    When I check the mode for channel "Marques Brownlee" with title "WVFRM Podcast Episode"
    Then the mode should be "DISABLED"
