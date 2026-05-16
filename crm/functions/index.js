import { onMessagePublished } from "firebase-functions/v2/pubsub";
import * as logger from "firebase-functions/logger";
import { CloudBillingClient } from "@google-cloud/billing";

const PROJECT_ID = "pllato-crm";
const PROJECT_RESOURCE_NAME = `projects/${PROJECT_ID}`;

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

export function decodePubSubMessageData(encodedData) {
  if (!encodedData || typeof encodedData !== "string") return {};
  const decoded = Buffer.from(encodedData, "base64").toString("utf8").trim();
  if (!decoded) return {};
  return JSON.parse(decoded);
}

export function extractBudgetPayload(event) {
  const message = event?.data?.message;
  if (message?.json && typeof message.json === "object") return message.json;
  if (typeof message?.data === "string") return decodePubSubMessageData(message.data);
  if (typeof event?.data === "string") return decodePubSubMessageData(event.data);
  return {};
}

export function normalizeBudgetPayload(payload) {
  return {
    costAmount: toFiniteNumber(payload?.costAmount),
    budgetAmount: toFiniteNumber(payload?.budgetAmount),
    currencyCode: String(payload?.currencyCode || "USD").toUpperCase(),
    budgetDisplayName: payload?.budgetDisplayName || "unknown_budget",
    raw: payload || {},
  };
}

export async function processBudgetAlert(payload, billingClient, projectResourceName = PROJECT_RESOURCE_NAME) {
  const { costAmount, budgetAmount, currencyCode, budgetDisplayName, raw } = normalizeBudgetPayload(payload);
  const timestamp = new Date().toISOString();

  if (!Number.isFinite(costAmount) || !Number.isFinite(budgetAmount)) {
    logger.error("Invalid budget payload", { timestamp, payload: raw });
    return { status: "invalid_payload", timestamp };
  }

  if (costAmount <= budgetAmount) {
    logger.info("No action needed", {
      timestamp,
      project: projectResourceName,
      costAmount,
      budgetAmount,
      currencyCode,
      budgetDisplayName,
    });
    return { status: "no_action", timestamp };
  }

  const [billingInfo] = await billingClient.getProjectBillingInfo({ name: projectResourceName });
  if (!billingInfo?.billingEnabled) {
    logger.warn("Billing already disabled", {
      timestamp,
      project: projectResourceName,
      costAmount,
      budgetAmount,
      currencyCode,
      budgetDisplayName,
    });
    return { status: "already_disabled", timestamp };
  }

  await billingClient.updateProjectBillingInfo({
    name: projectResourceName,
    projectBillingInfo: { billingAccountName: "" },
  });

  logger.warn("Billing disabled by stopBilling hard cap", {
    timestamp,
    project: projectResourceName,
    costAmount,
    budgetAmount,
    currencyCode,
    budgetDisplayName,
  });

  return { status: "disabled", timestamp };
}

export const stopBilling = onMessagePublished(
  { topic: "billing-alerts", region: "us-central1" },
  async (event) => {
    const payload = extractBudgetPayload(event);
    const billingClient = new CloudBillingClient();
    return processBudgetAlert(payload, billingClient);
  },
);
