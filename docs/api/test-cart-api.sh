#!/bin/bash

# ============================================
#     CART API - ENDPOINT TESTS
# ============================================
#
# Tests all cart endpoints (SALESPERSON only).
#
# Usage:
#   chmod +x test-cart-api.sh
#   ./test-cart-api.sh
#
# Requirements:
#   - curl, jq
#   - Server running: npm run dev
#   - DB migrated: npx prisma migrate dev
#   - Seed run: npm run prisma:seed (creates retailer1, distributor1, salesperson1, tea products)
#
# ============================================

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASSED=0
FAILED=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
  echo -e "\n${BLUE}============================================${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}============================================${NC}"
}

print_result() {
  local test_name=$1
  local expected=$2
  local actual=$3
  local response=$4
  if [ "$actual" -eq "$expected" ]; then
    echo -e "${GREEN}✅ PASS${NC} - $test_name (HTTP $actual)"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC} - $test_name (Expected: $expected, Got: $actual)"
    echo -e "${YELLOW}Response: $(echo "$response" | jq -c . 2>/dev/null || echo "$response")${NC}"
    ((FAILED++))
  fi
}

# Check server
echo -e "${YELLOW}Checking server at $BASE_URL...${NC}"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null)
if [ "$HEALTH" != "200" ]; then
  echo -e "${RED}Server not running at $BASE_URL. Start with: npm run dev${NC}"
  exit 1
fi
echo -e "${GREEN}Server OK${NC}"

# Login as salesperson, retailer, distributor
SALES_RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginId": "salesperson1", "password": "password123"}')
SALES_TOKEN=$(echo "$SALES_RESP" | jq -r '.data.token')
if [ "$SALES_TOKEN" = "null" ] || [ -z "$SALES_TOKEN" ]; then
  echo -e "${RED}Login as salesperson1 failed. Ensure user exists (e.g. seed or create).${NC}"
  exit 1
fi

RETAILER_RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginId": "retailer1", "password": "password123"}')
RETAILER_TOKEN=$(echo "$RETAILER_RESP" | jq -r '.data.token')

DIST_RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginId": "distributor1", "password": "password123"}')
DIST_TOKEN=$(echo "$DIST_RESP" | jq -r '.data.token')

# Get IDs for buyer/supplier and first product (for add-to-cart test)
RETAILER_ID=$(curl -s "$BASE_URL/api/auth/me" -H "Authorization: Bearer $RETAILER_TOKEN" | jq -r '.data.id')
DIST_ID=$(curl -s "$BASE_URL/api/auth/me" -H "Authorization: Bearer $DIST_TOKEN" | jq -r '.data.id')
PRODUCTS_RESP=$(curl -s "$BASE_URL/api/products" -H "Authorization: Bearer $SALES_TOKEN")
PRODUCT_ID=$(echo "$PRODUCTS_RESP" | jq -r '.data[0].id // empty')

print_header "CART API TESTS"

# 1. GET cart (salesperson)
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/cart" -H "Authorization: Bearer $SALES_TOKEN")
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
print_result "GET /api/cart (salesperson)" 200 "$CODE" "$BODY"

# 2. GET cart (non-salesperson) -> 403
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/cart" -H "Authorization: Bearer $RETAILER_TOKEN")
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
print_result "GET /api/cart (non-salesperson)" 403 "$CODE" "$BODY"

# 3. POST cart/items - validation error (missing productId)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/cart/items" \
  -H "Authorization: Bearer $SALES_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 2}')
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
print_result "POST /api/cart/items (validation)" 400 "$CODE" "$BODY"

# 4. POST cart/items - add real product (from seed tea products)
if [ -n "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/cart/items" \
    -H "Authorization: Bearer $SALES_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"productId\": \"$PRODUCT_ID\", \"quantity\": 2}")
  CODE=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')
  print_result "POST /api/cart/items (add product)" 200 "$CODE" "$BODY"
else
  echo -e "${YELLOW}⏭️  SKIP${NC} - POST /api/cart/items (add product) - run seed to create products"
fi

# 5. POST cart/items - product not found
FAKE_PID="00000000-0000-4000-8000-000000000001"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/cart/items" \
  -H "Authorization: Bearer $SALES_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\": \"$FAKE_PID\", \"quantity\": 2}")
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
print_result "POST /api/cart/items (product not found)" 404 "$CODE" "$BODY"

# 6. PUT cart/buyer (only if we have retailer)
if [ -n "$RETAILER_ID" ] && [ "$RETAILER_ID" != "null" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/cart/buyer" \
    -H "Authorization: Bearer $SALES_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"buyerId\": \"$RETAILER_ID\"}")
  CODE=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')
  print_result "PUT /api/cart/buyer" 200 "$CODE" "$BODY"
else
  echo -e "${YELLOW}⏭️  SKIP${NC} - PUT /api/cart/buyer (no retailer user)"
fi

# 7. PUT cart/supplier (only if we have distributor)
if [ -n "$DIST_ID" ] && [ "$DIST_ID" != "null" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/cart/supplier" \
    -H "Authorization: Bearer $SALES_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"supplierId\": \"$DIST_ID\"}")
  CODE=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')
  print_result "PUT /api/cart/supplier" 200 "$CODE" "$BODY"
else
  echo -e "${YELLOW}⏭️  SKIP${NC} - PUT /api/cart/supplier (no distributor user)"
fi

# 8. POST cart/checkout - with items -> 200 (only when we added a product)
if [ -n "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/cart/checkout" \
    -H "Authorization: Bearer $SALES_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}')
  CODE=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')
  print_result "POST /api/cart/checkout (with items)" 200 "$CODE" "$BODY"
else
  echo -e "${YELLOW}⏭️  SKIP${NC} - POST /api/cart/checkout (with items) - run seed for products"
fi

# 9. POST cart/checkout - empty cart -> 400
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/cart/checkout" \
  -H "Authorization: Bearer $SALES_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
print_result "POST /api/cart/checkout (empty cart)" 400 "$CODE" "$BODY"

# 10. PUT cart/items/:itemId - item not found
FAKE_ITEM_ID="00000000-0000-4000-8000-000000000002"
RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/cart/items/$FAKE_ITEM_ID" \
  -H "Authorization: Bearer $SALES_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 3}')
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
print_result "PUT /api/cart/items/:itemId (not found)" 404 "$CODE" "$BODY"

# 11. DELETE cart/items/:itemId - item not found
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/cart/items/$FAKE_ITEM_ID" \
  -H "Authorization: Bearer $SALES_TOKEN")
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
print_result "DELETE /api/cart/items/:itemId (not found)" 404 "$CODE" "$BODY"

# 12. DELETE cart (clear)
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/cart" \
  -H "Authorization: Bearer $SALES_TOKEN")
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
print_result "DELETE /api/cart (clear cart)" 200 "$CODE" "$BODY"

# Summary
print_header "CART TEST SUMMARY"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "Total:  $((PASSED + FAILED))"
if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}🎉 All cart tests passed.${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed.${NC}"
  exit 1
fi
