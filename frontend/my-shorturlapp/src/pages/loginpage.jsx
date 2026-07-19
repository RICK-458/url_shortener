import React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

function Loginpage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const googleButton = useRef(null);

  const finishLogin = (data) => {
    localStorage.setItem("token", data.token);
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      if (isLogin) {
        const response = await axios.post("http://localhost:3000/auth/login", {
          email,
          password,
        });
        finishLogin(response.data);
      } else {
        const response = await axios.post("http://localhost:3000/auth/signup", {
          username,
          email,
          password,
        });
        finishLogin(response.data);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "something went wrong");
    }
  };

  useEffect(() => {
    const setupGoogleButton = () => {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const res = await axios.post("http://localhost:3000/auth/google", {
              credential: response.credential,
            });
            finishLogin(res.data);
          } catch (error) {
            setErrorMsg(error.response?.data?.message || "google login failed");
          }
        },
      });
      window.google.accounts.id.renderButton(googleButton.current, {
        theme: "outline",
        size: "large",
        width: 250,
      });
    };

    if (window.google) {
      setupGoogleButton();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = setupGoogleButton;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="container">
      <div className="card login-card">
        <h1 className="title-text">{isLogin ? "Login" : "Create Account"}</h1>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              className="login-input"
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}

          <input
            className="login-input"
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="login-input"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="submit-button" type="submit">
            {isLogin ? "login" : "sign up"}
          </button>
        </form>

        {errorMsg && <p className="error-text">{errorMsg}</p>}

        <p className="description">or</p>
        <div ref={googleButton}></div>

        <p className="description">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign up" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Loginpage;
