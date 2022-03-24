import { BigNumber, BytesLike, ethers, Signer } from "ethers";
import { ContractMethod, ParaSwap } from "paraswap";

const paraSwap = new ParaSwap();

export const getTransaction = async (srcToken: string, destToken: string, srcAmount: string, userAddress: string) => {
  const priceRoute = await paraSwap.getRate(
    srcToken,
    destToken,
    srcAmount,
    undefined,
    undefined,
    { includeContractMethods: [ContractMethod.simpleSwap] }
  );

  if ("message" in priceRoute) {
    throw new Error(priceRoute.message);
  }

  const transaction = await paraSwap.buildTx(
    srcToken,
    destToken,
    srcAmount,
    BigNumber.from(priceRoute.destAmount).mul("99").div("100").toString(),
    priceRoute,
    userAddress,
    "argent",
    undefined,
    undefined,
    undefined,
    { ignoreChecks: true }
  );

  if ("message" in transaction) {
    throw new Error(`Failed to build transaction: ${transaction.message}`);
  }

  transaction.value = BigNumber.from(transaction.value).toHexString();
  // @ts-ignore
  transaction.gasPrice = BigNumber.from(transaction.gasPrice).toHexString();

  return transaction;
};

  export const signCalldata = async (data: BytesLike | undefined, signer: Signer) => {
    if (!data) {
      throw new Error("No calldata");
    }
    const messageHash = ethers.utils.keccak256(data);
    const messageBytes = ethers.utils.arrayify(messageHash);
    return await signer.signMessage(messageBytes);
  };
