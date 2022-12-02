import { LogFinderRule } from '@terra-money/log-finder'


function createPairRuleV2(factoryAddress: string): LogFinderRule {
  return {
    type: 'wasm',
    attributes: [
      ['_contract_address', factoryAddress],
      ['action', 'create_pair'],
      ['pair'],
      ['_contract_address'],
      ['liquidity_token_addr'],
    ],
  }
}

// swap, provide and withdraw rule
function spwRuleV2(): LogFinderRule {
  return {
    type: 'wasm',
    attributes: [
      ['_contract_address'],
      [
        'action',
        (value) => value === 'swap' || value === 'provide_liquidity' || value === 'withdraw_liquidity',
      ],
    ],
    matchUntil: '_contract_address',
  }
}

function nonnativeTransferRuleV2(): LogFinderRule {
  return {
    type: 'wasm',
    attributes: [
      ['_contract_address'],
      [
        'action',
        (value) =>
          value === 'transfer' ||
          value === 'send' ||
          value === 'transfer_from' ||
          value === 'send_from',
      ],
    ],
    matchUntil: '_contract_address',
  }
}

function nonnativeTransferRuleFromV2(): LogFinderRule {
  return {
    type: 'wasm',
    attributes: [
      ['_contract_address'],
      ['action', (value) => value === 'transfer_from' || value === 'send_from'],
      ['from'],
      ['to'],
      ['by'],
      ['amount'],
    ],
  }
}

function nativeTransferRuleV2(): LogFinderRule {
  return {
    type: 'transfer',
    attributes: [['recipient'], ['sender'], ['amount']],
  }
}

const phoenix = {
  createPairRule: createPairRuleV2,
  spwRule: spwRuleV2,
  nonnativeTransferRule: nonnativeTransferRuleV2,
  nonnativeTransferRuleFrom: nonnativeTransferRuleFromV2,
  nativeTransferRule: nativeTransferRuleV2,
}


function createPairRule(factoryAddress: string): LogFinderRule {
  return {
    type: 'wasm',
    attributes: [
      ['contract_address', factoryAddress],
      ['action', 'create_pair'],
      ['pair'],
      ['contract_address'],
      ['liquidity_token_addr'],
    ],
  }
}

// swap, provide and withdraw rule
function spwRule(): LogFinderRule {
  return {
    type: 'wasm',
    attributes: [
      ['contract_address'],
      [
        'action',
        (value) => value === 'swap' || value === 'provide_liquidity' || value === 'withdraw_liquidity',
      ],
    ],
    matchUntil: 'contract_address',
  }
}

function nonnativeTransferRule(): LogFinderRule {
  return {
    type: 'wasm',
    attributes: [
      ['contract_address'],
      [
        'action',
        (value) =>
          value === 'transfer' ||
          value === 'send' ||
          value === 'transfer_from' ||
          value === 'send_from',
      ],
    ],
    matchUntil: 'contract_address',
  }
}

function nonnativeTransferRuleFrom(): LogFinderRule {
  return {
    type: 'wasm',
    attributes: [
      ['contract_address'],
      ['action', (value) => value === 'transfer_from' || value === 'send_from'],
      ['from'],
      ['to'],
      ['by'],
      ['amount'],
    ],
  }
}

function nativeTransferRule(): LogFinderRule {
  return {
    type: 'transfer',
    attributes: [['recipient'], ['sender'], ['amount']],
  }
}

const classic = {
  createPairRule: createPairRule,
  spwRule: spwRule,
  nonnativeTransferRule: nonnativeTransferRule,
  nonnativeTransferRuleFrom: nonnativeTransferRuleFrom,
  nativeTransferRule: nativeTransferRule,
}


export function col4CreatePairRule(factoryAddress: string): LogFinderRule {
  return {
    type: 'from_contract',
    attributes: [
      ['contract_address', factoryAddress],
      ['action', 'create_pair'],
      ['pair'],
      ['contract_address'],
      ['liquidity_token_addr'],
    ],
  }
}

// swap, provide and withdraw rule
export function col4SpwRule(): LogFinderRule {
  return {
    type: 'from_contract',
    attributes: [
      ['contract_address'],
      [
        'action',
        (value) => value == 'swap' || value == 'provide_liquidity' || value == 'withdraw_liquidity',
      ],
    ],
    matchUntil: 'contract_address',
  }
}

export function col4NonnativeTransferRule(): LogFinderRule {
  return {
    type: 'from_contract',
    attributes: [
      ['contract_address'],
      [
        'action',
        (value) =>
          value == 'transfer' ||
          value == 'send' ||
          value == 'transfer_from' ||
          value == 'send_from',
      ],
    ],
    matchUntil: 'contract_address',
  }
}

export function col4NonnativeTransferRuleFrom(): LogFinderRule {
  return {
    type: 'from_contract',
    attributes: [
      ['contract_address'],
      ['action', (value) => value == 'transfer_from' || value == 'send_from'],
      ['from'],
      ['to'],
      ['by'],
      ['amount'],
    ],
  }
}

export function col4NativeTransferRule(): LogFinderRule {
  return {
    type: 'transfer',
    attributes: [['recipient'], ['sender'], ['amount']],
  }
}


const columbus4 = {
  createPairRule: col4CreatePairRule,
  spwRule: col4SpwRule,
  nonnativeTransferRule: col4NonnativeTransferRule,
  nonnativeTransferRuleFrom: col4NonnativeTransferRuleFrom,
  nativeTransferRule: col4NativeTransferRule,
}

const target = process.env.TERRA_CHAIN_ID?.includes("phoenix") ? phoenix : process.env.TERRA_CHAIN_ID?.includes("columbus-4") ? columbus4 : classic

export default {
  createPairRule: target.createPairRule,
  spwRule: target.spwRule,
  nonnativeTransferRule: target.nonnativeTransferRule,
  nonnativeTransferRuleFrom: target.nonnativeTransferRuleFrom,
  nativeTransferRule: target.nativeTransferRule,
  isParsable: (type: string): boolean => {
    return type === 'transfer' || process.env.TERRA_CHAIN_ID?.includes("columbus-4") ? type === 'from_contract' : type === 'wasm'
  }
}