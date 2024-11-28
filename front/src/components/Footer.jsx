import React from "react";

const Footer = () => {
  return (
    <div>
      <div className="bg-slate-800 flex flex-col items-center p-3 text-white">
        <div className="logo font-bold text-2xl ">
          <span className="text-purple-600 text-4xl">&lt;</span>
          pass
          <span className="text-purple-600 text-2xl">OP/&gt;</span>
        </div>
        <div className="text-xs  underline hover:scale-105 cursor-pointer">
          <a
            href="https://www.linkedin.com/in/raghuveer-sharma-810124252/"
            target="_blank"
          >
            Raghuveer Sharma
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
