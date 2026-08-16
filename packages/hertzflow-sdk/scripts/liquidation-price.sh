#!/bin/bash

# 🎯  CLI 
# : ./liquidation-price.sh <position_id> <collateral_type> <coin_decimals>
# : ./scripts/liquidation-price.sh 0x2ebe6ac5f114287b2776b65c03f47eceda9c7f58d5c7c8e75106d7c2bda12f89 0xcffbb3233da5992a8b336d0ff9de73a56c0332844133992348600d5030cf86d9::eth::ETH 8

set -e


RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color


PACKAGE_ID="0x7beb32588c0e529d98145e7b4f53cc516f881ca561204db8bcbb27e864dd1c3f"
VAULT_ID="0xa374ecde19df09cc793ec35bfab2b7f2d059a6d55560898e8fe9215e835c0729"
PROTOCOL_STORE_ID="0x2d1dac39b0b3e56e9fd98c915a1ade69398872694a990c3fa26bc9af18184a52"
CLOCK_ID="0x6"


show_help() {
    echo -e "${CYAN}🎯  CLI ${NC}"
    echo ""
    echo -e "${YELLOW}:${NC}"
    echo "  $0 <position_id> <collateral_type> <coin_decimals>"
    echo ""
    echo -e "${YELLOW}:${NC}"
    echo "  position_id      ID ()"
    echo "  collateral_type   (，)"
    echo "  coin_decimals     (， BTC=8, ETH=18)"
    echo ""
    echo -e "${YELLOW}:${NC}"
    echo "  $0 0xad6f9c52ef0a902a3dc4c3c5efd67357bcd7c26b6361c8a191af0226d181abf9 0x8c73df029cb08f82e064b215b78a3b8996174d9c536074c0bef8504f9f1abf9f::btc::BTC 8"
    echo "  $0 0x2ebe6ac5f114287b2776b65c03f47eceda9c7f58d5c7c8e75106d7c2bda12f89 0xcffbb3233da5992a8b336d0ff9de73a56c0332844133992348600d5030cf86d9::eth::ETH 18"
    echo ""
    exit 0
}

