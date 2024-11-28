import React from "react";
import { FaGithubSquare } from "react-icons/fa";

const Navbar = () => {
  return (
    <nav className="bg-slate-800 flex justify-between p-3 px-5 text-white items-center">
      <div className="logo font-bold text-2xl">
        <span className="text-purple-600 text-4xl">&lt;</span>
        pass
        <span className="text-purple-600 text-2xl">OP/&gt;</span>
      </div>
      <ul>
        <li className="flex gap-5">
          <a href="/" className="hover:font-bold">
            home
          </a>
          <a href="/" className="hover:font-bold">
            about
          </a>
        </li>
      </ul>
      <button className="hover:scale-110 text-4xl ">
        <a
          href="https://github.com/raghuveeersharma/password_manager"
          target="_blank"
          className=""
        >
          <FaGithubSquare />
          <p className="text-xs ">github</p>
        </a>
      </button>
    </nav>
  );
};

export default Navbar;
