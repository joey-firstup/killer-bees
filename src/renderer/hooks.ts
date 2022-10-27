import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const ALL_ENVS = ['us-east-1-prod-sc', 'us-east-1-stg-pub'] as const;
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

export function useCloudBees() {
  const { appId, token } = window.electron;
  const [flags, setFlags] = useState<
    { name: string; description: string; enabled: boolean; value: boolean }[]
  >([]);
  const { env } = useContext(EnvironmentsContext);
  useEffect(() => {
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
      .then((json) => setFlags(json));
  }, []);
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
