Feature: Maintenance Logging and Service Planning
  As a cyclist, I want to record my maintenance history and plan future services
  so that I can maintain a high resale value for my bikes and ensure safety.

  # --- Section 1: Core Logging ---

  Scenario: Recording a single maintenance task for the active bike
    Given the user has a "Main Bike" selected as the active bike
    When they enter "Chain Lube" as the service type and "0.00" as the cost
    And they click "Add to Service History"
    Then the active bike's service history should be updated
    And the "Chain Lube" entry should appear at the top of the chronological list

  Scenario: Grouping multiple jobs into a single service event
    Given the user has an active bike selected
    When they create a service event "Spring Tune-up"
    And add "Brake Bleed" and "Tire Change" to the event
    And save the event
    Then a single event "Spring Tune-up" should be created in the history
    And it should contain both linked tasks

  # --- Section 2: Smart Planning & Checklists ---

  Scenario: Generating a proactive service plan
    Given the "Chain" is in "Red" status (overdue)
    And the "Tires" are in "Yellow" status (near interval
    And the "Brake Pads" are in "Green" status (healthy)
    When the user clicks "Create Service Plan"
    Then the resulting list should include the "Chain" and "Tires"
    And the list should not include the "Brake Pads"

  Scenario: Using the Annual Service Checklist
    Given the user wants to perform a yearly maintenance check
    When they select "Annual Service Check"
    Then the app should display a standard checklist of critical components (Drivetrain, Bearings, Cables, etc.)
    And the user should be able to mark each item as "Che

  # --- Section 3: Financial Truth & History ---

  Scenario: Recording costs and maintaining currency trut
    Given the user's preferred currency is "EUR"
    When they log a service that cost "$50 USD"
    Then the system should store the original value as "$50 USD"
    And the total expenditure dashboard should display th

  # --- Section 4: Safety Nets (The "Negative Paths") ---

  Scenario: Prevent logging without a selected bike
    Given the user has no bikes in their garage (or no bike selected)
    When they attempt to add a service log
    Then the system should block the submission
    And display a warning: "Please select a bike first be

  Scenario: Prevent impossible input data
    Given the user is filling out a service log
    When they enter a date in the future or a negative co
    Then the system should prevent the save
    And display a validation error: "Invalid date or cost