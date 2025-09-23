import React from "react";
import { GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut } from "firebase/auth";
import { auth } from "./firebase";

const Login = ({ user }) => {
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Google Sign-In error:", err);
    }
  };

  const signInAnon = async () => {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.error("Anonymous Sign-In error:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-Out error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      {user ? (
        <div className="flex flex-col items-center p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700 max-w-sm w-full">
          <h2 className="text-2xl font-bold mb-4">Welcome Back</h2>
          <p className="mb-4 text-center">Signed in as: <span className="font-semibold text-purple-400">{user.displayName || "Anonymous"}</span></p>
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700 max-w-sm w-full">
          <h2 className="text-3xl font-bold mb-6">MLB Showdown</h2>
          <button
            onClick={signInWithGoogle}
            className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-colors flex items-center justify-center space-x-2"
          >
            <span>Sign in with Google</span>
          </button>
          <button
            onClick={signInAnon}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-full transition-colors"
          >
            Continue as Guest
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
