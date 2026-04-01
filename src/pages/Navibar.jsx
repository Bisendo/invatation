import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../helpers/authcontext';

function Navbar() {
  const { authState, setAuthState } = useContext(AuthContext);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setAuthState({ isAuthenticated: false, username: "", id: null });
  };

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-700">
          Mrimi Family
        </Link>
        <div className="space-x-6 text-sm text-gray-600 flex items-center">
          <Link to="/" className="hover:text-blue-600">Home</Link>


          {!authState?.isAuthenticated ? (
            <Link to="/login" className="hover:text-red-600">
              Dashboard
            </Link>
          ) : (
            <>
              <button onClick={handleLogout} className="hover:text-red-600">
                Logout
              </button>
              <span className="text-gray-800 font-medium">{authState.username}</span>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
