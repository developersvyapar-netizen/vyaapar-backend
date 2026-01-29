#!/bin/bash

# ============================================
#     VYAAPAR BACKEND - COMPLETE API TEST
# ============================================
#
# This script tests all API endpoints
# 
# Usage:
#   chmod +x test-all-apis.sh
#   ./test-all-apis.sh
#
# Requirements:
#   - curl
#   - jq (for JSON parsing)
#   - Server running on localhost:3000
#
# ============================================

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASSED=0
FAILED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print section headers
print_header() {
  echo -e "\n${BLUE}============================================${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}============================================${NC}"
}

# Helper function to print test result
print_result() {
  local test_name=$1
  local expected_status=$2
  local actual_status=$3
  local response=$4

  if [ "$actual_status" -eq "$expected_status" ]; then
    echo -e "${GREEN}✅ PASS${NC} - $test_name (HTTP $actual_status)"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC} - $test_name (Expected: $expected_status, Got: $actual_status)"
    echo -e "${YELLOW}Response: $(echo $response | jq -c . 2>/dev/null || echo $response)${NC}"
    ((FAILED++))
  fi
}

# Check if server is running
echo -e "${YELLOW}Checking if server is running at $BASE_URL...${NC}"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null)
if [ "$HEALTH_CHECK" != "200" ]; then
  echo -e "${RED}ERROR: Server is not running at $BASE_URL${NC}"
  echo "Please start the server with: npm run dev"
  exit 1
fi
echo -e "${GREEN}Server is running!${NC}"

# ============================================
#               HEALTH CHECK
# ============================================
print_header "HEALTH CHECK API"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/health" 200 "$HTTP_CODE" "$BODY"

# ============================================
#            AUTHENTICATION API
# ============================================
print_header "AUTHENTICATION API"

# Test 1: Login as admin
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginId": "admin", "password": "admin123"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "POST /api/auth/login (admin)" 200 "$HTTP_CODE" "$BODY"
ADMIN_TOKEN=$(echo "$BODY" | jq -r '.data.token')

# Test 2: Login with invalid credentials
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginId": "admin", "password": "wrongpassword"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "POST /api/auth/login (invalid creds)" 401 "$HTTP_CODE" "$BODY"

# Test 3: Get current user profile
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/auth/me" 200 "$HTTP_CODE" "$BODY"

# Test 4: Get profile without token
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/auth/me")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/auth/me (no token)" 401 "$HTTP_CODE" "$BODY"

# Test 5: Create new user
RANDOM_ID=$(date +%s)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"loginId\": \"testuser$RANDOM_ID\",
    \"password\": \"password123\",
    \"role\": \"RETAILER\",
    \"email\": \"testuser$RANDOM_ID@example.com\"
  }")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "POST /api/auth/users (create user)" 201 "$HTTP_CODE" "$BODY"
NEW_USER_ID=$(echo "$BODY" | jq -r '.data.id')

# ============================================
#               USERS API
# ============================================
print_header "USERS API"

# Test 6: List all users
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/users" 200 "$HTTP_CODE" "$BODY"

# Test 7: Get user by ID
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/users/$NEW_USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/users/:id" 200 "$HTTP_CODE" "$BODY"

# Test 8: Update user
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/users/$NEW_USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Updated Name"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "PUT /api/users/:id" 200 "$HTTP_CODE" "$BODY"

# Test 9: Delete user
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/users/$NEW_USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "DELETE /api/users/:id" 200 "$HTTP_CODE" "$BODY"

# Test 10: Get deleted user (should 404)
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/users/$NEW_USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/users/:id (deleted user)" 404 "$HTTP_CODE" "$BODY"

# ============================================
#             DASHBOARD API
# ============================================
print_header "DASHBOARD API"

# Test 11: Shared dashboard
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/dashboard/shared" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/dashboard/shared" 200 "$HTTP_CODE" "$BODY"

# Login as different users for role-specific dashboards
# Retailer
RETAILER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginId": "retailer1", "password": "password123"}')
RETAILER_TOKEN=$(echo "$RETAILER_RESPONSE" | jq -r '.data.token')

# Test 12: Retailer dashboard
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/dashboard/retailer" \
  -H "Authorization: Bearer $RETAILER_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/dashboard/retailer" 200 "$HTTP_CODE" "$BODY"

# Distributor
DIST_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginId": "distributor1", "password": "password123"}')
DIST_TOKEN=$(echo "$DIST_RESPONSE" | jq -r '.data.token')

