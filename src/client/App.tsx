import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Login from "./login";
import RecipeApp from "./RecipeApp";
import Register from "./register";
import UserProfile from "./UserProfile";
import {
  BrowserRouter as Router,
  Routes,
  Navigate,
  Route,
  Link,
} from "react-router-dom";
import RecipeBuilder from "./RecipeBuilder";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handleLogin = (userData: { email: string }) => {
    setIsLoggedIn(true);
    setUserEmail(userData.email);
  };

  return (
    <Router>
      <div className="container">
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
          {/* Navbar brand */}
          <Link className="navbar-brand" to="/">
            RecipeApp
          </Link>
          {/* Recipe Builder link with Bootstrap utility class for orange text */}
          <Link className="navbar-nav text-warning" to="/recipebuilder">
            Recipe Builder
          </Link>
          {isLoggedIn && (
            <Link className="navbar-nav text-warning" to="/profile">
              Profile
            </Link>
          )}
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <Navigate to="/recipe" />
              ) : (
                <Login onLogin={(userData) => handleLogin(userData)} />
              )
            }
          />
          <Route
            path="/recipe"
            element={
              isLoggedIn ? <RecipeApp email={userEmail} /> : <Navigate to="/" />
            }
          />
          <Route path="/register" element={<Register />} />
          <Route
            path="/recipebuilder"
            element={isLoggedIn ? <RecipeBuilder email = {userEmail} /> : <Navigate to="/" />}
          />
          <Route
            path="/profile"
            element={
              isLoggedIn ? (
                <UserProfile email={userEmail} />
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
