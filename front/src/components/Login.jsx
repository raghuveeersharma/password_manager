import { useState } from "react";
import AuthCard from "./AuthCard";
import { useAuth } from "../context/AuthContext";

const Login = ({ onSwitch }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Log in" subtitle="Use your email and master password.">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-purple-500 rounded-lg p-2"
          placeholder="Email"
        />
        <input
          type="password"
          autoComplete="current-password"
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
          {busy ? "Unlocking…" : "Log in"}
        </button>
      </form>
      <p className="text-sm text-center mt-4">
        No account?{" "}
        <button className="text-purple-700 underline" onClick={onSwitch}>
          Create one
        </button>
      </p>
    </AuthCard>
  );
};

export default Login;
