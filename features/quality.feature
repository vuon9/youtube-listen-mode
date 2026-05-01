Feature: Video Quality Control
  Scenario: Setting lowest quality when enabled
    Given Listen Mode is being enabled
    Then the video quality should be set to "tiny"

  Scenario: Restoring quality when disabled (no previous quality recorded)
    Given Listen Mode is being disabled
    Then the video quality should be set to "hd720"

  Scenario: Restoring original quality when disabled
    Given original video quality was "hd720"
    And Listen Mode is being enabled
    When Listen Mode is being disabled
    Then the video quality should be restored to "hd720"

  Scenario: Quality is restored when listen mode should be disabled even if never active
    Given listen mode has never been active on this page
    When listen mode should be disabled
    Then the video quality should be restored to "hd720"

  Scenario: Quality is always set to tiny when listen mode enables
    Given Listen Mode is being enabled
    Then the video quality should be set to "tiny"
