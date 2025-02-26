import request from "supertest";
import app from "../src/server";

describe("🛠️ Express Server", () => {
  it("✅ Should respond with 200 OK on /health", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "OK" });
  });
});
