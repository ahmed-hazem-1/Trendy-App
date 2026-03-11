import { lazy } from "react";
function lazyWithDelay(importFn, delay = 2500) {
  return lazy(() =>
    Promise.all([
      importFn(),
      new Promise((resolve) => setTimeout(resolve, delay)),
    ]).then(([module]) => module),
  );
}

export { lazyWithDelay };
