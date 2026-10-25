import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "@/lib/api/certificateService";

describe("Certificate Service API Integration Layer", () => {
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

  test("getCertificates fetches certificate list from public endpoint", async () => {
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
              _id: "c1",
              title: "CKA Certified Kubernetes Administrator",
              organization: "CNCF",
              weight: 1,
              mediaUrl: "https://res.cloudinary.com/demo/image/upload/v1/cka.png",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await getCertificates();
    assert.ok(capturedUrl.includes("/api/v1/certificates"), "Must target /api/v1/certificates");
    assert.equal(capturedMethod, "GET");
    assert.equal(res.success, true);
    assert.equal(res.data.length, 1);
    assert.equal(res.data[0].title, "CKA Certified Kubernetes Administrator");
  });

  test("getCertificateById fetches single certificate by MongoDB ObjectId", async () => {
    let capturedUrl = "";

    global.fetch = (async (url: string | URL | Request) => {
      capturedUrl = String(url);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            _id: "cert-123",
            title: "AWS Solutions Architect",
            organization: "Amazon Web Services",
            weight: 2,
            mediaUrl: "https://res.cloudinary.com/demo/image/upload/v1/aws.png",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await getCertificateById("cert-123");
    assert.ok(capturedUrl.includes("/api/v1/certificates/cert-123"));
    assert.equal(res.data._id, "cert-123");
    assert.equal(res.data.organization, "Amazon Web Services");
  });

  test("createCertificate submits JSON payload when no file is uploaded", async () => {
    let capturedMethod = "";
    let capturedBody: any = null;

    global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      capturedMethod = init?.method || "";
      capturedBody = init?.body ? JSON.parse(init.body as string) : null;
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            _id: "c-new",
            title: "TensorFlow Developer",
            organization: "Google",
            weight: 1,
            mediaUrl: "",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await createCertificate({
      title: "TensorFlow Developer",
      organization: "Google",
      weight: 1,
      link: "https://certificate.google.com/verify",
    });

    assert.equal(capturedMethod, "POST");
    assert.equal(capturedBody.title, "TensorFlow Developer");
    assert.equal(capturedBody.organization, "Google");
    assert.equal(capturedBody.link, "https://certificate.google.com/verify");
    assert.equal(res.data._id, "c-new");
  });

  test("createCertificate submits FormData with mediaUrl when file is uploaded", async () => {
    let capturedMethod = "";
    let capturedBody: any = null;

    global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      capturedMethod = init?.method || "";
      capturedBody = init?.body;
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            _id: "c-file",
            title: "Meta Frontend Specialist",
            organization: "Meta",
            weight: 3,
            mediaUrl: "https://res.cloudinary.com/demo/image/upload/v1/meta.png",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const mockFile = new Blob(["fake-image-bytes"], { type: "image/png" }) as unknown as File;

    const res = await createCertificate(
      {
        title: "Meta Frontend Specialist",
        organization: "Meta",
        weight: 3,
      },
      { mediaUrl: mockFile }
    );

    assert.equal(capturedMethod, "POST");
    assert.ok(capturedBody instanceof FormData, "Must send FormData when mediaUrl file is attached");
    assert.equal(capturedBody.get("title"), "Meta Frontend Specialist");
    assert.equal(capturedBody.get("organization"), "Meta");
    assert.equal(capturedBody.get("weight"), "3");
    assert.ok(capturedBody.get("mediaUrl"), "FormData must include mediaUrl file field");
    assert.equal(res.data._id, "c-file");
  });

  test("updateCertificate sends multipart form when file is updated", async () => {
    let capturedMethod = "";
    let capturedBody: any = null;

    global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      capturedMethod = init?.method || "";
      capturedBody = init?.body;
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            _id: "c-upd",
            title: "Updated Title",
            organization: "Updated Org",
            weight: 5,
            mediaUrl: "https://res.cloudinary.com/demo/image/upload/v1/updated.png",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const mockFile = new Blob(["updated-bytes"], { type: "image/jpeg" }) as unknown as File;

    const res = await updateCertificate(
      "c-upd",
      { title: "Updated Title", weight: 5 },
      { mediaUrl: mockFile }
    );

    assert.equal(capturedMethod, "PUT");
    assert.ok(capturedBody instanceof FormData);
    assert.equal(capturedBody.get("title"), "Updated Title");
    assert.equal(capturedBody.get("weight"), "5");
    assert.equal(res.data.title, "Updated Title");
  });

  test("deleteCertificate performs DELETE by MongoDB ObjectId", async () => {
    let capturedUrl = "";
    let capturedMethod = "";

    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || "GET";
      return new Response(
        JSON.stringify({ success: true, message: "Certificate deleted successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await deleteCertificate("c-del");
    assert.ok(capturedUrl.includes("/api/v1/certificates/c-del"));
    assert.equal(capturedMethod, "DELETE");
    assert.equal(res.success, true);
  });
});
