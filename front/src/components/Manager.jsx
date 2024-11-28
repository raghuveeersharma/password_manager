import React, { useEffect, useState } from "react";
import { RiLockPasswordFill } from "react-icons/ri";
import { IoMdEye } from "react-icons/io";
import { FaEyeSlash } from "react-icons/fa";
import TableComponent from "./TableComponent";
import { Toaster, toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

const Manager = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordArray, setPasswordArray] = useState([]);

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
    const newPassword = { ...form, id: uuidv4() };
    const updatedArray = [...passwordArray, newPassword];
    setPasswordArray(updatedArray);
    localStorage.setItem("passwords", JSON.stringify(updatedArray));
    console.log(updatedArray);
    toast.success("Password is added!");
    setForm({
      site: "",
      username: "",
      password: "",
    });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const deletePassword = (id) => {
    let con = confirm("Are you sure you want to delete this password?");
    if (con) {
      // Update state and derive the new password array
      const updatedArray = passwordArray.filter((item) => item.id !== id);
      setPasswordArray(updatedArray);

      // Update localStorage after state is updated
      localStorage.setItem("passwords", JSON.stringify(updatedArray));
      console.log(updatedArray);
      toast.success("Password is deleted!");
    }
  };

  const handelEdit = (id) => {
    const selectedItem = passwordArray.find((item) => item.id === id);
    if (selectedItem) {
      setForm(selectedItem);
    }
    const updatedArray = passwordArray.filter((item) => item.id !== id);
    setPasswordArray(updatedArray);
  };

  return (
    <>
      <div className="absolute inset-0 -z-10 h-full w-full bg-purple-100 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-fuchsia-400 opacity-20 blur-[100px]"></div>
      </div>
      <Toaster position="top-center" reverseOrder={false} />

      <form
        className="container mx-auto mt-5 max-w-4xl  p-3"
        onSubmit={savePassword}
      >
        <div className="logo font-bold text-2xl text-center">
          <span className="text-purple-600 text-4xl">&lt;</span>
          pass
          <span className="text-purple-600 text-2xl">OP/&gt;</span>
        </div>
        <div className="text-center text-black mt-1 relative">
          <p className="">
            password manager is on duty{" "}
            <span className="absolute top-0 ">
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
        <div className="flex flex-col gap-3  text-black mt-1">
          <input
            type="text"
            name="site"
            value={form.site}
            onChange={handleChange}
            className="border border-purple-500  rounded-lg p-1"
            placeholder="Enter WebSite URL"
          />
          <div className="mt-4 flex gap-8 max-w-full border justify-between">
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="border border-purple-500 rounded-lg p-1 w-96"
              placeholder="Enter Username"
            />
            <div className=" relative">
              {" "}
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className=" border border-purple-500 rounded-lg p-1 w-80"
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
            className="flex items-center  bg-purple-600 text-white rounded-2xl w-fit  cursor-pointer p-2  m-auto  hover:ring-2"
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
      <div className=" mx-auto mt-5 max-w-4xl relative">
        <h1 className="text-xl font-bold ">
          your passwords{" "}
          <span className="absolute top-1 ">
            <RiLockPasswordFill />
          </span>{" "}
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
