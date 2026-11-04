import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getExperiences,
  getExperienceById,
  createExperience,
  updateExperience,
  addExperiencePosition,
  deleteExperience,
} from "@/lib/api/experienceService";

describe("Experience Service API Integration Layer", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: "https://api.about.example.com",
      ADMIN_SECRET: "mock-backend-secret",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  test("getExperiences fetches experience list from public endpoint sorted by weight and organization", async () => {
    let capturedUrl = "";
    let capturedMethod = "";

    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || "GET";
      return new Response(
        JSON.stringify({
          success: true,
          count: 1,
          data: [
            {
              _id: "exp-1",
              organization: "NERV Technical Division",
              tag: "focus",
              type: "full_time",
              iconUrl: "https://res.cloudinary.com/demo/icon.png",
              skills: ["skill-1"],
              weight: 1,
              positions: [],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await getExperiences();
    assert.equal(res.success, true);
    assert.equal(res.data.length, 1);
    assert.equal(res.data[0].organization, "NERV Technical Division");
    assert.ok(capturedUrl.includes("/api/v1/experiences"));
    assert.equal(capturedMethod, "GET");
  });

  test("getExperienceById fetches single experience by MongoDB ObjectId", async () => {
    let capturedUrl = "";

    global.fetch = (async (url: string | URL | Request) => {
      capturedUrl = String(url);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            _id: "670fa123456789abcdef0020",
            organization: "NERV",
            tag: "focus",
            type: "full_time",
            positions: [],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await getExperienceById("670fa123456789abcdef0020");
    assert.equal(res.success, true);
    assert.equal(res.data.organization, "NERV");
    assert.ok(capturedUrl.includes("/api/v1/experiences/670fa123456789abcdef0020"));
  });

  test("createExperience submits JSON payload when no files are uploaded", async () => {
    let capturedBody: any = null;
    let capturedHeaders: any = null;

    global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      if (typeof init?.body === "string") {
        capturedBody = JSON.parse(init.body);
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            _id: "exp-new",
            organization: "GeoFront Operations",
            tag: "focus",
            type: "full_time",
            weight: 2,
            positions: [],
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await createExperience({
      organization: "  GeoFront Operations  ",
      tag: "focus",
      type: "full_time",
      weight: 2,
      skills: ["skill-1", "skill-2"],
      positions: [
        {
          position: "Systems Architect",
          description: "Core Magi maintenance",
          startDate: "2025-01-01T00:00:00.000Z",
          isCurrent: true,
        },
      ],
    });

    assert.equal(res.success, true);
    assert.equal(capturedBody.organization, "GeoFront Operations", "Organization must be trimmed");
    assert.equal(capturedBody.type, "full_time");
    assert.deepEqual(capturedBody.skills, ["skill-1", "skill-2"]);
    assert.equal(capturedBody.positions[0].position, "Systems Architect");
  });

  test("createExperience submits FormData with JSON string skills/positions and binary files", async () => {
    let capturedFormData: FormData | null = null;

    global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      if (init?.body instanceof FormData) {
        capturedFormData = init.body;
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: { _id: "exp-multipart" },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const dummyIcon = new File(["icon-bytes"], "icon.png", { type: "image/png" });
    const dummyMedia = new File(["media-bytes"], "photo.jpg", { type: "image/jpeg" });
    const dummyCert = new File(["cert-bytes"], "award.png", { type: "image/png" });

    await createExperience(
      {
        organization: "Wille Fleet",
        tag: "extracurricular",
        type: "contract",
        weight: 5,
        skills: ["skill-3"],
        positions: [
          {
            position: "Navigator",
            description: "Fleet navigation",
            startDate: "2025-03-01T00:00:00.000Z",
            isCurrent: true,
          },
        ],
      },
      {
        iconUrl: dummyIcon,
        mediaUrls: [dummyMedia],
        certificateUrls: [dummyCert],
      }
    );

    assert.ok(capturedFormData, "Must submit FormData body when files are provided");
    const fd = capturedFormData as FormData;

    assert.equal(fd.get("organization"), "Wille Fleet");
    assert.equal(fd.get("tag"), "extracurricular");
    assert.equal(fd.get("type"), "contract");
    assert.equal(fd.get("weight"), "5");

    // skills must be serialized as JSON string in multipart
    const skillsRaw = fd.get("skills");
    assert.ok(typeof skillsRaw === "string");
    assert.deepEqual(JSON.parse(skillsRaw as string), ["skill-3"]);

    // positions must be serialized as JSON string in multipart
    const positionsRaw = fd.get("positions");
    assert.ok(typeof positionsRaw === "string");
    const parsedPositions = JSON.parse(positionsRaw as string);
    assert.equal(parsedPositions[0].position, "Navigator");

    // binary files
    assert.equal(fd.get("iconUrl"), dummyIcon);
    assert.equal(fd.get("mediaUrls"), dummyMedia);
    assert.equal(fd.get("certificateUrls"), dummyCert);
  });

  test("updateExperience sends multipart form with files and preserved existing positions", async () => {
    let capturedUrl = "";
    let capturedMethod = "";
    let capturedFormData: FormData | null = null;

    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || "";
      if (init?.body instanceof FormData) {
        capturedFormData = init.body;
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: { _id: "exp-update-1" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const dummyMedia = new File(["media-2"], "diagram.png", { type: "image/png" });

    await updateExperience(
      "exp-update-1",
      {
        organization: "Wille Fleet Updated",
        tag: "focus",
        type: "freelance",
        weight: 3,
        skills: ["skill-9"],
        positions: [
          {
            _id: "pos-1",
            position: "Chief Navigator",
            description: "Upgraded title",
            startDate: "2024-01-01T00:00:00.000Z",
            isCurrent: true,
            mediaUrls: ["https://res.cloudinary.com/demo/existing.png"],
            certificateUrls: [],
          },
        ],
      },
      {
        mediaUrls: [dummyMedia],
      }
    );

    assert.ok(capturedUrl.includes("/api/v1/experiences/exp-update-1"));
    assert.equal(capturedMethod, "PUT");
    assert.ok(capturedFormData);
    const fd = capturedFormData as FormData;

    assert.equal(fd.get("organization"), "Wille Fleet Updated");
    const positionsParsed = JSON.parse(fd.get("positions") as string);
    assert.equal(positionsParsed[0]._id, "pos-1", "Must preserve existing position _id");
    assert.equal(positionsParsed[0].mediaUrls[0], "https://res.cloudinary.com/demo/existing.png");
    assert.equal(fd.get("mediaUrls"), dummyMedia);
  });

  test("addExperiencePosition URL-encodes organization parameter and handles multipart uploads", async () => {
    let capturedUrl = "";
    let capturedMethod = "";
    let capturedFormData: FormData | null = null;

    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || "";
      if (init?.body instanceof FormData) {
        capturedFormData = init.body;
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: "Position added successfully",
          data: { _id: "exp-123" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const dummyCert = new File(["cert"], "cert.png", { type: "image/png" });

    await addExperiencePosition(
      "NERV / Tokyo-3 Division", // Contains spaces and slash that must be URL-encoded
      {
        position: "Senior Specialist",
        description: "Promoted role",
        startDate: "2026-06-01T00:00:00.000Z",
        isCurrent: true,
      },
      {
        certificateUrls: [dummyCert],
      }
    );

    assert.equal(capturedMethod, "POST");
    assert.ok(
      capturedUrl.includes("/api/v1/experiences/NERV%20%2F%20Tokyo-3%20Division/positions"),
      "Organization parameter must be URL-encoded in route path"
    );

    assert.ok(capturedFormData);
    const fd = capturedFormData as FormData;
    const posParsed = JSON.parse(fd.get("position") as string);
    assert.equal(posParsed.position, "Senior Specialist");
    assert.equal(posParsed.isCurrent, true);
    assert.equal(fd.get("certificateUrls"), dummyCert);
  });

  test("deleteExperience performs DELETE by MongoDB ObjectId", async () => {
    let capturedUrl = "";
    let capturedMethod = "";

    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || "";
      return new Response(
        JSON.stringify({
          success: true,
          message: "Experience deleted successfully",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await deleteExperience("exp-to-delete-99");
    assert.equal(res.success, true);
    assert.ok(capturedUrl.includes("/api/v1/experiences/exp-to-delete-99"));
    assert.equal(capturedMethod, "DELETE");
  });
});
