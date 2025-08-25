import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { io } from "socket.io-client";
const API_URL = "http://localhost:5000/queue";

function App() {
  const [name, setName] = useState("");
  const [service, setService] = useState("");
  const [queue, setQueue] = useState([]);

  // Fetch current queue on load
  
useEffect(() => {
  const socket = io("http://localhost:5000");
  socket.on("queueUpdated", fetchQueue);
  return () => socket.disconnect();
}, []);

  useEffect(() => {
    fetchQueue();
  }, []);
  
  useEffect(() => {
  if (queue.length > 0) {
    const first = queue[0];
    if (first.name.toLowerCase() === name.toLowerCase()) {
      // Play sound
      const audio = new Audio("/ding.mp3"); // put a ding.mp3 in public folder
      audio.play();

      // Browser notification
      if (Notification.permission === "granted") {
        new Notification("🚀 Queue Update", {
          body: "It's your turn now!",
        });
      } else {
        Notification.requestPermission();
      }

      alert("⏰ It's your turn now!");
    }
  }
}, [queue]);



  const fetchQueue = async () => {
    try {
      const res = await axios.get(API_URL);
      setQueue(res.data);
    } catch (err) {
      console.error("Error fetching queue", err);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim() || !service.trim()) return;

    try {
      await axios.post(API_URL, { name, service });
      setName("");
      setService("");
      fetchQueue(); // refresh list
    } catch (err) {
      console.error("Error joining queue", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchQueue();
    } catch (err) {
      console.error("Error deleting", err);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>Digital Queue Buddy</h1>
        <p>Join a queue, track your position, get notified.</p>
      </header>

      <main className="content">
        <section className="card">
          <h2>Join Queue</h2>
          <form onSubmit={handleJoin}>
            <label>
              Your Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Priya"
              />
            </label>
            <label>
              Service / Counter
              <input
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g., General Desk"
              />
            </label>
            <button type="submit">Join</button>
          </form>
        </section>

        <section className="card">
          <h2>Current Queue Status</h2>
          {queue.length === 0 ? (
            <p>No one in queue.</p>
          ) : (
            <ul className="list">
  {queue.map((q, index) => {
    const isMe = q.name.toLowerCase() === name.toLowerCase();
    return (
      <li
        key={q._id}
        className={isMe ? "highlight-me" : ""}
      >
        <strong>#{index + 1}</strong> {q.name} — {q.service}
        {isMe && <span className="tag"> 👈 You are #{index + 1}</span>}
        <button
          onClick={() => {
            const newService = prompt("Enter new service:", q.service);
            if (newService) {
              axios.put(`${API_URL}/${q._id}`, { service: newService })
                .then(fetchQueue)
                .catch(console.error);
            }
          }}
        >
          Update
        </button>
        <button onClick={() => handleDelete(q._id)}>Done</button>
      </li>
    );
  })}
</ul>


          )}
        </section>
      </main>
    </div>
  );
}

export default App;
