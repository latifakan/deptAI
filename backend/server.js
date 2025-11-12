import express from "express";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const adapter = new JSONFile("db.json");
const defaultData = { users: {} };
const db = new Low(adapter, defaultData);

await db.read(); // Read data (creates file with defaults if not exists)

app.use(bodyParser.json());
app.use(cors());

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (db.data.users[username]) {
    return res.status(400).json({ message: "User already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  db.data.users[username] = { hashedPassword, plan: null };
  await db.write();
  res.json({ message: "Signed up successfully" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = db.data.users[username];
  if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  res.json({ message: "Logged in", username });
});

app.post("/save-plan", async (req, res) => {
  const { username, plan } = req.body;
  if (!db.data.users[username]) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  db.data.users[username].plan = plan;
  await db.write();
  res.json({ message: "Plan saved" });
});

app.get("/load-plan/:username", (req, res) => {
  const { username } = req.params;
  const user = db.data.users[username];
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json({ plan: user.plan });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
