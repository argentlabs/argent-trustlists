function EthAddress(props) {
  const { address } = props;
  if (address === "0x0000000000000000000000000000000000000000" && props.canBeAny) return (<em>Any interaction</em>);
  
  const first = address.substr(0, 8);
  const last = address.slice(-6);
  const formattedAddress = `${first}...${last}`;
  const url = `https://etherscan.io/address/${address}#code`;

  return (
    <a href={url} target="_blank" rel="noreferrer">{formattedAddress}</a>
  );
}

export default EthAddress;
