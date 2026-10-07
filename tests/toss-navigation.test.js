import assert from "node:assert/strict";
import test from "node:test";
import { navigateBack } from "../apps-in-toss/src/navigation.js";

function setup(stepIndex, overlays = []) {
  const calls = [];
  return {
    calls,
    options: {
      stepIndex,
      overlays,
      closeOverlay: (overlay) => calls.push(overlay),
      previousStep: () => calls.push("previous"),
      closeView: async () => calls.push("close")
    }
  };
}

test("native back closes the visible overlay without changing steps", async () => {
  const rule = { hidden: true };
  const data = { hidden: false };
  const { calls, options } = setup(7, [rule, data]);
  await navigateBack(options);
  assert.deepEqual(calls, [data]);
});

test("native back goes to the previous wizard step", async () => {
  for (const stepIndex of [1, 7, 9]) {
    const { calls, options } = setup(stepIndex, [{ hidden: true }]);
    await navigateBack(options);
    assert.deepEqual(calls, ["previous"]);
  }
});

test("native back closes the miniapp on the landing page", async () => {
  const { calls, options } = setup(0);
  await navigateBack(options);
  assert.deepEqual(calls, ["close"]);
});

test("a visible overlay also takes priority on the landing page", async () => {
  const rule = { hidden: false };
  const { calls, options } = setup(0, [rule]);
  await navigateBack(options);
  assert.deepEqual(calls, [rule]);
});

test("native close failures propagate to the UI error handler", async () => {
  const { options } = setup(0);
  options.closeView = async () => { throw new Error("close failed"); };
  await assert.rejects(navigateBack(options), /close failed/);
});
