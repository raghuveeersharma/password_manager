import React from "react";

const Navbar = () => {
  return (
    <nav className="bg-slate-800 flex justify-between p-3 text-white items-center">
      <div className="logo font-bold text-2xl">
        <span className="text-green-800 text-4xl">&lt;</span>
        pass
        <span className="text-green-800 text-2xl">OP/&gt;</span>
      </div>
      <ul>
        <li className="flex gap-4">
          <a href="/" className="hover:font-bold">
            home
          </a>
          <a href="/" className="hover:font-bold">
            about
          </a>
          <a href="/" className="hover:font-bold">
            contact
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
