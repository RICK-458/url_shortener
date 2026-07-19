import React from "react";
import "./App.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function App() {
  const [originalurl, setOriginalUrl] = useState("");
  const [shorturl, setShortUrl] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `http://localhost:3000/`,
        { original_url: originalurl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShortUrl(response.data.shorturl);
      setOriginalUrl("");
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
      console.log(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title-text">ShortyRL</h1>

        <form onSubmit={handleSubmit}>
          <div className="url-placeholder">
            <input
              type="text"
              placeholder="paste your url ;)"
              value={originalurl}
              onChange={(e) => setOriginalUrl(e.target.value)}
            />
          </div>

          <button className="submit-button " type="submit">submit</button>
        </form>
        {shorturl && (
          <div className="shorturl yellowbox">
            <a href={shorturl} target="_blank" rel="noreferrer">{shorturl}</a>
          </div>
        )}

        <p className="description">
          Short links. Big impact. Turn any long, ugly URL into something
          clean, fast, and shareable — in one click.
        </p>

        <p className="description">
          <span className="toggle-link" onClick={handleLogout}>logout</span>
        </p>
      </div>
    </div>
  );
}

export default App;
