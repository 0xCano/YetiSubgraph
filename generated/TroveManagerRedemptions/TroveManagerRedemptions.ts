// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class Redemption extends ethereum.Event {
  get params(): Redemption__Params {
    return new Redemption__Params(this);
  }
}

export class Redemption__Params {
  _event: Redemption;

  constructor(event: Redemption) {
    this._event = event;
  }

  get _attemptedYUSDAmount(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get _actualYUSDAmount(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get YUSDfee(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get tokens(): Array<Address> {
    return this._event.parameters[3].value.toAddressArray();
  }

  get amounts(): Array<BigInt> {
    return this._event.parameters[4].value.toBigIntArray();
  }
}

export class TroveUpdated extends ethereum.Event {
  get params(): TroveUpdated__Params {
    return new TroveUpdated__Params(this);
  }
}

export class TroveUpdated__Params {
  _event: TroveUpdated;

  constructor(event: TroveUpdated) {
    this._event = event;
  }

  get _borrower(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get _debt(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get _tokens(): Array<Address> {
    return this._event.parameters[2].value.toAddressArray();
  }

  get _amounts(): Array<BigInt> {
    return this._event.parameters[3].value.toBigIntArray();
  }

  get operation(): i32 {
    return this._event.parameters[4].value.toI32();
  }
}

export class TroveManagerRedemptions extends ethereum.SmartContract {
  static bind(address: Address): TroveManagerRedemptions {
    return new TroveManagerRedemptions("TroveManagerRedemptions", address);
  }

  BETA(): BigInt {
    let result = super.call("BETA", "BETA():(uint256)", []);

    return result[0].toBigInt();
  }

  try_BETA(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("BETA", "BETA():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  DECIMAL_PRECISION(): BigInt {
    let result = super.call(
      "DECIMAL_PRECISION",
      "DECIMAL_PRECISION():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_DECIMAL_PRECISION(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "DECIMAL_PRECISION",
      "DECIMAL_PRECISION():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  NAME(): Bytes {
    let result = super.call("NAME", "NAME():(bytes32)", []);

    return result[0].toBytes();
  }

  try_NAME(): ethereum.CallResult<Bytes> {
    let result = super.tryCall("NAME", "NAME():(bytes32)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  getEntireSystemColl(): BigInt {
    let result = super.call(
      "getEntireSystemColl",
      "getEntireSystemColl():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_getEntireSystemColl(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getEntireSystemColl",
      "getEntireSystemColl():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getEntireSystemDebt(): BigInt {
    let result = super.call(
      "getEntireSystemDebt",
      "getEntireSystemDebt():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_getEntireSystemDebt(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getEntireSystemDebt",
      "getEntireSystemDebt():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }
}

export class RedeemCollateralCall extends ethereum.Call {
  get inputs(): RedeemCollateralCall__Inputs {
    return new RedeemCollateralCall__Inputs(this);
  }

  get outputs(): RedeemCollateralCall__Outputs {
    return new RedeemCollateralCall__Outputs(this);
  }
}

export class RedeemCollateralCall__Inputs {
  _call: RedeemCollateralCall;

  constructor(call: RedeemCollateralCall) {
    this._call = call;
  }

  get _YUSDamount(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _YUSDMaxFee(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _firstRedemptionHint(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get _upperPartialRedemptionHint(): Address {
    return this._call.inputValues[3].value.toAddress();
  }

  get _lowerPartialRedemptionHint(): Address {
    return this._call.inputValues[4].value.toAddress();
  }

  get _partialRedemptionHintAICR(): BigInt {
    return this._call.inputValues[5].value.toBigInt();
  }

  get _maxIterations(): BigInt {
    return this._call.inputValues[6].value.toBigInt();
  }

  get _redeemer(): Address {
    return this._call.inputValues[7].value.toAddress();
  }
}

export class RedeemCollateralCall__Outputs {
  _call: RedeemCollateralCall;

  constructor(call: RedeemCollateralCall) {
    this._call = call;
  }
}

export class RedeemCollateralSingleCall extends ethereum.Call {
  get inputs(): RedeemCollateralSingleCall__Inputs {
    return new RedeemCollateralSingleCall__Inputs(this);
  }

  get outputs(): RedeemCollateralSingleCall__Outputs {
    return new RedeemCollateralSingleCall__Outputs(this);
  }
}

export class RedeemCollateralSingleCall__Inputs {
  _call: RedeemCollateralSingleCall;

  constructor(call: RedeemCollateralSingleCall) {
    this._call = call;
  }

  get _YUSDamount(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _YUSDMaxFee(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _target(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get _upperHint(): Address {
    return this._call.inputValues[3].value.toAddress();
  }

  get _lowerHint(): Address {
    return this._call.inputValues[4].value.toAddress();
  }

  get _hintAICR(): BigInt {
    return this._call.inputValues[5].value.toBigInt();
  }

  get _collToRedeem(): Address {
    return this._call.inputValues[6].value.toAddress();
  }

  get _redeemer(): Address {
    return this._call.inputValues[7].value.toAddress();
  }
}

export class RedeemCollateralSingleCall__Outputs {
  _call: RedeemCollateralSingleCall;

  constructor(call: RedeemCollateralSingleCall) {
    this._call = call;
  }
}

export class SetAddressesCall extends ethereum.Call {
  get inputs(): SetAddressesCall__Inputs {
    return new SetAddressesCall__Inputs(this);
  }

  get outputs(): SetAddressesCall__Outputs {
    return new SetAddressesCall__Outputs(this);
  }
}

export class SetAddressesCall__Inputs {
  _call: SetAddressesCall;

  constructor(call: SetAddressesCall) {
    this._call = call;
  }

  get _activePoolAddress(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _defaultPoolAddress(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get _gasPoolAddress(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get _collSurplusPoolAddress(): Address {
    return this._call.inputValues[3].value.toAddress();
  }

  get _yusdTokenAddress(): Address {
    return this._call.inputValues[4].value.toAddress();
  }

  get _sortedTrovesAddress(): Address {
    return this._call.inputValues[5].value.toAddress();
  }

  get _controllerAddress(): Address {
    return this._call.inputValues[6].value.toAddress();
  }

  get _troveManagerAddress(): Address {
    return this._call.inputValues[7].value.toAddress();
  }
}

export class SetAddressesCall__Outputs {
  _call: SetAddressesCall;

  constructor(call: SetAddressesCall) {
    this._call = call;
  }
}

export class UpdateRedemptionsEnabledCall extends ethereum.Call {
  get inputs(): UpdateRedemptionsEnabledCall__Inputs {
    return new UpdateRedemptionsEnabledCall__Inputs(this);
  }

  get outputs(): UpdateRedemptionsEnabledCall__Outputs {
    return new UpdateRedemptionsEnabledCall__Outputs(this);
  }
}

export class UpdateRedemptionsEnabledCall__Inputs {
  _call: UpdateRedemptionsEnabledCall;

  constructor(call: UpdateRedemptionsEnabledCall) {
    this._call = call;
  }

  get _enabled(): boolean {
    return this._call.inputValues[0].value.toBoolean();
  }
}

export class UpdateRedemptionsEnabledCall__Outputs {
  _call: UpdateRedemptionsEnabledCall;

  constructor(call: UpdateRedemptionsEnabledCall) {
    this._call = call;
  }
}
