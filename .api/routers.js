
// Files Imports
import * as configure from "@api/configure";
import * as API_000 from "@api/root/src/api/meta/[pixelID].ts";
import * as API_001 from "@api/root/src/api/pix/[pixelID].ts";

// Public RESTful API Methods and Paths
// This section describes the available HTTP methods and their corresponding endpoints (paths).
// USE    /api/meta/:pixelID    src/api/meta/[pixelID].ts?fn=default
// USE    /api/meta/:pixelID    src/api/meta/[pixelID].ts?fn=USE
// GET    /api/meta/:pixelID    src/api/meta/[pixelID].ts?fn=GET
// POST   /api/meta/:pixelID    src/api/meta/[pixelID].ts?fn=POST
// PATCH  /api/meta/:pixelID    src/api/meta/[pixelID].ts?fn=PATCH
// PUT    /api/meta/:pixelID    src/api/meta/[pixelID].ts?fn=PUT
// DELETE /api/meta/:pixelID    src/api/meta/[pixelID].ts?fn=DELETE
// USE    /api/pix/:pixelID     src/api/pix/[pixelID].ts?fn=default
// USE    /api/pix/:pixelID     src/api/pix/[pixelID].ts?fn=USE
// GET    /api/pix/:pixelID     src/api/pix/[pixelID].ts?fn=GET
// POST   /api/pix/:pixelID     src/api/pix/[pixelID].ts?fn=POST
// PATCH  /api/pix/:pixelID     src/api/pix/[pixelID].ts?fn=PATCH
// PUT    /api/pix/:pixelID     src/api/pix/[pixelID].ts?fn=PUT
// DELETE /api/pix/:pixelID     src/api/pix/[pixelID].ts?fn=DELETE

const internal  = [
  API_000.default  && { cb: API_000.default , method: "use"    , route: "/meta/:pixelID" , url: "/api/meta/:pixelID" , source: "src/api/meta/[pixelID].ts?fn=default" },
  API_000.USE      && { cb: API_000.USE     , method: "use"    , route: "/meta/:pixelID" , url: "/api/meta/:pixelID" , source: "src/api/meta/[pixelID].ts?fn=USE"     },
  API_000.GET      && { cb: API_000.GET     , method: "get"    , route: "/meta/:pixelID" , url: "/api/meta/:pixelID" , source: "src/api/meta/[pixelID].ts?fn=GET"     },
  API_000.POST     && { cb: API_000.POST    , method: "post"   , route: "/meta/:pixelID" , url: "/api/meta/:pixelID" , source: "src/api/meta/[pixelID].ts?fn=POST"    },
  API_000.PATCH    && { cb: API_000.PATCH   , method: "patch"  , route: "/meta/:pixelID" , url: "/api/meta/:pixelID" , source: "src/api/meta/[pixelID].ts?fn=PATCH"   },
  API_000.PUT      && { cb: API_000.PUT     , method: "put"    , route: "/meta/:pixelID" , url: "/api/meta/:pixelID" , source: "src/api/meta/[pixelID].ts?fn=PUT"     },
  API_000.DELETE   && { cb: API_000.DELETE  , method: "delete" , route: "/meta/:pixelID" , url: "/api/meta/:pixelID" , source: "src/api/meta/[pixelID].ts?fn=DELETE"  },
  API_001.default  && { cb: API_001.default , method: "use"    , route: "/pix/:pixelID"  , url: "/api/pix/:pixelID"  , source: "src/api/pix/[pixelID].ts?fn=default"  },
  API_001.USE      && { cb: API_001.USE     , method: "use"    , route: "/pix/:pixelID"  , url: "/api/pix/:pixelID"  , source: "src/api/pix/[pixelID].ts?fn=USE"      },
  API_001.GET      && { cb: API_001.GET     , method: "get"    , route: "/pix/:pixelID"  , url: "/api/pix/:pixelID"  , source: "src/api/pix/[pixelID].ts?fn=GET"      },
  API_001.POST     && { cb: API_001.POST    , method: "post"   , route: "/pix/:pixelID"  , url: "/api/pix/:pixelID"  , source: "src/api/pix/[pixelID].ts?fn=POST"     },
  API_001.PATCH    && { cb: API_001.PATCH   , method: "patch"  , route: "/pix/:pixelID"  , url: "/api/pix/:pixelID"  , source: "src/api/pix/[pixelID].ts?fn=PATCH"    },
  API_001.PUT      && { cb: API_001.PUT     , method: "put"    , route: "/pix/:pixelID"  , url: "/api/pix/:pixelID"  , source: "src/api/pix/[pixelID].ts?fn=PUT"      },
  API_001.DELETE   && { cb: API_001.DELETE  , method: "delete" , route: "/pix/:pixelID"  , url: "/api/pix/:pixelID"  , source: "src/api/pix/[pixelID].ts?fn=DELETE"   }
].filter(it => it);

export const routers = internal.map((it) => {
  const { method, route, url, source } = it;
  return { method, url, route, source };
});

export const endpoints = internal.map(
  (it) => it.method?.toUpperCase() + "\t" + it.url
);

export const applyRouters = (applyRouter) => {
  internal.forEach((it) => {
    it.cb = configure.callbackBefore?.(it.cb, it) || it.cb;
    applyRouter(it);
  });
};

