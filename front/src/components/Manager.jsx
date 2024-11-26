import React from "react";

const Manager = () => {
  return (
    <>
      <div className="absolute inset-0 -z-10 h-full w-full bg-green-100 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-fuchsia-400 opacity-20 blur-[100px]"></div>
      </div>

      <div className="container mx-auto mt-5 max-w-3xl  p-2">
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
            className="border border-green-500  rounded-lg p-1"
            placeholder="Enter WebSite URL"
          />
          <div className="mt-4 flex gap-8">
            <input
              type="text"
              className="border border-green-500 rounded-lg p-1"
              placeholder="Enter Username"
            />
            <div className=" relative">
              {" "}
              <input
                type="password"
                className="w-fit border border-green-500 rounded-lg p-1"
                placeholder="Enter Password"
              />
              <span className="absolute right-2 top-1 cursor-pointer">
                show
              </span>
            </div>
          </div>
          <button className="flex items-center  bg-green-500 rounded-2xl w-fit p-2  m-auto">
            <lord-icon
              src="https://cdn.lordicon.com/jgnvfzqg.json"
              trigger="hover"
            ></lord-icon>
            add password
          </button>
        </div>
      </div>
    </>
  );
};

export default Manager;
