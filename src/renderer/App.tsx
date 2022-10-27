import { useCallback, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import {
  EnvironmentsContext,
  useCloudBees,
  useEnvironments,
  useLocalValues,
} from './hooks';
import './styles.css';

const FlagsTable = () => {
  const [, updateState] = useState({});
  const forceUpdate = useCallback(() => updateState({}), []);
  const local = useLocalValues();
  const { flags: prefiltered } = useCloudBees();
  const [filter, setFilter] = useState('');
  const [enabled, setEnabled] = useState(true);
  const flags = prefiltered
    .filter(
      ({ enabled: e, name, description }) =>
        (!enabled || (enabled && e)) &&
        (!filter ||
          `${name} ${description}`
            .toLocaleLowerCase()
            .includes(filter.toLocaleLowerCase()))
    )
    .map((flag) => ({ ...flag, value: local.getValue(flag.name) }));

  if (!filter && flags.length < 1)
    return <div style={{ textAlign: 'center' }}>loading...</div>;
  return (
    <main>
      <nav>
        Search:{' '}
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />{' '}
          enabled flags only
        </label>
      </nav>
      {flags.length < 1 ? (
        <div style={{ textAlign: 'center' }}>no results</div>
      ) : (
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <thead>
            <tr>
              <td>Name</td>
              <td>Value</td>
              <td> </td>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => (
              <tr key={flag.name}>
                <td>
                  {flag.name}
                  <br />
                  <small>{flag.description || 'no description'}</small>
                </td>
                <td>{(!!flag.value).toString()}</td>
                <td>
                  <button
                    onClick={() => {
                      local.setValue(flag.name, !flag.value);
                      setTimeout(() => forceUpdate(), 100);
                    }}
                  >
                    toggle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
};

export function App() {
  return (
    <EnvironmentsContext.Provider value={useEnvironments()}>
      <Router>
        <Routes>
          <Route path="/" element={<FlagsTable />} />
        </Routes>
      </Router>
    </EnvironmentsContext.Provider>
  );
}
