const request = require("supertest");
const mongoose = require("mongoose");

// MOCK: I found this online as a method to bypass issue of unability to verify Ansible execution.
// I intercept the execution command so Jest doesn't try to actually run Ansible.
// I feed it fake JSON to simulate a perfect Ansible success, capturing all the lines in the sync route.
jest.mock("child_process", () => ({
  exec: (cmd, options, callback) => {
    const cb = typeof options === "function" ? options : callback;
    const mockOutput = {
      stats: { "mock-node": {} },
      plays: [
        {
          tasks: [
            {
              task: { name: "Print Server Data as JSON" },
              hosts: {
                "mock-node": {
                  msg: {
                    hostname: "mock-node-01",
                    ipAddress: "192.168.99.99",
                    osVersion: "RHEL 10",
                    datacenter: "Auto-Synced",
                  },
                },
              },
            },
          ],
        },
      ],
    };
    cb(null, JSON.stringify(mockOutput), "");
  },
}));

const app = require("./server");

describe("Governor API & The Rack Routes", () => {
  let token = "";
  let testAssetId = "";
  let testDcId = "";

  beforeAll(async () => {
    // Wait 1.5 seconds for DB to initialize admin user
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const response = await request(app)
      .post("/api/v1/login")
      .send({ username: "admin", password: "gDevLabs2026!" });
    token = response.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // --- 1. HAPPY PATH TESTS (Successes) ---
  it("should return a 200 OK status for the GET /api/v1/assets route", async () => {
    const response = await request(app).get("/api/v1/assets");
    expect(response.statusCode).toBe(200);
  });

  it("should create a new asset via POST /api/v1/assets", async () => {
    const response = await request(app)
      .post("/api/v1/assets")
      .set("Authorization", `Bearer ${token}`)
      .send({ hostname: "jest-test", ipAddress: "10.0.0.99" });

    expect(response.statusCode).toBe(201);
    testAssetId = response.body._id;
  });

  it("should update the asset via PUT /api/v1/assets/:id", async () => {
    const response = await request(app)
      .put(`/api/v1/assets/${testAssetId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rackPosition: "U99" });
    expect(response.statusCode).toBe(200);
  });

  it("should successfully search for an asset via text index", async () => {
    const response = await request(app).get("/api/v1/assets/search?q=jest");
    expect(response.statusCode).toBe(200);
  });

  it("should create a new Datacenter via POST", async () => {
    const response = await request(app)
      .post("/api/v1/datacenters")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test-DC", location: "Lab" });
    expect(response.statusCode).toBe(201);
    testDcId = response.body._id;
  });

  it("should fetch all Datacenters via GET", async () => {
    const response = await request(app).get("/api/v1/datacenters");
    expect(response.statusCode).toBe(200);
  });

  // --- 2. THE ANSIBLE MOCK TEST (Massive coverage boost) ---
  it("should successfully execute the Ansible Sync (Mocked)", async () => {
    const response = await request(app)
      .post("/api/v1/sync")
      .set("Authorization", `Bearer ${token}`)
      .send({ ansiblePassword: "mock-password" });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toContain("Ansible Sync complete");
  });

  // --- 3. SAD PATH TESTS (Error Blocks / Catch Statements) ---
  it("should return 401 for invalid login credentials", async () => {
    const response = await request(app)
      .post("/api/v1/login")
      .send({ username: "admin", password: "wrong" });
    expect(response.statusCode).toBe(401);
  });

  it("should return 401 if accessing protected route without token", async () => {
    const response = await request(app).post("/api/v1/assets").send({});
    expect(response.statusCode).toBe(401);
  });

  it("should return 400 Bad Request if Sync is missing Ansible Password", async () => {
    const response = await request(app)
      .post("/api/v1/sync")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(response.statusCode).toBe(400);
  });

  it("should hit catch block (400) for PUT asset with invalid Mongoose ID", async () => {
    const response = await request(app)
      .put("/api/v1/assets/invalid123")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(response.statusCode).toBe(400);
  });

  it("should hit catch block (500) for DELETE asset with invalid Mongoose ID", async () => {
    const response = await request(app)
      .delete("/api/v1/assets/invalid123")
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(500);
  });

  // --- 4. CLEANUP (Delete test data) ---
  it("should delete the test Datacenter", async () => {
    const response = await request(app)
      .delete(`/api/v1/datacenters/${testDcId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
  });

  it("should delete the test asset via DELETE", async () => {
    const response = await request(app)
      .delete(`/api/v1/assets/${testAssetId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
  });
});
