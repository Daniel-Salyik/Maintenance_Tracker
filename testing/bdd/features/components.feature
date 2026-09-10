Feature: Component Wear and Tear Tracking
  As a cyclist, I want to track the wear of my bike components
  so that I can replace parts before they fail and maintain peak performance.

  # --- Section 1: Component Setup ---

  Scenario: Adding a new component with a service interval
    Given a bike exists in the user's fleet
    When the user adds a component "Chain" with a service interval of "3000 km"
    And sets the starting mileage to "0 km"
    Then the component should be created with a status of "Green"
    And it should be categorized under "Drivetrain"

  Scenario: Adding a used component with existing wear
    Given a bike exists in the user's fleet
    When the user adds a component "Tires" with a service interval of "5000 km"
    And sets the starting mileage to "2000 km"
    Then the component status should be calculated based on the 2000 km starting point
    And it should start in the "Yellow" status (assuming 40% wear)

  # --- Section 2: Automatic Wear Progression ---

  Scenario: Status change from Green to Yellow
    Given a component "Chain" has a service interval of "3000 km" and current mileage of "0 km"
    When the bike's total mileage increases to "2000 km"
    Then the "Chain" status should automatically change to "Yellow"

  Scenario: Status change from Yellow to Red
    Given a component "Chain" has a service interval of "3000 km" and current mileage of "2000 km"
    When the bike's total mileage increases to "3100 km"
    Then the "Chain" status should automatically change to "Red"

  # --- Section 3: Manual Overrides ---

  Scenario: Manual override takes priority over automatic calculation
    Given a component "Chain" is calculated as "Green" based on mileage
    When the user manually sets the status to "Red" (e.g., via chain checker tool)
    Then the component status should be "Red"
    And the manual status should take priority over the automatic mileage calculation

  Scenario: Manual override persists after additional mileage
    Given a component "Chain" has been manually set to "Red"
    When the bike's total mileage increases by "100 km"
    Then the "Chain" status should remain "Red"
    And the system should not revert to "Green" just because the mileage is low

  # --- Section 4: Replacement Flow ---

  Scenario: Prompt and reset upon marking component as damaged
    Given a user is updating the status of a component
    When the user manually selects "Red" (Worn Out/Damaged)
    Then the system should display a prompt: "Did you replace this component?"
    And if the user selects "Yes"
    Then the component mileage should reset to "0 km"
    And the status should return to "Green"

  # --- Section 5: Domain Logic (Component Dependencies) ---

  Scenario: Drivetrain dependency warning upon chain replacement
    Given the "Chain" is in "Red" status
    And the "Cassette" is in "Yellow" or "Red" status
    When the user logs a replacement for the "Chain" only
    Then the system should display a warning: "Replacing a worn chain on a worn cassette may cause gear skipping."
    And the system should prompt the user: "Would you like to check the status of your Cassette and Chainrings?"
