import React, { useEffect, useState } from "react";
import { IoMdEye } from "react-icons/io";
import { FaEyeSlash } from "react-icons/fa";
import TableComponent from "./TableComponent";
import { Toaster, toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

const Manager = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordArray, setPasswordArray] = useState("");

  useEffect(() => {
    let passwords = localStorage.getItem("passwords");
    if (passwords) {
      setPasswordArray(JSON.parse(passwords));
    }
  }, []);

  const [form, setForm] = useState({
    site: "",
    username: "",
    password: "",
  });

  const savePassword = (e) => {
    e.preventDefault();
    setPasswordArray([...passwordArray, { ...form, id: uuidv4() }]);
    localStorage.setItem(
      "passwords",
      JSON.stringify([...passwordArray, { ...form, id: uuidv4() }])
    );
    console.log([...passwordArray, { ...form, id: uuidv4() }]);
    toast.success("password is added!");
  };
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const deletePassword = (id) => {
    // Update state and derive the new password array
    const updatedArray = passwordArray.filter((item) => item.id !== id);
    setPasswordArray(updatedArray);

    // Update localStorage after state is updated
    localStorage.setItem("passwords", JSON.stringify(updatedArray));
    console.log(updatedArray);

    toast.success("Password is deleted!");
  };

  const handelEdit = (id) => {
    const newPasswords = passwordArray.map((item) => {
      if (item.id === id) {
        return { ...item, ...form };
      }
      return item;
    });
    setPasswordArray(newPasswords);
    localStorage.setItem("passwords", JSON.stringify(newPasswords));
    toast.success("password is updated!");
  };
  return (
    <>
      <div className="absolute inset-0 -z-10 h-full w-full bg-green-100 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-fuchsia-400 opacity-20 blur-[100px]"></div>
      </div>
      <Toaster position="top-center" reverseOrder={false} />

      <form
        className="container mx-auto mt-5 max-w-4xl  p-3"
        onSubmit={savePassword}
      >
        <div className="logo font-bold text-2xl text-center">
          <span className="text-green-800 text-4xl">&lt;</span>
          pass
          <span className="text-green-800 text-2xl">OP/&gt;</span>
        </div>
        <div className="text-center text-green-700 mt-1">
          <p className="">password manager is on duty </p>
        </div>
        <div className="flex flex-col gap-3  text-black mt-1">
          <input
            type="text"
            name="site"
            value={form.site}
            onChange={handleChange}
            className="border border-green-500  rounded-lg p-1"
            placeholder="Enter WebSite URL"
          />
          <div className="mt-4 flex gap-8 max-w-full border justify-between">
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="border border-green-500 rounded-lg p-1 w-96"
              placeholder="Enter Username"
            />
            <div className=" relative">
              {" "}
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className=" border border-green-500 rounded-lg p-1 w-80"
                placeholder="Enter Password"
              />
              <span className="absolute right-2 top-[25%] cursor-pointer">
                {showPassword ? (
                  <FaEyeSlash onClick={() => setShowPassword(false)} />
                ) : (
                  <IoMdEye onClick={() => setShowPassword(true)} />
                )}
              </span>
            </div>
          </div>
          <button
            className="flex items-center  bg-green-500 rounded-2xl w-fit  cursor-pointer p-2  m-auto"
            onClick={handleChange}
          >
            <lord-icon
              src="https://cdn.lordicon.com/jgnvfzqg.json"
              trigger="hover"
            ></lord-icon>
            add password
          </button>
        </div>
      </form>
      <div className=" mx-auto mt-5 max-w-4xl">
        <h1 className="text-xl font-bold">your passwords</h1>
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
