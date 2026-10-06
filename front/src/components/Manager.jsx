import { useEffect, useState } from "react";
import { RiLockPasswordFill } from "react-icons/ri";
import { IoMdEye } from "react-icons/io";
import { FaEyeSlash } from "react-icons/fa";
import { getStrength, generatePassword } from "../utils/password";
import TableComponent from "./TableComponent";
import { Toaster, toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";

const Manager = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordArray, setPasswordArray] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    site: "",
    username: "",
    password: "",
  });
  const secretKey = import.meta.env.VITE_SECRET_KEY;
  const strength = getStrength(form.password);

  // Check if the password is already saved in local storage
  // when the component mounts
  useEffect(() => {
    const passwords = localStorage.getItem("passwords");
    if (passwords) {
      setPasswordArray(JSON.parse(passwords));
    }
  }, []);

  const resetForm = () => {
    setForm({ site: "", username: "", password: "" });
    setEditingId(null);
    setShowPassword(false);
  };

  // Function to save a password (new entry, or an in-place update when editing)
  const savePassword = (e) => {
    e.preventDefault();
    if (form.site === "" || form.username === "" || form.password === "") {
      toast.error("All fields are required!");
      return;
    }
    const encryptedPassword = CryptoJS.AES.encrypt(
      form.password,
      secretKey
    ).toString();
    let updatedArray;
    if (editingId) {
      updatedArray = passwordArray.map((item) =>
        item.id === editingId
          ? { ...form, id: editingId, password: encryptedPassword }
          : item
      );
    } else {
      updatedArray = [
        ...passwordArray,
        { ...form, id: uuidv4(), password: encryptedPassword },
      ];
    }
    setPasswordArray(updatedArray);
    localStorage.setItem("passwords", JSON.stringify(updatedArray));
    toast.success(editingId ? "Password is updated!" : "Password is added!");
    resetForm();
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Function to delete a password
  // from the password array
  const deletePassword = (id) => {
    if (confirm("Are you sure you want to delete this password?")) {
      const updatedArray = passwordArray.filter((item) => item.id !== id);
      setPasswordArray(updatedArray);
      localStorage.setItem("passwords", JSON.stringify(updatedArray));
      if (editingId === id) resetForm();
      toast.success("Password is deleted!");
    }
  };

  // Load an entry into the form. The entry stays in the list until the
  // edit is saved, so cancelling never loses data.
  const handelEdit = (id) => {
    const selectedItem = passwordArray.find((item) => item.id === id);
    if (!selectedItem) return;
    let plain = "";
    try {
      plain = CryptoJS.AES.decrypt(selectedItem.password, secretKey).toString(
        CryptoJS.enc.Utf8
      );
    } catch {
      toast.error("Could not decrypt this password.");
      return;
    }
    setForm({
      site: selectedItem.site,
      username: selectedItem.username,
      password: plain,
    });
    setEditingId(id);
  };

  return (
    <>
      <div className="absolute inset-0 -z-10 h-full w-full bg-purple-100 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-fuchsia-400 opacity-20 blur-[100px]"></div>
      </div>
      <Toaster position="top-center" reverseOrder={false} />

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
            <button className="flex items-center bg-purple-600 w-fit text-white rounded-lg p-2 hover:ring-2">
              <lord-icon
                src="https://cdn.lordicon.com/jgnvfzqg.json"
                trigger="hover"
                className="mr-2"
              ></lord-icon>
              {editingId ? "Update Password" : "Add Password"}
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
        <TableComponent
          passwordArray={passwordArray}
          deletePassword={deletePassword}
          handelEdit={handelEdit}
        />
      </div>
    </>
  );
};

export default Manager;
