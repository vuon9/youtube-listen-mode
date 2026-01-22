# Testing Guide for YouTube Listen Mode

This project uses **Cucumber (Gherkin)** for unit testing. It allows you to write tests in plain English that are easy to understand and maintain.

## 1. Running Tests

To run the existing tests and see the coverage report:

```bash
npm test
```

This will run all feature files in the `features/` directory and show a table with code coverage.

## 2. How to Write a New Test

Tests are split into two parts: **Feature Files** (the "What") and **Step Definitions** (the "How").

### Step A: Create a Feature File
Create a new file in the `features/` folder with the `.feature` extension (e.g., `my_new_test.feature`).

Write your test in plain English:
```gherkin
Feature: My New Feature
  Scenario: Testing something new
    Given global auto-enable is "OFF"
    When I check the mode for "MyChannel"
    Then the mode should be "DISABLED"
```

### Step B: Add Step Definitions (If needed)
If you used new sentences in your feature file that don't exist yet, you need to add them to `features/step_definitions/steps.js`.

Example:
```javascript
Given('my new condition is {string}', function (value) {
  // Your logic here to set up the test state
});
```

## 3. Test Coverage

We use `nyc` to track which parts of the code are tested. After running `npm test`, you will see a summary.
- **% Stmts**: Percentage of code lines executed.
- **Uncovered Line #s**: Lines that are not yet covered by any test.

## 4. Why Gherkin?
It's designed to be readable by anyone, even if they don't know JavaScript. It keeps the "business logic" separate from the technical implementation.

Happy testing!
