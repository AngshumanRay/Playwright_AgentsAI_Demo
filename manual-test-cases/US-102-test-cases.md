# 📋 Manual Test Cases — US-102: Blog Posts API
> Generated: 2026-04-04 | Priority: High | Module: Content Management

## 📖 User Story
> As an API consumer, I want to retrieve and create blog posts via REST API, so that the frontend can display and manage content.

| Field | Value |
|-------|-------|
| Story ID | US-102 |
| Type | API |
| Base URL | `https://jsonplaceholder.typicode.com` |
| Page Path | `/posts` |

---

## 🧪 US-102.AC-1: GET single post returns valid response
**Tags:** `Smoke`, `Regression`

### Scenario (BDD)

- **Given** The API server is accessible
- **Given** A blog post with ID 1 exists
- **When** A GET request is sent to /posts/1
- **Then** The response status is 200
- **Then** The response body contains id, userId, title, and body fields

### Test Steps
| Step | Action | Expected Result | Pass/Fail |
|:----:|--------|-----------------|:---------:|
| 1 | A GET request is sent to /posts/1 | The response status is 200 | ⬜ |
| 2 | Verify | The response body contains id, userId, title, and body fields | ⬜ |

### Test Data
> Data key: `US-102.AC-1` in `test-data/api-tests.yaml`

---

## 🧪 US-102.AC-2: POST creates a new blog post
**Tags:** `Regression`

### Scenario (BDD)

- **Given** The API server is accessible
- **When** A POST request is sent to /posts with title, body, and userId
- **Then** The response status is 201
- **Then** The response body contains the submitted data with a new id

### Test Steps
| Step | Action | Expected Result | Pass/Fail |
|:----:|--------|-----------------|:---------:|
| 1 | A POST request is sent to /posts with title, body, and userId | The response status is 201 | ⬜ |
| 2 | Verify | The response body contains the submitted data with a new id | ⬜ |

### Test Data
> Data key: `US-102.AC-2` in `test-data/api-tests.yaml`

---

## 🧪 US-102.AC-3: GET user profile returns nested fields
**Tags:** `Sanity`, `Regression`

### Scenario (BDD)

- **Given** The API server is accessible
- **Given** A user with ID 1 exists
- **When** A GET request is sent to /users/1
- **Then** The response status is 200
- **Then** The response body contains name, email, address, and company objects

### Test Steps
| Step | Action | Expected Result | Pass/Fail |
|:----:|--------|-----------------|:---------:|
| 1 | A GET request is sent to /users/1 | The response status is 200 | ⬜ |
| 2 | Verify | The response body contains name, email, address, and company objects | ⬜ |

### Test Data
> Data key: `US-102.AC-3` in `test-data/api-tests.yaml`

---