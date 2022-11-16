import { useCallback, useContext, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import {
  EnvironmentsContext,
  useEnvironments,
  useFilteredFlags,
  usePinnedFlags,
} from './hooks';
import './styles.css';

const FlagRow = ({
  togglePin,
  toggleValue,
  pinned,
  ...flag
}: {
  togglePin(name: string): void;
  toggleValue(): void;
  name: string;
  description: string;
  value: boolean;
  pinned: boolean;
}) => (
  <tr>
    <td>
      <input
        checked={pinned}
        type="checkbox"
        onChange={() => togglePin(flag.name)}
      />
    </td>
    <td width="90%">
      {flag.name}
      <br />
      <small>{flag.description || 'no description'}</small>
    </td>
    <td>
      <div
        style={{
          height: '50px',
          width: '50px',
          borderRadius: '50%',
          textAlign: 'center',
          lineHeight: '50px',
          backgroundColor: !flag.value ? '#993355' : '#11aa44',
          fontFamily: 'monospace',
          fontWeight: 900,
          opacity: !flag.value ? 0.5 : 1,
        }}
      >
        {(!!flag.value).toString()}
      </div>
    </td>
    <td>
      <button type="button" onClick={toggleValue}>
        toggle
      </button>
    </td>
  </tr>
);

const FlagsTable = () => {
  const [, updateState] = useState({});
  const forceUpdate = useCallback(() => updateState({}), []);
  const { loading, filter, flags, updateFlag } = useFilteredFlags();
  const { flags: pinned, togglePin } = usePinnedFlags(flags);
  const Envs = useContext(EnvironmentsContext);

  if (loading) return <div style={{ textAlign: 'center' }}>loading...</div>;
  return (
    <main>
      <nav>
        <label>
          Search:{' '}
          <input
            type="text"
            value={filter.query}
            onChange={(e) => filter.setQuery(e.target.value)}
          />
        </label>
      </nav>
      <section>
        {pinned.length > 0 && (
          <table
            className="pinned"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
          >
            <tbody>
              {pinned.map(({ value, description, name }) => (
                <FlagRow
                  pinned
                  key={name}
                  name={name}
                  description={description}
                  value={value}
                  togglePin={togglePin}
                  toggleValue={() => {
                    updateFlag(name, !value);
                    // setImmediate(() => forceUpdate());
                    setTimeout(() => forceUpdate(), 0);
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
        {flags.length < 1 ? (
          <div style={{ textAlign: 'center' }}>no results</div>
        ) : (
          <table width="100%" cellPadding={0} cellSpacing={0}>
            <tbody>
              {flags.map(({ name, description, value }) => (
                <FlagRow
                  pinned={false}
                  key={name}
                  name={name}
                  description={description}
                  value={value}
                  togglePin={togglePin}
                  toggleValue={() => {
                    updateFlag(name, !value);
                    // setImmediate(() => forceUpdate());
                    setTimeout(() => forceUpdate(), 0);
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>
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
