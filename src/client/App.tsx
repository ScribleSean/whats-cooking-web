import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Login from "./login";
import RecipeApp from "./RecipeApp";
import Register from "./register";
import UserProfile from "./UserProfile";
import PublicProfile from "./PublicProfile";
import {
  BrowserRouter as Router,
  Routes,
  Navigate,
  Route,
  Link,
} from "react-router-dom";
import RecipeBuilder from "./RecipeBuilder";
import TopRecipes from "./toprecipes";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("authToken"));
  const [storedEmail, setStoredEmail] = useState<string>(() => localStorage.getItem("authEmail") || "");

  const effectiveEmail = isLoggedIn ? userEmail : storedEmail;
  const isAuthed = isLoggedIn || Boolean(token && storedEmail);

  const handleLogin = (userData: { email: string; token: string }) => {
    setIsLoggedIn(true);
    setUserEmail(userData.email);
    setStoredEmail(userData.email);
    setToken(userData.token);
    localStorage.setItem("authToken", userData.token);
    localStorage.setItem("authEmail", userData.email);
  };

  const handleLogout = async () => {
    try {
      await fetch("/logout", { method: "POST" });
    } finally {
      setIsLoggedIn(false);
      setUserEmail("");
      setStoredEmail("");
      setToken(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("authEmail");
    }
  };

  return (
    <Router>
      <div className="container">
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
          {/* Navbar brand */}
          <Link className="navbar-brand mx-2" to="/">
            What's Cooking?
          </Link>
          {/* Recipe Builder link with Bootstrap utility class for orange text */}
          <Link className="navbar-nav text-warning mx-2" to="/recipebuilder">
            Recipe Builder
          </Link>
          {isAuthed && (
            <Link className="navbar-nav text-warning mx-2" to="/profile">
              Profile
            </Link>
          )}

          
          <Link className="navbar-nav text-warning mx-2" to="/toprecipes">
            Top 10 Recipes By Statistics
          </Link>
          {isAuthed && (
            <button
              type="button"
              className="btn btn-sm btn-outline-light ms-auto me-2"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              isAuthed ? (
                <Navigate to="/recipe" />
              ) : (
                <Login onLogin={(userData) => handleLogin(userData)} />
              )
            }
          />
          <Route
            path="/recipe"
            element={
              isAuthed ? <RecipeApp email={effectiveEmail} /> : <Navigate to="/" />
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/users/:email" element={<PublicProfile />} />
          <Route
            path="/recipebuilder"
            element={
              isAuthed ? (
                <RecipeBuilder email={effectiveEmail} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/toprecipes"
            element={
              isAuthed ? (
                <TopRecipes email = {effectiveEmail}/>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/profile"
            element={
              isAuthed ? (
                <UserProfile email={effectiveEmail} />
              ) : (
                <Login onLogin={(userData) => handleLogin(userData)} />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
