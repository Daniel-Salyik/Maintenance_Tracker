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

  Scenario: Registration fails with an already-registered email
    Given a registered user exists with email "duplicate@example.com" and password "SecurePass123"
    When a new user provides a valid email "duplicate@example.com" and a strong password
    And they submit the registration form
    Then they should see a registration error message "Email already in use"
    And no new account should be created in the database

  Scenario: Registration fails with an invalid email format
    Given a new user provides an invalid email "not-an-email" and a strong password
    When they submit the registration form
    Then they should see a registration error message "Invalid email format"
    And no new account should be created in the database

  Scenario: Registration fails with a weak password
    Given a new user provides a valid email "weakpass@example.com" and a weak password "123"
    When they submit the registration form
    Then they should see a registration error message "Password does not meet strength requirements"
    And no new account should be created in the database

  Scenario: Login fails with a non-existent email
    Given no registered user exists with email "ghost@example.com"
    When the user enters "ghost@example.com" and "AnyPassword123" on the login page
    And clicks the "Login" button
    Then they should see an error message "Invalid email or password"
    And they should remain on the login page

  # --- Section 2: OAuth Integration (Phase 2 - deferred, see SPECIFICATION.md 2.1/2.6) ---

  @phase2
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

  Scenario: Rejecting an invalid distance unit
    Given a logged-in user whose distance unit is set to "Kilometers"
    When the user changes their distance preference to "Parsecs" in settings
    Then they should see a preferences error message "Invalid distance unit"
    And the "distance unit" preference should remain unchanged

  Scenario: Rejecting an invalid currency code
    Given a logged-in user whose currency is set to "USD"
    When the user changes their currency preference to "XYZ" in settings
    Then they should see a preferences error message "Invalid currency code"
    And the "currency" preference should remain unchanged

  Scenario: Preferences update requires authentication
    Given a logged-in user whose distance unit is set to "Kilometers"
    When the user attempts to update preferences without authentication
    Then they should see an error message "Unauthorized"
    And the "distance unit" preference should remain unchanged

  Scenario: User cannot update another user's preferences
    Given User A has a bike named "Red Trek"
    And User B has a bike named "Blue Giant"
    When User B attempts to update User A's preferences directly
    Then the system should return a "403 Forbidden" or "Not Found" error
    And User A's preferences should remain unchanged

  Scenario: Partial preference update leaves other preference unchanged
    Given a logged-in user whose distance unit is set to "Miles"
    And their currency is set to "EUR"
    When the user changes their currency preference to "USD" in settings
    And saves the changes
    Then the "distance unit" preference should remain unchanged

  Scenario: Empty preference update is a no-op
    Given a logged-in user whose distance unit is set to "Kilometers"
    When the user submits an empty preferences update
    Then the "distance unit" preference should remain unchanged

  Scenario: New user gets default preferences on registration
    Given a new user provides a valid email "defaults@example.com" and a strong password
    When they submit the registration form
    Then their default distance unit should be "Kilometers" and currency should be "EUR"

  # --- Section 4: Security & Isolation ---

  Scenario: Strict data isolation between users
    Given User A has a bike named "Red Trek"
    And User B has a bike named "Blue Giant"
    When User B attempts to access the bike profile of "Red Trek" via a direct URL
    Then the system should return a "403 Forbidden" or "Not Found" error
    And User B should not be able to see any data belonging to User A
