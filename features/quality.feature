Feature: Video Quality Control
  Scenario: Setting lowest quality when enabled
    Given Listen Mode is being enabled
    Then the video quality should be set to "tiny"

  Scenario: Restoring quality when disabled
    Given Listen Mode is being disabled
    Then the video quality should be set to "default"

  Scenario: Restoring original quality when disabled
    Given original video quality was "hd720"
    And Listen Mode is being enabled
    When Listen Mode is being disabled
    Then the video quality should be restored to "hd720"
