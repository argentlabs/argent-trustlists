import { ethers } from "hardhat";
import { BytesLike, Signer } from "ethers";

export const paraswapInterface = new ethers.utils.Interface([`
  function swapOnUniswap(
      uint256 amountIn,
      uint256 amountOutMin,
      address[] calldata path
  )
`]);

export const signCalldata = async (data: BytesLike | undefined, signer: Signer) => {
  if (!data) {
    throw new Error("No calldata");
  }
  const messageHash = ethers.utils.keccak256(data);
  const messageBytes = ethers.utils.arrayify(messageHash);
  return await signer.signMessage(messageBytes);
};
