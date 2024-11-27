import React from "react";
import { FaCopy } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";

const TableComponent = ({ passwordArray }) => {
  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      {passwordArray.length === 0 ? (
        <p className="text-center mt-2">No passwords saved</p>
      ) : (
        <table className="w-full mt-1 rounded overflow-hidden">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="p-1">Site</th>
              <th className="p-1">Username</th>
              <th className="p-1">Password</th>
            </tr>
          </thead>
          <tbody className="bg-green-100 ">
            {passwordArray.map((item, index) => (
              <tr key={index} className="hover:bg-green-200">
                <td className="text-center min-w-40 cursor-pointer">
                  <a href="item.site" target="_blank">
                    {item.site}
                  </a>
                </td>
                <td className="text-center w-40">{item.username}</td>
                <td className="text-center w-40 relative">
                  {item.password}{" "}
                  <span className="absolute top-1 right-1 cursor-pointer text-sm">
                    <FaCopy
                      onClick={() => {
                        navigator.clipboard.writeText(item.password);
                        toast.success("Copied to clipboard!");
                      }}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TableComponent;
