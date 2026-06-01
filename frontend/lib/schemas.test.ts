import { describe, expect, it } from "vitest";

import { meSchema } from "@/lib/schemas";

describe("meSchema", () => {
  it("accepts the TSD §7.2 /me shape", () => {
    const parsed = meSchema.parse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Demo Admin",
      email: "admin@paideia.local",
      role: "admin",
      school: {
        id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        name: "Paideia Demo School",
      },
      is_active: true,
    });
    expect(parsed.role).toBe("admin");
  });
});
