import { useState } from "react";
import AuthCard from "./AuthCard";
import { useAuth } from "../context/AuthContext";
import { getStrength } from "../utils/password";

const MIN_LENGTH = 12;

const Register = ({ onSwitch }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const strength = getStrength(password);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < MIN_LENGTH) {
      setError(`Master password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await register(email, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Create account" subtitle="Your master password encrypts everything in your browser.">
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
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-purple-500 rounded-lg p-2"
          placeholder={`Master password (min. ${MIN_LENGTH} characters)`}
        />
        {password && (
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 flex-1 rounded bg-gray-200 overflow-hidden">
              <div
                className={`h-full ${strength.color} transition-all`}
                style={{ width: `${strength.percent}%` }}
              ></div>
            </div>
            <span>{strength.label}</span>
          </div>
        )}
        <input
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="border border-purple-500 rounded-lg p-2"
          placeholder="Confirm master password"
        />
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
          There is no recovery: the server never sees your master password, so if you forget it your
          saved passwords cannot be decrypted. It also cannot be changed later.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={busy}
          className="bg-purple-600 text-white rounded-lg p-2 hover:ring-2 disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-center mt-4">
        Already registered?{" "}
        <button className="text-purple-700 underline" onClick={onSwitch}>
          Log in
        </button>
      </p>
    </AuthCard>
  );
};

export default Register;
