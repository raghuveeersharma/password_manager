import React from "react";

const TableComponent = ({ passwordArray }) => {
  return (
    <div>
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
          <tbody className="bg-green-100">
            {passwordArray.map((item, index) => (
              <tr key={index}>
                <td className="text-center min-w-40 cursor-pointer">
                  <a href="item.site" target="_blank">
                    {item.site}
                  </a>
                </td>
                <td className="text-center w-40">{item.username}</td>
                <td className="text-center w-40">{item.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TableComponent;
