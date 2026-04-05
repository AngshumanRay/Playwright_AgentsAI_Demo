# 📋 Manual Test Cases — US-101: Login Functionality
> Generated: 2026-04-04 | Priority: High | Module: Authentication

## 📖 User Story
> As a registered user, I want to log in with my credentials, so that I can access the secure area of the application.

| Field | Value |
|-------|-------|
| Story ID | US-101 |
| Type | Web |
| Base URL | `https://the-internet.herokuapp.com` |
| Page Path | `/login` |

---

## 🧪 US-101.AC-1: Successful login with valid credentials
**Tags:** `Smoke`, `Regression`

### Scenario (BDD)

- **Given** The user is on the login page
- **When** The user enters a valid username
- **When** The user enters a valid password
- **When** The user clicks the Login button
- **Then** The user is redirected to the secure area
- **Then** A success flash message is displayed

### Test Steps
| Step | Action | Expected Result | Pass/Fail |
|:----:|--------|-----------------|:---------:|
| 1 | The user enters a valid username | The user is redirected to the secure area | ⬜ |
| 2 | The user enters a valid password | A success flash message is displayed | ⬜ |
| 3 | The user clicks the Login button | — | ⬜ |

### Test Data
> Data key: `US-101.AC-1` in `test-data/web-tests.yaml`

---

## 🧪 US-101.AC-2: Login fails with invalid password
**Tags:** `Regression`

### Scenario (BDD)

- **Given** The user is on the login page
- **When** The user enters a valid username
- **When** The user enters an invalid password
- **When** The user clicks the Login button
- **Then** An error flash message is displayed
- **Then** The user remains on the login page

### Test Steps
| Step | Action | Expected Result | Pass/Fail |
|:----:|--------|-----------------|:---------:|
| 1 | The user enters a valid username | An error flash message is displayed | ⬜ |
| 2 | The user enters an invalid password | The user remains on the login page | ⬜ |
| 3 | The user clicks the Login button | — | ⬜ |

### Test Data
> Data key: `US-101.AC-2` in `test-data/web-tests.yaml`

---

## 🧪 US-101.AC-3: Login fails with empty credentials
**Tags:** `Sanity`, `Regression`

### Scenario (BDD)

- **Given** The user is on the login page
- **When** The user leaves username and password empty
- **When** The user clicks the Login button
- **Then** An error flash message is displayed
- **Then** The user remains on the login page

### Test Steps
| Step | Action | Expected Result | Pass/Fail |
|:----:|--------|-----------------|:---------:|
| 1 | The user leaves username and password empty | An error flash message is displayed | ⬜ |
| 2 | The user clicks the Login button | The user remains on the login page | ⬜ |

### Test Data
> Data key: `US-101.AC-3` in `test-data/web-tests.yaml`

---