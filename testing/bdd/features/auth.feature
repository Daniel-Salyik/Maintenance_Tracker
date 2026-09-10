Feature: User Authentication and Profile Management
  As a cyclist, I want to securely manage my account and preferences
  so that my bike data remains private and the app displays information in my preferred units.

  # --- Section 1: Standard Authentication ---

  Scenario: Successful login with email and password
    Given a registered user exists with email "cyclist@example.com" and password "SecurePass123"
    When the user enters "cyclist@example.com" and "SecurePass123" on the login page
    And clicks the "Login" button
    Then they should be redirected to the dashboard
    And they should see a welcome message "Welcome back!"

  Scenario: Failed login with incorrect credentials
    Given a registered user exists with email "cyclist@example.com" and password "SecurePass123"
    When the user enters "cyclist@example.com" and "WrongPassword" on the login page
    And clicks the "Login" button
    Then they should see an error message "Invalid email or password"
    And they should remain on the login page

  Scenario: New user account creation
    Given a new user provides a valid email "newuser@example.com" and a strong password
    When they submit the registration form
    Then a new account should be created in the database
    And they should be automatically logged in and redirected to the bike setup wizard

  # --- Section 2: OAuth Integration ---

  Scenario: Successful authentication via Strava
    Given a user has a valid Strava account
    When the user clicks "Login with Strava"
    And authorizes the application through the Strava OAuth portal
    Then they should be redirected to the app dashboard
    And their Strava profile information should be linked to their app account

  # --- Section 3: User Preferences ---

  Scenario: Updating distance unit preference
    Given a logged-in user whose distance unit is set to "Kilometers"
    When the user changes their distance preference to "Miles" in settings
    And saves the changes
    Then all distances on the dashboard should be displayed in "Miles"
    And the preference should be persisted in the database

  Scenario: Updating currency preference
    Given a logged-in user whose currency is set to "USD"
    When the user changes their currency preference to "EUR" in settings
    And saves the changes
    Then all financial costs and totals should be displayed in "EUR"
    And the preference should be persisted in the database

  # --- Section 4: Security & Isolation ---

  Scenario: Strict data isolation between users
    Given User A has a bike named "Red Trek"
    And User B has a bike named "Blue Giant"
    When User B attempts to access the bike profile of "Red Trek" via a direct URL
    Then the system should return a "403 Forbidden" or "Not Found" error
    And User B should not be able to see any data belonging to User A
