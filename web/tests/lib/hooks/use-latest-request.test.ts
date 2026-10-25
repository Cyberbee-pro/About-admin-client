import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { LatestRequestManager } from "@/lib/hooks/useLatestRequest";

describe("LatestRequestManager / useLatestRequest (Latest-Request-Wins)", () => {
  test("an older slow load resolving after a newer one must not overwrite state", async () => {
    const manager = new LatestRequestManager();
    let state: string[] = [];
    let loading = true;

    // Helper to create deferred promises
    let resolveSlow: (val: string[]) => void = () => {};
    const slowPromise = new Promise<string[]>((res) => {
      resolveSlow = res;
    });

    let resolveFast: (val: string[]) => void = () => {};
    const fastPromise = new Promise<string[]>((res) => {
      resolveFast = res;
    });

    // 1. Initial slow request starts (Req 1 / Gen 1)
    const req1 = manager.execute(
      () => slowPromise,
      {
        onSuccess: (data) => {
          state = data;
        },
        onSettled: (isLatest) => {
          if (isLatest) loading = false;
        },
      }
    );

    assert.equal(manager.generation, 1, "Generation must increment to 1");
    assert.equal(loading, true, "Loading must remain true while request is pending");

    // 2. Newer request starts before Req 1 resolves (Req 2 / Gen 2)
    const req2 = manager.execute(
      () => fastPromise,
      {
        onSuccess: (data) => {
          state = data;
        },
        onSettled: (isLatest) => {
          if (isLatest) loading = false;
        },
      }
    );

    assert.equal(manager.generation, 2, "Generation must increment to 2");

    // 3. Req 2 (the newer request) resolves first
    resolveFast(["fast-item"]);
    const res2 = await req2;

    assert.equal(res2.superseded, false, "Req 2 must not be superseded");
    assert.deepEqual(state, ["fast-item"], "State must reflect Req 2");
    assert.equal(loading, false, "Loading must be cleared by latest request settling");

    // 4. Req 1 (the older request) resolves later
    resolveSlow(["slow-item"]);
    const res1 = await req1;

    assert.equal(res1.superseded, true, "Req 1 must be marked as superseded");
    assert.deepEqual(
      state,
      ["fast-item"],
      "State must NOT be overwritten by older superseded request"
    );
    assert.equal(loading, false, "Loading remains false");
  });

  test("create during the initial load must still end with the full list", async () => {
    const manager = new LatestRequestManager();
    let certificateList: string[] = [];
    let loading = true;

    // Initial load: returns only item 1, but is slow
    let resolveInitial: (val: string[]) => void = () => {};
    const initialGetPromise = new Promise<string[]>((res) => {
      resolveInitial = res;
    });

    // Start initial load (Gen 1)
    const initialLoad = manager.execute(
      () => initialGetPromise,
      {
        onSuccess: (data) => {
          certificateList = data;
        },
        onSettled: (isLatest) => {
          if (isLatest) loading = false;
        },
      }
    );

    assert.equal(loading, true, "Initial load is active, skeleton is showing");

    // During initial load, user creates Item 2, which triggers loadCertificates() (Gen 2)
    let resolveRefresh: (val: string[]) => void = () => {};
    const refreshGetPromise = new Promise<string[]>((res) => {
      resolveRefresh = res;
    });

    const refreshLoad = manager.execute(
      () => refreshGetPromise,
      {
        onSuccess: (data) => {
          certificateList = data;
        },
        onSettled: (isLatest) => {
          if (isLatest) loading = false;
        },
      }
    );

    assert.equal(manager.generation, 2, "Refresh GET is Generation 2");

    // Now initial load resolves with stale list ["item-1"]
    resolveInitial(["item-1"]);
    await initialLoad;

    // Notice that initial load is superseded, so certificateList has NOT been set to ["item-1"]
    assert.deepEqual(
      certificateList,
      [],
      "Stale initial load must not set list"
    );
    assert.equal(
      loading,
      true,
      "Loading must NOT be cleared by superseded request while Gen 2 is still pending"
    );

    // Refresh load resolves with updated full list ["item-1", "item-2"]
    resolveRefresh(["item-1", "item-2"]);
    await refreshLoad;

    assert.deepEqual(
      certificateList,
      ["item-1", "item-2"],
      "State ends with the full list containing created item"
    );
    assert.equal(loading, false, "Loading cleared once latest request settles; skeleton never stuck");
  });

  test("newer request failure sets error and clears loading flag", async () => {
    const manager = new LatestRequestManager();
    let error: string | null = null;
    let loading = true;

    const req = manager.execute(
      async () => {
        throw new Error("Database timeout");
      },
      {
        onError: (err) => {
          error = err instanceof Error ? err.message : "Error";
        },
        onSettled: (isLatest) => {
          if (isLatest) loading = false;
        },
      }
    );

    const res = await req;
    assert.equal(res.superseded, false);
    assert.equal(error, "Database timeout");
    assert.equal(loading, false, "Loading must be cleared on error so skeleton does not get stuck");
  });

  test("older superseded error does not invoke onError or clear loading prematurely", async () => {
    const manager = new LatestRequestManager();
    let error: string | null = null;
    let state = "initial";
    let loading = true;

    let rejectSlow: (err: Error) => void = () => {};
    const slowReq = new Promise<string>((_, rej) => {
      rejectSlow = rej;
    });

    const req1 = manager.execute(
      () => slowReq,
      {
        onSuccess: (val) => {
          state = val;
        },
        onError: (err) => {
          error = err instanceof Error ? err.message : "Error";
        },
        onSettled: (isLatest) => {
          if (isLatest) loading = false;
        },
      }
    );

    // Newer request supersedes Req 1
    const req2 = manager.execute(
      async () => "fresh-data",
      {
        onSuccess: (val) => {
          state = val;
        },
        onError: (err) => {
          error = err instanceof Error ? err.message : "Error";
        },
        onSettled: (isLatest) => {
          if (isLatest) loading = false;
        },
      }
    );

    await req2;
    assert.equal(state, "fresh-data");
    assert.equal(loading, false);
    assert.equal(error, null);

    // Now older request fails
    rejectSlow(new Error("Old request failed"));
    const res1 = await req1;

    assert.equal(res1.superseded, true);
    assert.equal(error, null, "Superseded error must NOT be reported to onError");
    assert.equal(state, "fresh-data", "State must remain fresh data");
  });

  test("unmounted component does not trigger callbacks", async () => {
    const manager = new LatestRequestManager();
    let called = false;

    const promise = manager.execute(
      async () => "data",
      {
        onSuccess: () => {
          called = true;
        },
        onSettled: () => {
          called = true;
        },
      }
    );

    manager.isMounted = false; // component unmounted before promise resolves
    await promise;

    assert.equal(called, false, "Callbacks must not be called when unmounted");
  });
});
