import React from "react";
import { FaGithubSquare } from "react-icons/fa";

const Navbar = () => {
  return (
    <nav className="bg-slate-800 p-1 md:px-5 text-white sticky top-0 z-50 shadow-md">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        {/* Logo */}
        <div className="logo font-bold text-2xl md:text-3xl">
          <span className="text-purple-600 text-3xl md:text-4xl">&lt;</span>
          pass
          <span className="text-purple-600 text-2xl md:text-3xl">OP/&gt;</span>
        </div>

        {/* GitHub Link */}
        <button className="flex flex-col items-center hover:scale-110 text-2xl md:text-4xl transition-transform duration-200">
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
