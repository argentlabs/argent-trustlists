import { useQuery, gql } from '@apollo/client';
import React, { useState } from 'react';

import logo from './argent.svg';
import './App.css';
import metadata from '@metadata';

import Timelock from './Timelock';
import Registry from './Registry';

const GET_REGISTRIES = gql`
  query GetRegistries {
    registries {
        id
    }
  }
`;

function App() {
  const { loading, error, data } = useQuery(GET_REGISTRIES);
  const registryIds = data ? data.registries.map(r => r.id) : [];
  const [registryId, setRegistryId] = useState("0");
  const envBanner = ['test', 'staging'].find(e => e === process.env.REACT_APP_ENVIRONMENT);

  return (
    <div className="app">
      <div className="header">
        <div className="header-top">
          <img src={logo} className="header-logo" alt="logo" />
          { envBanner ?
            <span className="env">{envBanner}</span>
          : null }
          <a
            className="header-link"
            href="https://argent.xyz"
          >Homepage<span>↗</span></a>
        </div>
        <div className="header-desc">
          <h1>Trust Lists</h1>
          <p>Transactions that Argent Vault owners are allowed to make without guardian approvals.</p>
          <p>Individual Argent Vaults may enable or disable any Trust List.</p>
        </div>
      </div>
      <div className="page">
        <h2>How Trust Lists are managed</h2>
        <p>Each Trust List has a <em>manager</em>. The manager can add, update or remove <em>filters</em> which specify a smart contract that validates a transaction against a destination (or allows any transaction to a destination).</p>
        <p>All changes are subject to a timelock period to give Argent Vault owners an opportunity to review a change, and if they do not agree they may disable a Trust List. You can listen to updates in <a href="#">#timelock-updates on Discord</a>.</p>
        <p>The timelock period applies to all registries and is applied to all new and updated filters. There is no timelock for the manager to remove a filter.</p>
        <Timelock />
        <p>The timelock period can be updated by Argent, subject to a timelock period equal to the current timelock.</p>
        <div className="bubble">
          <div className="registry-menu">
            {loading ? "Loading..." : null}
            {error ? "Failed to load" : null}
            {registryIds.map((id, index) => {
              const meta = metadata.registries.find(m => m.id === id);
              const name = meta ? meta.name : id;
              return <button key={index} className={registryId===id?'on':null} onClick={() => setRegistryId(id)}>{name}</button>
            })}
          </div>
          <Registry id={registryId} />
        </div>
      </div>
      <div className="footer">
        <p>Made with ❤️ by Argent</p>
        <p className="small"><a href="https://github.com/argentlabs/argent-trustlists" tagret="_blank" rel="noreferrer">Github source</a></p>
      </div>
    </div>
  );
}

export default App;
