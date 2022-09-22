import { useCallback, useEffect, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

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
        (e || !enabled) &&
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FlagsTable />} />
      </Routes>
    </Router>
  );
}

function useLocalValues() {
  const [flags, setFlags] = useState<string[]>([]);
  useEffect(() => {
    const yml = window.electron.readFlags();
    setFlags(yml.split('\n').map((flag) => flag.trim()));
  }, []);
  const getValue = useCallback(
    (name: string) => {
      return (
        flags
          .filter((flag) => {
            const [f] = flag.split(':');
            return f === name;
          })
          .map((flag) => {
            const [, v] = flag.split(':');
            return v.trim() === 'true';
          })[0] || false
      );
    },
    [flags]
  );
  const setValue = useCallback(
    (name: string, value: boolean) => {
      let found = false;
      const lines = flags.map((flag) => {
        const [f] = flag.split(':');
        found = found || f === name;
        return f === name ? `${name}: ${value}` : flag;
      });
      if (!found) lines.push(`${name}: ${value}`);
      const yml = lines.join('\n');
      window.electron.writeFlags(yml);
      setFlags(lines);
    },
    [flags]
  );
  return { getValue, setValue };
}

function useCloudBees() {
  const appId = window.electron.appId;
  const token = window.electron.token;
  const [flags, setFlags] = useState<
    { name: string; description: string; enabled: boolean; value: boolean }[]
  >([]);
  useEffect(() => {
    window
      .fetch(
        `https://x-api.rollout.io/public-api/applications/${appId}/us-east-1-prod-sc/flags`,
        {
          // method: 'GET',
          // credentials: 'same-origin',
          // mode: 'cors',
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${token}`,
          },
        }
      )
      .then((resp) => resp.json())
      .then((json) => setFlags(json));
  }, []);
  return { flags };
}
