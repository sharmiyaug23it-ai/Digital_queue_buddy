const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// ================== MongoDB ==================
mongoose.connect("mongodb://127.0.0.1:27017/queueDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

const queueSchema = new mongoose.Schema({
  name: String,
  service: String,
  createdAt: { type: Date, default: Date.now }
});

const Queue = mongoose.model("Queue", queueSchema);

// ================== Express + Socket.io ==================
const app = express();
const server = http.createServer(app);   // <--- FIX (server must be created)
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 5000;

app.use(cors());
app.use(express.json());

// ================== Routes ==================

// CREATE
app.post("/queue", async (req, res) => {
  try {
    const item = await Queue.create(req.body);
    io.emit("queueUpdated");  // notify all clients
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ
app.get("/queue", async (req, res) => {
  try {
    const all = await Queue.find().sort({ createdAt: 1 });
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put("/queue/:id", async (req, res) => {
  try {
    const updated = await Queue.findByIdAndUpdate(
      req.params.id,
      { service: req.body.service },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Entry not found" });
    io.emit("queueUpdated");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete("/queue/:id", async (req, res) => {
  try {
    await Queue.findByIdAndDelete(req.params.id);
    io.emit("queueUpdated");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== Server ==================
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
