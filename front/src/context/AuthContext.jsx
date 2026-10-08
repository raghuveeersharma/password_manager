import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, refreshSession, setAccessToken, setSessionExpiredHandler } from "../api/client";
import { KDF_PARAMS, deriveKeys, generateSalt } from "../crypto/vault";

// status: "loading"   - checking for an existing session (refresh cookie)
//         "anonymous" - not logged in
//         "locked"    - logged in, but the encryption key is not in memory (page reload / Lock)
//         "unlocked"  - logged in with the encryption key in memory
const AuthContext = createContext(null);

const normalizeEmail = (email) => email.trim().toLowerCase();

export const AuthProvider = ({ children }) => {
  const [status, setStatus] = useState("loading");
  const [email, setEmail] = useState(null);
  const [kdf, setKdf] = useState(null); // { salt, params } for unlocking
  const [encKey, setEncKey] = useState(null);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setEncKey(null);
    setEmail(null);
    setKdf(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    let cancelled = false;
    (async () => {
      try {
        const session = await refreshSession();
        const me = await api.me();
        if (cancelled) return;
        setEmail(me.email);
        setKdf({ salt: session.kdf_salt, params: session.kdf_params });
        setStatus("locked");
      } catch {
        if (!cancelled) setStatus("anonymous");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const finishLogin = (userEmail, data, keys) => {
    setEmail(userEmail);
    setKdf({ salt: data.kdf_salt, params: data.kdf_params });
    setEncKey(keys.encKey);
    setStatus("unlocked");
  };

  const login = useCallback(async (rawEmail, masterPassword) => {
    const userEmail = normalizeEmail(rawEmail);
    const { kdf_salt, kdf_params } = await api.kdfParams(userEmail);
    const keys = await deriveKeys(masterPassword, kdf_salt, kdf_params);
    const data = await api.login(userEmail, keys.authKey);
    finishLogin(userEmail, data, keys);
  }, []);

  const register = useCallback(async (rawEmail, masterPassword) => {
    const userEmail = normalizeEmail(rawEmail);
    const salt = generateSalt();
    const keys = await deriveKeys(masterPassword, salt, KDF_PARAMS);
    await api.register({
      email: userEmail,
      auth_key: keys.authKey,
      kdf_salt: salt,
      kdf_params: KDF_PARAMS,
    });
    const data = await api.login(userEmail, keys.authKey);
    finishLogin(userEmail, data, keys);
  }, []);

  // The server has no "verify master password" endpoint, so unlocking re-runs login:
  // a wrong password must be rejected before it could encrypt anything with a bad key.
  const unlock = useCallback(
    async (masterPassword) => {
      const keys = await deriveKeys(masterPassword, kdf.salt, kdf.params);
      const data = await api.login(email, keys.authKey);
      finishLogin(email, data, keys);
    },
    [email, kdf]
  );

  const lock = useCallback(() => {
    setEncKey(null);
    setStatus("locked");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Clear local state even if the server could not be reached.
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ status, email, encKey, login, register, unlock, lock, logout }),
    [status, email, encKey, login, register, unlock, lock, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
