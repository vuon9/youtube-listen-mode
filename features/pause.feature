Feature: Pause and play from the listen mode overlay
  Scenario Outline: Toggling playback from the overlay
    Given the video is <state>
    When I toggle playback
    Then the video should be <next>

    Examples:
      | state   | next    |
      | playing | paused  |
      | paused  | playing |

  Scenario Outline: Overlay glyph reflects the playback state
    When I set the overlay state to <state>
    Then the overlay should show the <glyph> icon

    Examples:
      | state   | glyph |
      | playing | pause |
      | paused  | play  |
