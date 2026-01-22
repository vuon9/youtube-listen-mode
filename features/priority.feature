Feature: Listen Mode Priority Logic
  As a YouTube user
  I want Listen Mode to follow specific priority rules
  So that I can force audio-only mode for my favorite channels

  Scenario: Global Auto-Enable takes precedence
    Given global auto-enable is "ON"
    And "ChannelA" is in the "Always Disable" list
    When I check the mode for "ChannelA"
    Then the mode should be "ENABLED"

  Scenario: Disable list overrides Enable list
    Given global auto-enable is "OFF"
    And "ChannelB" is in the "Always Disable" list
    And "ChannelB" is in the "Always Enable" list
    When I check the mode for "ChannelB"
    Then the mode should be "DISABLED"

  Scenario: Enable list works when not disabled
    Given global auto-enable is "OFF"
    And "ChannelC" is in the "Always Enable" list
    When I check the mode for "ChannelC"
    Then the mode should be "ENABLED"

  Scenario: Default to disabled if no rules match
    Given global auto-enable is "OFF"
    And "ChannelD" is not in any list
    When I check the mode for "ChannelD"
    Then the mode should be "DISABLED"

  Scenario Outline: Case insensitive matching
    Given global auto-enable is "OFF"
    And "<listed_channel>" is in the "<list_type>" list
    When I check the mode for "<target_channel>"
    Then the mode should be "<expected_mode>"

    Examples:
      | listed_channel | list_type      | target_channel | expected_mode |
      | MyChannel      | Always Disable | mychannel      | DISABLED      |
      | CoolCreator    | Always Enable  | COOLCREATOR    | ENABLED       |