# Test 13: Distributor dashboard
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/dashboard/distributor" \
  -H "Authorization: Bearer $DIST_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/dashboard/distributor" 200 "$HTTP_CODE" "$BODY"

# Stockist
STOCK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginId": "stockist1", "password": "password123"}')
STOCK_TOKEN=$(echo "$STOCK_RESPONSE" | jq -r '.data.token')

# Test 14: Stockist dashboard
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/dashboard/stockist" \
  -H "Authorization: Bearer $STOCK_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/dashboard/stockist" 200 "$HTTP_CODE" "$BODY"

# Salesperson
SALES_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginId": "salesperson1", "password": "password123"}')
SALES_TOKEN=$(echo "$SALES_RESPONSE" | jq -r '.data.token')
SALES_ID=$(echo "$SALES_RESPONSE" | jq -r '.data.user.id')

# Test 15: Salesperson dashboard
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/dashboard/salesperson" \
  -H "Authorization: Bearer $SALES_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/dashboard/salesperson" 200 "$HTTP_CODE" "$BODY"

# Test 16: Access control - retailer trying distributor dashboard
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/dashboard/distributor" \
  -H "Authorization: Bearer $RETAILER_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/dashboard/distributor (wrong role)" 403 "$HTTP_CODE" "$BODY"

# ============================================
#             ATTENDANCE API
# ============================================
print_header "ATTENDANCE API"

# Test 17: Check today's status (salesperson)
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/attendance/login" \
  -H "Authorization: Bearer $SALES_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/attendance/login (check status)" 200 "$HTTP_CODE" "$BODY"

# Check if already logged in today
ALREADY_LOGGED=$(echo "$BODY" | jq -r '.data.hasLoggedIn')

if [ "$ALREADY_LOGGED" != "true" ]; then
  # Test 18: Record login
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/attendance/login" \
    -H "Authorization: Bearer $SALES_TOKEN")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  print_result "POST /api/attendance/login" 200 "$HTTP_CODE" "$BODY"
else
  echo -e "${YELLOW}⏭️  SKIP${NC} - POST /api/attendance/login (already logged in today)"
fi

# Test 19: Try duplicate login
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/attendance/login" \
  -H "Authorization: Bearer $SALES_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "POST /api/attendance/login (duplicate)" 400 "$HTTP_CODE" "$BODY"

# Test 20: Non-salesperson trying to login
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/attendance/login" \
  -H "Authorization: Bearer $RETAILER_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "POST /api/attendance/login (wrong role)" 403 "$HTTP_CODE" "$BODY"

# Check if already logged out
RESPONSE=$(curl -s "$BASE_URL/api/attendance/login" -H "Authorization: Bearer $SALES_TOKEN")
ALREADY_LOGGED_OUT=$(echo "$RESPONSE" | jq -r '.data.hasLoggedOut')

if [ "$ALREADY_LOGGED_OUT" != "true" ]; then
  # Test 21: Record logout
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/attendance/logout" \
    -H "Authorization: Bearer $SALES_TOKEN")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  print_result "POST /api/attendance/logout" 200 "$HTTP_CODE" "$BODY"
else
  echo -e "${YELLOW}⏭️  SKIP${NC} - POST /api/attendance/logout (already logged out today)"
fi

# Test 22: My attendance history
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/attendance/my-history" \
  -H "Authorization: Bearer $SALES_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/attendance/my-history" 200 "$HTTP_CODE" "$BODY"

# Test 23: Admin - Get all attendance
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/attendance/all" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/attendance/all (admin)" 200 "$HTTP_CODE" "$BODY"

# Test 24: Admin - Get specific salesperson attendance
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/attendance/salesperson/$SALES_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/attendance/salesperson/:id (admin)" 200 "$HTTP_CODE" "$BODY"

# Test 25: Admin - Get attendance report
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/attendance/report" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/attendance/report (admin)" 200 "$HTTP_CODE" "$BODY"

# Test 26: Non-admin trying admin endpoint
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/attendance/all" \
  -H "Authorization: Bearer $SALES_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
print_result "GET /api/attendance/all (non-admin)" 403 "$HTTP_CODE" "$BODY"

# ============================================
#               SUMMARY
# ============================================
print_header "TEST SUMMARY"

TOTAL=$((PASSED + FAILED))
echo -e ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "Total:  $TOTAL"
echo -e ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed. Please check the output above.${NC}"
  exit 1
fi
