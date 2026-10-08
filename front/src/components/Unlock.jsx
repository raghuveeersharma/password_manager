import { useState } from "react";
import AuthCard from "./AuthCard";
import { useAuth } from "../context/AuthContext";

// Shown when a session exists but the encryption key is not in memory
// (after a page reload or pressing Lock).
const Unlock = () => {
  const { email, unlock, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await unlock(password);
    } catch (err) {
      setError(err.status === 401 ? "Incorrect master password." : err.message);
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Vault locked" subtitle={email}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-purple-500 rounded-lg p-2"
          placeholder="Master password"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={busy}
          className="bg-purple-600 text-white rounded-lg p-2 hover:ring-2 disabled:opacity-60"
        >
          {busy ? "Unlocking…" : "Unlock"}
        </button>
      </form>
      <p className="text-sm text-center mt-4">
        <button className="text-purple-700 underline" onClick={logout}>
          Log out
        </button>
      </p>
    </AuthCard>
  );
};

export default Unlock;
