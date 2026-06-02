const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { exec } = require("child_process");

const app = express();
const PORT = 3000;
const JWT_SECRET = "governor-super-secret-key-2026";

app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/governorDB")
  .then(() => console.log("Connected to Governor Database"))
  .catch((err) => console.error("Database connection error:", err));

const assetSchema = new mongoose.Schema({
  hostname: { type: String, required: true },
  ipAddress: { type: String, required: true, unique: true },
  osVersion: String,
  rackPosition: String,
  datacenter: String,
  hardwareModel: String,
  kernel: String,
  coreCount: String,
  ramMB: String,
  vlcPluginNotify: String,
  vlcGuiQt: String,
  vlcGuiSkins2: String,
});
assetSchema.index({ hostname: "text", osVersion: "text" });
const Asset = mongoose.model("Asset", assetSchema);

const datacenterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: String,
});
const Datacenter = mongoose.model("Datacenter", datacenterSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

async function createAdminUser() {
  await User.deleteOne({ username: "admin" });
  const hashedPassword = await bcrypt.hash("gDevLabs2026!", 10);
  await User.create({ username: "admin", password: hashedPassword });
  console.log("Secure Admin account configured.");
}
createAdminUser();

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Access Denied: No Token" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.user = user;
    next();
  });
}

app.post("/api/v1/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ username: user.username }, JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token });
});

app.post("/api/v1/assets", authenticateToken, async (req, res) => {
  try {
    const filter = { hostname: req.body.hostname };
    const updateData = req.body;
    const options = { upsert: true, returnDocument: "after" }; // Fixed Deprecation
    const savedAsset = await Asset.findOneAndUpdate(
      filter,
      updateData,
      options,
    );
    res.status(201).json(savedAsset);
  } catch (error) {
    res.status(400).json({ message: "Error saving asset" });
  }
});

app.get("/api/v1/assets", async (req, res) => {
  try {
    res.json(await Asset.find());
  } catch (error) {
    res.status(500).json({ message: "Error retrieving assets" });
  }
});

app.put("/api/v1/assets/:id", authenticateToken, async (req, res) => {
  try {
    const updatedAsset = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" },
    ); // Fixed Deprecation
    res.json(updatedAsset);
  } catch (error) {
    res.status(400).json({ message: "Error updating asset" });
  }
});

app.delete("/api/v1/assets/:id", authenticateToken, async (req, res) => {
  try {
    await Asset.findByIdAndDelete(req.params.id);
    res.json({ message: "Asset deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting asset" });
  }
});

app.get("/api/v1/assets/search", async (req, res) => {
  try {
    const results = await Asset.find({ $text: { $search: req.query.q } });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
});

app.post("/api/v1/datacenters", authenticateToken, async (req, res) => {
  try {
    res.status(201).json(await new Datacenter(req.body).save());
  } catch (error) {
    res.status(400).json({ message: "Error saving DC" });
  }
});

app.get("/api/v1/datacenters", async (req, res) => {
  try {
    res.json(await Datacenter.find());
  } catch (error) {
    res.status(500).json({ message: "Error retrieving DCs" });
  }
});

app.put("/api/v1/datacenters/:id", authenticateToken, async (req, res) => {
  try {
    res.json(
      await Datacenter.findByIdAndUpdate(req.params.id, req.body, {
        returnDocument: "after",
      }),
    );
  } catch (error) {
    // Fixed Deprecation
    res.status(400).json({ message: "Error updating DC" });
  }
});

app.delete("/api/v1/datacenters/:id", authenticateToken, async (req, res) => {
  try {
    await Datacenter.findByIdAndDelete(req.params.id);
    res.json({ message: "DC deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting DC" });
  }
});

app.post("/api/v1/sync", authenticateToken, (req, res) => {
  const ansiblePass = req.body.ansiblePassword;
  if (!ansiblePass)
    return res.status(400).json({ message: "Ansible sudo password required" });

  const playbookPath =
    "/home/gdevops/Projects/JSCRIPT330B/Govenor-The-Rack/update_governor.yml";

  const cmd = `env ANSIBLE_HOST_KEY_CHECKING=False ANSIBLE_TIMEOUT=60 ANSIBLE_STDOUT_CALLBACK=json /usr/bin/ansible-playbook ${playbookPath} -e "ansible_become_pass='${ansiblePass.replace(/'/g, "'\\''")}'"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => {
    try {
      const output = JSON.parse(stdout);
      let updatedCount = 0;
      const hosts = Object.keys(output.stats);

      for (const host of hosts) {
        const printTask = output.plays[0].tasks.find(
          (t) => t.task.name === "Print Server Data as JSON",
        );
        if (printTask && printTask.hosts[host] && printTask.hosts[host].msg) {
          const serverData = printTask.hosts[host].msg;
          await Asset.findOneAndUpdate(
            { hostname: serverData.hostname },
            serverData,
            { upsert: true, returnDocument: "after" },
          ); // Fixed Deprecation
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        res.json({
          message: `Ansible Sync complete. ${updatedCount} nodes updated.`,
        });
      } else {
        res
          .status(500)
          .json({
            message: "Ansible completed but no server data was found to save.",
            raw_output: stdout,
          });
      }
    } catch (parseError) {
      console.error("Failed to parse Ansible JSON output:", stdout);
      res
        .status(500)
        .json({
          message: "Failed to parse Ansible output.",
          error: parseError.toString(),
        });
    }
  });
});

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Governor API running on Port ${PORT}`);
  });
}
module.exports = app;
