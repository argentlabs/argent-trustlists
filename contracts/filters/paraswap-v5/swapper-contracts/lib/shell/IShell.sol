pragma solidity 0.7.5;

interface IShell {
  function originSwap(
    address _origin,
    address _target,
    uint _originAmount,
    uint _minTargetAmount,
    uint _deadline
  ) external returns (uint targetAmount_);

  function targetSwap(
    address _origin,
    address _target,
    uint _maxOriginAmount,
    uint _targetAmount,
    uint _deadline
  ) external returns (uint originAmount_);
}
