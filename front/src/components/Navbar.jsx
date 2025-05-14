import cryptoJs from "crypto-js";
import { useEffect, useState } from "react";
import { FaGithubSquare } from "react-icons/fa";

const Navbar = () => {
  const [webPassSaved, setWebPassSaved] = useState(false);
  // Check if the password is already saved in local storage
  // when the component mounts
  useEffect(() => {
    const storedPassword = localStorage.getItem("PassManager");
    if (storedPassword) {
      setWebPassSaved(true);
    }
  }, []);
  // Function to handle adding a password
  // to the website
  const handelAddPassword = () => {
    const secretKey = import.meta.env.VITE_SECRET_KEY;
    const password = prompt(
      "Enter password for the website and do not forgot it as it is use for accessing the passwords of the website:"
    );
    if (!password) {
      alert("Password is required!");
      return;
    }
    const encryptedPassword = cryptoJs.AES.encrypt(
      password,
      secretKey
    ).toString();
    localStorage.setItem("PassManager", encryptedPassword);
    setWebPassSaved(true);
  };
  return (
    <nav className="bg-slate-800 p-1 px-5 text-white sticky top-0 z-50 shadow-md">
      <div className="flex justify-between items-center max-w-6xl mx-auto ">
        {/* Logo */}
        <div className="logo font-bold text-2xl md:text-3xl">
          <span className="text-purple-600 text-3xl md:text-4xl">&lt;</span>
          pass
          <span className="text-purple-600 text-2xl md:text-3xl">OP/&gt;</span>
        </div>
        {/* web site password */}
        <div className=" bg-slate-600 text-xs md:text-lg text-white rounded-xl p-2 hover:bg-slate-700 transition-all duration-300">
          {webPassSaved ? (
            <button className="text-green-500 cursor-not-allowed">
              Password is added
            </button>
          ) : (
            <button onClick={handelAddPassword}>Add password to website</button>
          )}
        </div>

        {/* GitHub Link */}
        <button className="flex flex-col items-center text-gray-200 hover:text-white text-2xl md:text-4xl transition-transform duration-200">
          <a
            href="https://github.com/raghuveeersharma/password_manager"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center"
          >
            <FaGithubSquare />
            <p className="text-xs md:text-sm mt-1">GitHub</p>
          </a>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
