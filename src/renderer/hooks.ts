import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

// Usage: `const { envs, env, setEnv } = useContext(EnvironmentsContext)`
/* BEGIN ENVIRONMENT CONTEXT/HOOKS ... */
const ALL_ENVS = [
  'us-east-1-prod-sc',
  'us-east-1-stg-fly',
  'us-east-1-stg-pub',
] as const;
const DEFAULT_ENV = ALL_ENVS[0];

export function useEnvironments() {
  const envs = useMemo(() => [...ALL_ENVS], []);
  const [env, setEnv] = useState<typeof envs[number]>(DEFAULT_ENV);
  return { env, setEnv, envs };
}
export const EnvironmentsContext = createContext<
  ReturnType<typeof useEnvironments>
>({
  env: DEFAULT_ENV,
  envs: [],
  setEnv() {},
});
/* ... END OF ENVIRONMENT CONTEXT/HOOKS */

// TODO should be in a context?
export function useCloudBees() {
  const { appId, token } = window.electron;
  const [flags, setFlags] = useState<
    { name: string; description: string; enabled: boolean; value: boolean }[]
  >([]);
  const { env } = useContext(EnvironmentsContext);
  useEffect(() => {
    const cache = JSON.parse(localStorage.getItem('flags-cache') || '{}');
    setFlags(cache[env] ?? []);
    window
      .fetch(
        `https://x-api.rollout.io/public-api/applications/${appId}/${env}/flags`,
        {
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${token}`,
          },
        }
      )
      .then((resp) => resp.json())
      .then((json) => {
        localStorage.setItem(
          'flags-cache',
          JSON.stringify({ ...cache, [env]: json })
        );
        return setFlags(json);
      })
      .catch(() => {
        localStorage.setItem(
          'flags-cache',
          JSON.stringify({ ...cache, [env]: [] })
        );
        setFlags([]);
      });
  }, [env, appId, token]);
  return { flags };
}

export function useLocalValues() {
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

export function useFilteredFlags() {
  const local = useLocalValues();
  const { flags: prefiltered } = useCloudBees();
  const [query, setQuery] = useState('');
  const flags = prefiltered
    .filter(
      ({ enabled, name, description }) =>
        enabled &&
        (!query ||
          `${name} ${description}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()))
    )
    .map((flag) => ({ ...flag, value: local.getValue(flag.name) }));
  return {
    loading: !prefiltered.length,
    flags,
    updateFlag: local.setValue,
    filter: { query, setQuery },
  };
}

export function usePinnedFlags(
  flags: ReturnType<typeof useCloudBees>['flags']
) {
  const [pinned, setPinned] = useState<typeof flags[number]['name'][]>([]);
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('pinned-flags') || '"[]"');
    setPinned(local);
  }, []);
  return {
    flags: flags.filter(({ name }) => pinned.includes(name)),
    pinned,
    togglePin: useCallback((name: string) => {
      setPinned((names) => {
        const newNames = names.includes(name)
          ? names.filter((pin) => pin !== name)
          : [...names, name];
        localStorage.setItem('pinned-flags', JSON.stringify(newNames));
        return newNames;
      });
    }, []),
  };
}
