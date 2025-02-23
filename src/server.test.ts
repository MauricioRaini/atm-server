import request from "supertest";
import app from "../src/server"; // Adjust path if needed

describe("🛠️ Express Server", () => {
  it("✅ Should respond with 200 OK", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });
});
