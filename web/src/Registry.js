import { useQuery, gql } from '@apollo/client';
import moment from 'moment';

import metadata from '@metadata';

import EthAddress from './EthAddress';

const GET_REGISTRY = gql`
  query GetRegistry($id: String!) {
    registry(id: $id) {
      owner
      dapps {
        dapp
    	  filter
        validAfter
    	  lastChange
    	  pendingFilter
    	  pendingConfirmAfter
      }
    }
  }
`;

function Registry(props) {
  const { loading, error, data } = useQuery(GET_REGISTRY, {
    variables: {
      id: props.id
    }
  });

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;
  if (!data || !data.registry) return `Not found`;
  const meta = metadata.registries.find(m => m.id === props.id);
  
  const owner = data.registry.owner;
  const dapps = data.registry.dapps.map(d => {
    return {
      dapp: d.dapp,
      filter: d.filter,
      validAfter: moment.unix(parseInt(d.validAfter)),
      lastChange: moment.unix(parseInt(d.lastChange)),
      pendingFilter: d.pendingFilter,
      pendingConfirmAfter: d.pendingConfirmAfter ? moment.unix(parseInt(d.pendingConfirmAfter)) : null,
    }
  });

  const pendingChanges = dapps.filter(d => d.pendingFilter || d.validAfter.isAfter());
  const activeFilters = dapps.filter(d => d.validAfter.isBefore());

  return (
    <div>
      <code>Manager: <EthAddress address={owner} /></code>
      <h2>Pending changes</h2>
      {pendingChanges.length > 0 ?
        <table>
          <thead>
            <th>Destination</th>
            <th>Filter</th>
            <th>Active in</th>
            <th>Notes</th>
          </thead>
          <tbody>
            {pendingChanges.map(d => {
              const date = d.pendingConfirmAfter || d.validAfter;
              const note = meta ? meta.dapps[d.dapp] : null;
              return <tr>
                <td><EthAddress address={d.dapp} /></td>
                <td><EthAddress address={d.pendingFilter} canBeAny={true} /></td>
                <td>{date.fromNow()}</td>
                <td>{note}</td>
              </tr>
            })}
          </tbody>
        </table>
        :
        <code>No pending changes</code>
      }
      <h2>Active filters</h2>
      {activeFilters.length > 0 ?
        <table>
          <thead>
            <th>Destination</th>
            <th>Filter</th>
            <th>Last updated</th>
            <th>Notes</th>
          </thead>
          <tbody>
            {activeFilters.map(d => {
              const note = meta ? meta.dapps[d.dapp] : null;
              return <tr>
                <td><span>Destination: </span><EthAddress address={d.dapp} /></td>
                <td><span>Filter: </span><EthAddress address={d.filter} canBeAny={true} /></td>
                <td><span>Last updated: </span>{d.lastChange.fromNow()}</td>
                <td><span>Note: </span>{note}</td>
              </tr>
            })}
          </tbody>
        </table>
        :
        <code>No active filters</code>
      }
    </div>
  );
}

export default Registry;
