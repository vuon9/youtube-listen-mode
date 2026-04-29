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

  Scenario: Quality is restored when listen mode should be disabled even if never active
    Given listen mode has never been active on this page
    When listen mode should be disabled
    Then video quality should be restored to default

  Scenario: Quality is not changed when auto-switch is disabled
    Given auto-switch 144p is disabled
    When listen mode is enabled with auto-switch setting
    Then the video quality should not be changed

  Scenario: Quality is set to tiny when auto-switch is enabled
    Given auto-switch 144p is enabled
    When listen mode is enabled with auto-switch setting
    Then the video quality should be set to "tiny"
