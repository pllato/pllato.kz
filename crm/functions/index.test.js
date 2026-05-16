import test from "node:test";
import assert from "node:assert/strict";

import { processBudgetAlert } from "./index.js";

function makeBillingClient({ billingEnabled = true } = {}) {
  return {
    getCalls: 0,
    updateCalls: 0,
    async getProjectBillingInfo() {
      this.getCalls += 1;
      return [{ billingEnabled }];
    },
    async updateProjectBillingInfo() {
      this.updateCalls += 1;
      return [{}];
    },
  };
}

test("processBudgetAlert: disables billing when cost exceeds budget", async () => {
  const client = makeBillingClient({ billingEnabled: true });
  const result = await processBudgetAlert(
    { costAmount: 10, budgetAmount: 5, currencyCode: "USD" },
    client,
  );

  assert.equal(result.status, "disabled");
  assert.equal(client.getCalls, 1);
  assert.equal(client.updateCalls, 1);
});

test("processBudgetAlert: skips update when cost is not above budget", async () => {
  const client = makeBillingClient({ billingEnabled: true });
  const result = await processBudgetAlert(
    { costAmount: 3, budgetAmount: 5, currencyCode: "USD" },
    client,
  );

  assert.equal(result.status, "no_action");
  assert.equal(client.getCalls, 0);
  assert.equal(client.updateCalls, 0);
});
