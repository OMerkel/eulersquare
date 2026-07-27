#!/usr/bin/env node
/*
 * Node-based service worker tests with mocked SW runtime APIs.
 */

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createResponse(body, status = 200) {
  return {
    body,
    status,
    clone() {
      return createResponse(body, status);
    },
  };
}

function createSandbox(hostname) {
  const listeners = new Map();
  const store = new Map();

  function keyFromRequest(requestOrUrl) {
    if (typeof requestOrUrl === "string") {
      return requestOrUrl;
    }
    return requestOrUrl.url;
  }

  function ensureCache(name) {
    if (!store.has(name)) {
      store.set(name, { entries: new Map(), addAllCalls: [] });
    }
    const bucket = store.get(name);

    return {
      addAll(urls) {
        bucket.addAllCalls.push(urls.slice());
        urls.forEach((url) => {
          bucket.entries.set(url, createResponse(`cached:${url}`));
        });
        return Promise.resolve();
      },
      put(requestOrUrl, response) {
        bucket.entries.set(keyFromRequest(requestOrUrl), response);
        return Promise.resolve();
      },
      match(requestOrUrl) {
        return Promise.resolve(bucket.entries.get(keyFromRequest(requestOrUrl)) || undefined);
      },
    };
  }

  const caches = {
    open(name) {
      return Promise.resolve(ensureCache(name));
    },
    keys() {
      return Promise.resolve(Array.from(store.keys()));
    },
    delete(name) {
      const existed = store.has(name);
      store.delete(name);
      return Promise.resolve(existed);
    },
    match(requestOrUrl) {
      const key = keyFromRequest(requestOrUrl);
      for (const bucket of store.values()) {
        if (bucket.entries.has(key)) {
          return Promise.resolve(bucket.entries.get(key));
        }
      }
      return Promise.resolve(undefined);
    },
  };

  let fetchImpl = () => Promise.resolve(createResponse("ok"));

  const selfObject = {
    location: {
      hostname,
      origin: "https://app.local",
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    skipWaiting() {
      return Promise.resolve();
    },
    clients: {
      claim() {
        return Promise.resolve();
      },
    },
  };

  const sandbox = {
    console,
    URL,
    self: selfObject,
    location: selfObject.location,
    caches,
    fetch(request) {
      return fetchImpl(request);
    },
    Response: {
      error() {
        return { type: "error", status: 0 };
      },
    },
  };

  vm.createContext(sandbox);

  const swPath = path.join(__dirname, "..", "sw.js");
  const swSource = fs.readFileSync(swPath, "utf8");
  vm.runInContext(swSource, sandbox, { filename: "sw.js" });

  function setFetch(fn) {
    fetchImpl = fn;
  }

  async function dispatchInstall() {
    const event = {
      waitUntil(promise) {
        this.promise = promise;
      },
      promise: Promise.resolve(),
    };
    listeners.get("install")(event);
    await event.promise;
  }

  async function dispatchActivate() {
    const event = {
      waitUntil(promise) {
        this.promise = promise;
      },
      promise: Promise.resolve(),
    };
    listeners.get("activate")(event);
    await event.promise;
  }

  async function dispatchFetch(request) {
    const event = {
      request,
      respondWith(promise) {
        this.responsePromise = promise;
      },
      responsePromise: null,
    };
    listeners.get("fetch")(event);
    if (!event.responsePromise) {
      return undefined;
    }
    return event.responsePromise;
  }

  return {
    listeners,
    store,
    setFetch,
    dispatchInstall,
    dispatchActivate,
    dispatchFetch,
  };
}

function assert(condition, message) {
  if (condition) {
    console.log(`OK ${message}`);
  } else {
    console.log(`FAIL ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

async function runTest(name, fn) {
  console.log(`- ${name}`);
  try {
    await fn();
  } catch (error) {
    console.log(`FAIL sw-node.${name} threw error: ${error.message}`);
  }
}

async function main() {
  console.log("Suite: sw-node");

  await runTest("registersLifecycleEventHandlers", async () => {
    const env = createSandbox("localhost");
    assert(env.listeners.has("install"), "install handler registered");
    assert(env.listeners.has("activate"), "activate handler registered");
    assert(env.listeners.has("fetch"), "fetch handler registered");
  });

  await runTest("precacheCoreAssetsInProductionHost", async () => {
    const env = createSandbox("example.com");
    await env.dispatchInstall();

    const cacheEntry = env.store.get("euler-square-v3");
    const added = cacheEntry?.addAllCalls[0] || [];
    assert(added.includes("./js/hmi.js"), "core assets include app scripts");
    assert(!added.includes("./test/test-harness.js"), "test assets are excluded for production host");
  });

  await runTest("precacheDevTestAssetsOnLocalhost", async () => {
    const env = createSandbox("localhost");
    await env.dispatchInstall();

    const cacheEntry = env.store.get("euler-square-v3");
    const added = cacheEntry?.addAllCalls[0] || [];
    assert(added.includes("./test/test-harness.js"), "test assets are included on localhost");
  });

  await runTest("servesStaticFromCacheFirst", async () => {
    const env = createSandbox("localhost");
    const cached = createResponse("cached-js", 200);

    env.store.set("euler-square-v3", {
      entries: new Map([["https://app.local/js/hmi.js", cached]]),
      addAllCalls: [],
    });

    let fetchCount = 0;
    env.setFetch(() => {
      fetchCount += 1;
      return Promise.resolve(createResponse("network-js", 200));
    });

    const response = await env.dispatchFetch({
      method: "GET",
      url: "https://app.local/js/hmi.js",
      destination: "script",
    });

    assertEqual(response.body, "cached-js", "static asset served from cache");
    assertEqual(fetchCount, 0, "network not used when static cache hit exists");
  });

  await runTest("fallbackBehaviorForStaticAndDocuments", async () => {
    const env = createSandbox("localhost");
    await env.dispatchInstall();

    env.setFetch(() => Promise.reject(new Error("offline")));

    const scriptResponse = await env.dispatchFetch({
      method: "GET",
      url: "https://app.local/js/missing.js",
      destination: "script",
    });
    assertEqual(scriptResponse.type, "error", "non-document static fallback returns Response.error");

    const documentResponse = await env.dispatchFetch({
      method: "GET",
      url: "https://app.local/offline/page",
      destination: "document",
    });
    assert(documentResponse?.body, "document fallback resolves to cached index response");
  });

  await runTest("networkFirstForNonStaticAndRuntimeCaching", async () => {
    const env = createSandbox("localhost");
    const networkResponse = createResponse("api-ok", 200);

    env.setFetch(() => Promise.resolve(networkResponse));

    const response = await env.dispatchFetch({
      method: "GET",
      url: "https://app.local/api/state",
      destination: "document",
    });

    assertEqual(response.body, "api-ok", "non-static request uses network-first response");

    const runtime = env.store.get("euler-square-runtime-v3");
    assert(runtime?.entries.has("https://app.local/api/state"), "non-static response stored in runtime cache");

    await env.dispatchActivate();
  });
}

main();
