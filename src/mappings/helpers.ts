import { Address, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000')
export let ZERO_BI = BigDecimal.zero()
export let ONE_BI = BigDecimal.fromString("1")
export const TO_DECIMAL_18 = BigDecimal.fromString(BigInt.fromI64(10).pow(12).toString())