# 
if [ $# -eq 0 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
fi

if [ $# -lt 3 ]; then
    echo -e "${RED}❌ : ${NC}"
    echo -e "${YELLOW}: $0 <position_id> <collateral_type> <coin_decimals>${NC}"
    echo -e "${YELLOW} --help ${NC}"
    exit 1
fi

POSITION_ID="$1"
COLLATERAL_TYPE="$2"
COIN_DECIMALS="$3"

#  coin_decimals 
if ! [[ "$COIN_DECIMALS" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}❌ : coin_decimals ${NC}"
    exit 1
fi

# 
FULL_TYPE="$COLLATERAL_TYPE"

# 
if [[ "$FULL_TYPE" == *"::btc::BTC"* ]]; then
    TYPE_NAME="BTC"
elif [[ "$FULL_TYPE" == *"::eth::ETH"* ]]; then
    TYPE_NAME="ETH"
else
    # 
    TYPE_NAME=$(echo "$FULL_TYPE" | sed 's/.*:://')
fi

echo -e "${CYAN}🚀 ...${NC}"
echo -e "${BLUE}📊 :${NC}"
echo -e "  ID: ${YELLOW}$POSITION_ID${NC}"
echo -e "  : ${YELLOW}$TYPE_NAME${NC}"
echo -e "  : ${YELLOW}$COIN_DECIMALS${NC}"
echo -e "  : ${YELLOW}$FULL_TYPE${NC}"
echo ""

#  devInspect
echo -e "${BLUE}📡  calculate_liquidation_price...${NC}"

RESULT=$(sui client ptb --dev-inspect \
    --move-call "$PACKAGE_ID::vault::calculate_liquidation_price" \
    "<$FULL_TYPE>" \
    "@$VAULT_ID" \
    "@$PROTOCOL_STORE_ID" \
    "@$POSITION_ID" \
    "@$CLOCK_ID" 2>&1)

# 
if [[ "$RESULT" == *"error"* ]] || [[ "$RESULT" == *"Error"* ]]; then
    echo -e "${RED}❌ :${NC}"
    echo "$RESULT"
    exit 1
fi

# 
if [[ "$RESULT" == *"execution status: success"* ]]; then
    echo -e "${GREEN}✅ !${NC}"
else
    echo -e "${RED}❌ !${NC}"
    echo "$RESULT"
    exit 1
fi

# 
BYTES_LINE=$(echo "$RESULT" | grep "Bytes:" | head -1)
if [ -z "$BYTES_LINE" ]; then
    echo -e "${RED}❌ ${NC}"
    echo -e "${YELLOW}:${NC}"
    echo "$RESULT"
    exit 1
fi

#  [160, 40, 43, 97, 92, 142, 64, 1, 0, 0, 0, 0, 0, 0, 0, 0]
BYTES_ARRAY=$(echo "$BYTES_LINE" | sed 's/.*Bytes: \[\(.*\)\].*/\1/')

echo -e "${BLUE}📋 :${NC}"
echo -e "  : ${YELLOW}[$BYTES_ARRAY]${NC}"

#  Node.js 
PARSED_RESULT=$(node -e "
const bytes = [$BYTES_ARRAY];
const buffer = Buffer.from(bytes);
const value = buffer.readBigUInt64LE(0);
const coinDecimals = $COIN_DECIMALS;
const PRECISION_MULTIPLIER = Math.pow(10, coinDecimals);  // 10^coin_decimals
const PRECISION_DIVISOR = Math.pow(10, 20);               // 10^10 × 10^10 = 10^20

const formattedPrice = (Number(value) * PRECISION_MULTIPLIER) / PRECISION_DIVISOR;

console.log(JSON.stringify({
    rawBigInt: value.toString(),
    coinDecimals: coinDecimals,
    precisionMultiplier: PRECISION_MULTIPLIER.toString(),
    precisionDivisor: PRECISION_DIVISOR.toString(),
    formattedPrice: formattedPrice.toString(),
    formattedPriceReadable: formattedPrice.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 10
    })
}));
")

RAW_VALUE=$(echo "$PARSED_RESULT" | jq -r '.rawBigInt')
COIN_DECIMALS_USED=$(echo "$PARSED_RESULT" | jq -r '.coinDecimals')
PRECISION_MULTIPLIER=$(echo "$PARSED_RESULT" | jq -r '.precisionMultiplier')
PRECISION_DIVISOR=$(echo "$PARSED_RESULT" | jq -r '.precisionDivisor')
FORMATTED_PRICE=$(echo "$PARSED_RESULT" | jq -r '.formattedPrice')
READABLE_PRICE=$(echo "$PARSED_RESULT" | jq -r '.formattedPriceReadable')

echo ""
echo -e "${GREEN}🎯 :${NC}"
echo -e "${PURPLE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${PURPLE}│${NC} ${CYAN} BigInt :${NC} ${YELLOW}$RAW_VALUE${NC}"
echo -e "${PURPLE}│${NC} ${CYAN}:${NC}       ${YELLOW} × 10^$COIN_DECIMALS_USED ÷ 10^10 ÷ 10^10${NC}"
echo -e "${PURPLE}│${NC} ${CYAN}:${NC}       ${YELLOW}$PRECISION_MULTIPLIER (10^$COIN_DECIMALS_USED)${NC}"
echo -e "${PURPLE}│${NC} ${CYAN}:${NC}       ${YELLOW}$PRECISION_DIVISOR (10^20)${NC}"
echo -e "${PURPLE}│${NC} ${CYAN}:${NC}       ${YELLOW}$FORMATTED_PRICE USD${NC}"
echo -e "${PURPLE}│${NC} ${CYAN}:${NC}       ${YELLOW}$READABLE_PRICE USD${NC}"
echo -e "${PURPLE}└─────────────────────────────────────────────────────────────┘${NC}"

# Gas 
COMPUTATION_COST=$(echo "$RESULT" | grep "Computation Cost:" | sed 's/.*Computation Cost: \([0-9]*\) MIST.*/\1/' || echo "unknown")
STORAGE_COST=$(echo "$RESULT" | grep "Storage Cost:" | sed 's/.*Storage Cost: \([0-9]*\) MIST.*/\1/' || echo "unknown")

echo ""
echo -e "${BLUE}⛽ Gas :${NC}"
echo -e "  : ${YELLOW}$COMPUTATION_COST MIST${NC}"
echo -e "  : ${YELLOW}$STORAGE_COST MIST${NC}"

echo ""
echo -e "${GREEN}✨ !${NC}"
