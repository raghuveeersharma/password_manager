import React from "react";

const Footer = () => {
  return (
    <footer className="bg-slate-800 p-2 text-white  w-full">
      <div className="flex flex-col items-center max-w-5xl mx-auto space-y-3">
        {/* Logo */}
        <div className="logo font-bold text-2xl md:text-4xl flex justify-center md:justify-start">
          <span className="text-purple-600">&lt;</span>
          pass
          <span className="text-purple-600">OP/&gt;</span>
        </div>

        {/* Developer Link */}
        <div className="text-xs md:text-sm underline hover:scale-105 cursor-pointer text-center">
          <a
            href="https://www.linkedin.com/in/raghuveer-sharma-810124252/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform duration-200 hover:text-purple-400"
          >
            Raghuveer Sharma
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
