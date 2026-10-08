import { useCallback, useEffect, useState } from "react";
import { RiLockPasswordFill } from "react-icons/ri";
import { IoMdEye } from "react-icons/io";
import { FaEyeSlash } from "react-icons/fa";
import { getStrength, generatePassword } from "../utils/password";
import TableComponent from "./TableComponent";
import { toast } from "react-hot-toast";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { decrypt, encrypt } from "../crypto/vault";
import {
  decryptLegacy,
  legacyKeyAvailable,
  readLegacyItems,
  writeLegacyRemainder,
} from "../crypto/legacy";

const Manager = () => {
  const { encKey } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [legacyCount, setLegacyCount] = useState(() =>
    legacyKeyAvailable ? readLegacyItems().length : 0
  );
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    site: "",
    username: "",
    password: "",
  });
  const strength = getStrength(form.password);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setItems(await api.vault.list());
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setForm({ site: "", username: "", password: "" });
    setEditingId(null);
    setShowPassword(false);
  };

  // Save a password (new entry, or an in-place update when editing).
  // The password is encrypted in the browser; the server only receives ciphertext.
  const savePassword = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (form.site === "" || form.username === "" || form.password === "") {
      toast.error("All fields are required!");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        site: form.site,
        username: form.username,
        ...(await encrypt(encKey, form.password)),
      };
      if (editingId) {
        const saved = await api.vault.update(editingId, payload);
        setItems((prev) => prev.map((item) => (item.id === editingId ? saved : item)));
      } else {
        const saved = await api.vault.create(payload);
        setItems((prev) => [saved, ...prev]);
      }
      toast.success(editingId ? "Password is updated!" : "Password is added!");
      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const deletePassword = async (id) => {
    if (!confirm("Are you sure you want to delete this password?")) return;
    try {
      await api.vault.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
      toast.success("Password is deleted!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Load an entry into the form. The entry stays in the list until the
  // edit is saved, so cancelling never loses data.
  const handelEdit = async (id) => {
    const selectedItem = items.find((item) => item.id === id);
    if (!selectedItem) return;
    try {
      const plain = await decrypt(encKey, selectedItem.password_ciphertext, selectedItem.iv);
      setForm({
        site: selectedItem.site,
        username: selectedItem.username,
        password: plain,
      });
      setEditingId(id);
    } catch {
      toast.error("Could not decrypt this password.");
    }
  };

  // One-time import of entries saved in this browser before the backend existed.
  // Entries are removed from localStorage only after the server accepted them.
  const importLegacy = async () => {
    setImporting(true);
    const failed = [];
    const imported = [];
    for (const old of readLegacyItems()) {
      try {
        const payload = {
          site: old.site,
          username: old.username,
          ...(await encrypt(encKey, decryptLegacy(old.password))),
        };
        imported.push(await api.vault.create(payload));
      } catch {
        failed.push(old);
      }
    }
    writeLegacyRemainder(failed);
    setLegacyCount(failed.length);
    setItems((prev) => [...imported, ...prev]);
    setImporting(false);
    if (failed.length === 0) toast.success(`Imported ${imported.length} passwords!`);
    else toast.error(`Imported ${imported.length}, ${failed.length} failed. They are still saved in this browser.`);
  };

  return (
    <>
      <div className="absolute inset-0 -z-10 h-full w-full bg-purple-100 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-fuchsia-400 opacity-20 blur-[100px]"></div>
      </div>
      <form
        className="container mx-auto max-w-4xl p-3 "
        onSubmit={savePassword}
      >
        <div className="logo font-bold text-center">
          <span className="text-purple-600 text-4xl">&lt;</span>
          pass
          <span className="text-purple-600 text-2xl">OP/&gt;</span>
        </div>
        <div className="text-center text-black mt-1 relative">
          <p>
            Password manager is on duty{" "}
            <span className="absolute">
              <lord-icon
                src="https://cdn.lordicon.com/pdwpcpva.json"
                trigger="loop"
                delay="2500"
                colors="primary:#ffc738,secondary:#7166ee,tertiary:#b26836"
                style={{ width: "23px", height: "23px" }}
              ></lord-icon>
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-5 text-black mt-1">
          <input
            type="text"
            name="site"
            value={form.site}
            onChange={handleChange}
            className="border border-purple-500 rounded-lg p-1 w-full"
            placeholder="Enter Website URL"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="border border-purple-500 rounded-lg p-1 w-full"
              placeholder="Enter Username"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="border border-purple-500 rounded-lg p-1 w-full"
                placeholder="Enter Password"
              />
              <span
                className="absolute right-3 top-[25%] cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <IoMdEye />}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 -mt-2">
            <button
              type="button"
              className="text-sm text-purple-700 underline"
              onClick={() => {
                setForm({ ...form, password: generatePassword() });
                setShowPassword(true);
              }}
            >
              Generate strong password
            </button>
            {form.password && (
              <div className="flex items-center gap-2 text-sm flex-1">
                <div className="h-2 flex-1 rounded bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all`}
                    style={{ width: `${strength.percent}%` }}
                  ></div>
                </div>
                <span>{strength.label}</span>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-3">
            <button
              disabled={saving}
              className="flex items-center bg-purple-600 w-fit text-white rounded-lg p-2 hover:ring-2 disabled:opacity-60"
            >
              <lord-icon
                src="https://cdn.lordicon.com/jgnvfzqg.json"
                trigger="hover"
                className="mr-2"
              ></lord-icon>
              {saving ? "Saving…" : editingId ? "Update Password" : "Add Password"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-black rounded-lg p-2 hover:ring-2"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>
      <div className="container mx-auto mt-5 max-w-4xl">
        <h1 className="text-xl font-bold ml-6 md:ml-3">
          Your Passwords <RiLockPasswordFill className="inline-block text-lg" />
        </h1>
        {legacyCount > 0 && (
          <div className="mx-3 mt-2 p-3 rounded-lg bg-amber-100 text-sm flex flex-wrap items-center gap-3">
            <span>
              Found {legacyCount} password{legacyCount === 1 ? "" : "s"} saved in this browser
              from the old version.
            </span>
            <button
              onClick={importLegacy}
              disabled={importing}
              className="bg-purple-600 text-white rounded-lg px-3 py-1 hover:ring-2 disabled:opacity-60"
            >
              {importing ? "Importing…" : "Import to my account"}
            </button>
          </div>
        )}
        {loading ? (
          <p className="text-center mt-3 text-gray-600">Loading your passwords…</p>
        ) : loadError ? (
          <div className="text-center mt-3">
            <p className="text-red-600">{loadError}</p>
            <button onClick={loadItems} className="mt-2 text-purple-700 underline">
              Try again
            </button>
          </div>
        ) : (
          <TableComponent
            items={items}
            encKey={encKey}
            deletePassword={deletePassword}
            handelEdit={handelEdit}
          />
        )}
      </div>
    </>
  );
};

export default Manager;
