// Pllato CRM · Onboarding — чек-лист задач для заполнения данных.
// pllato раздаёт ссылки ответственным, они заполняют справочники,
// прогресс виден тут же.

import { Store } from "../store.js";
import { listOrganizations } from "../organizations.js";
import { listContracts, contractsProgress } from "../contracts.js";
import { listDeliveryPoints, deliveryPointsProgress } from "../delivery_points.js";
import { listPaymentTerms, paymentTermsProgress } from "../payment_terms.js";

function esc(s){return String(s ?? "").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

/**
 * Определение задач Фазы 1.
 * Каждая задача:
 *  - title
 *  - description
 *  - assignee — кто отвечает (текст)
 *  - link — куда отправить ответственного (deep link на CRM)
 *  - progress() — { done, total, ready, label } — текущее состояние
 */
function getTasks(baseUrl) {
  return [
    {
      id: "C.4",
      title: "5 юр.лиц-отправителей",
      description: "Реквизиты ТОО/ИП компании для подстановки в накладные, счета-фактуры и акты.",
      assignee: "Асем (бухгалтер) или Алла",
      link: `${baseUrl}/#settings/organizations`,
      progress() {
        const list = listOrganizations();
        return {
          done: list.length,
          total: 5,
          ready: list.length >= 1,
          label: `${list.length} ${list.length === 1 ? "юр.лицо" : "юр.лиц"} добавлено`,
        };
      },
    },
    {
      id: "C.2",
      title: "Виды оплаты в договоре",
      description: "5 базовых типов (предоплата 100%, 1 мес, консигнация, 4 дня, ручной ввод). Создаются автоматически — проверьте и при необходимости отредактируйте.",
      assignee: "Pllato (готово seed'ом)",
      link: `${baseUrl}/#settings/payment-terms`,
      progress() {
        const p = paymentTermsProgress();
        return { done: p.total, total: 5, ready: p.ready, label: `${p.total} вид${p.total === 1 ? "" : "ов"} оплаты` };
      },
    },
    {
      id: "C.1",
      title: "Договоры с клиентами",
      description: "Привязать каждого активного клиента к договору с правильным типом оплаты и юр.лицом. Без этого Дебиторская задолженность и автоподтягивание цен не заработают.",
      assignee: "Карлыгаш + Асем",
      link: `${baseUrl}/#contracts`,
      progress() {
        const p = contractsProgress();
        return { done: p.total, total: "—", ready: p.ready, label: `${p.total} договор${p.total === 1 ? "" : (p.total >= 2 && p.total <= 4 ? "а" : "ов")} создано` };
      },
    },
    {
      id: "C.3",
      title: "Точки доставки клиентов",
      description: "Адреса фактической доставки. Особенно для аптечных сетей с несколькими точками. Без этого менеджеры путаются куда отгружать.",
      assignee: "Менеджеры (Айкын и др.)",
      link: `${baseUrl}/#delivery-points`,
      progress() {
        const p = deliveryPointsProgress();
        return {
          done: p.total,
          total: "—",
          ready: p.ready,
          label: `${p.total} точ${p.total === 1 ? "ка" : "ек"} у ${p.contacts} клиент${p.contacts === 1 ? "а" : (p.contacts >= 2 && p.contacts <= 4 ? "ов" : "ов")}`,
        };
      },
    },
    {
      id: "C.5",
      title: "Стадия канбана «Ожидание оплаты»",
      description: "Готова к использованию. В карточке согласованного заказа — кнопка «⏳ Ждать оплату». Применять для 100%-предоплат.",
      assignee: "Pllato (реализовано)",
      link: `${baseUrl}/#warehouse/orders`,
      progress() {
        return { done: 1, total: 1, ready: true, label: "✓ реализовано" };
      },
    },
    {
      id: "C.6",
      title: "Подтверждение оплаты менеджером",
      description: "Готово. В карточке заказа в стадии «Ждут оплату» — кнопка «💰 Оплата получена» с фиксацией суммы и даты.",
      assignee: "Pllato (реализовано)",
      link: `${baseUrl}/#warehouse/orders`,
      progress() {
        return { done: 1, total: 1, ready: true, label: "✓ реализовано" };
      },
    },
    {
      id: "B.8",
      title: "Двойное наименование в накладной",
      description: "В карточке товара есть поле «Наименование для клиента» — заполните для тех товаров, которые в больничных договорах называются иначе. В печатной форме З-2 выведется через слэш.",
      assignee: "Асем + Карлыгаш",
      link: `${baseUrl}/#warehouse/catalog`,
      progress() {
        const products = Store.list("warehouse_products").filter((p) => !p.archived);
        const withCustom = products.filter((p) => p.customerName || p.customerProductName).length;
        return {
          done: withCustom,
          total: products.length,
          ready: withCustom > 0 || products.length === 0,
          label: `${withCustom} из ${products.length} товаров с альтернативным наименованием`,
        };
      },
    },
  ];
}

export function renderOnboardingView() {
  const baseUrl = `${location.origin}${location.pathname.replace(/\/$/, "")}`;
  const tasks = getTasks(baseUrl);
  const readyCount = tasks.filter((t) => t.progress().ready).length;
  const totalCount = tasks.length;
  const pct = Math.round((readyCount / totalCount) * 100);

  return `
    <section style="padding:18px;max-width:920px">
      <div style="margin-bottom:24px">
        <h2 style="margin:0 0 6px">Onboarding — Фаза 1</h2>
        <div style="color:var(--text-muted);font-size:13px">
          Подготовка к запуску. Заполните справочники — раздайте ссылки ответственным, прогресс виден тут же.
        </div>
      </div>

      <div style="background:linear-gradient(180deg,var(--surface),var(--card-tint, #f5f0ea));border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <strong>Общий прогресс</strong>
          <span style="color:var(--text-muted);font-size:13px"><strong>${readyCount}</strong> из ${totalCount} задач готовы</span>
        </div>
        <div style="height:10px;background:#f3f4f6;border-radius:999px;overflow:hidden">
          <div style="height:100%;background:linear-gradient(90deg,#16a34a,#22c55e);width:${pct}%;transition:width .3s"></div>
        </div>
        <div style="text-align:right;font-size:11px;color:var(--text-muted);margin-top:4px">${pct}%</div>
      </div>

      ${tasks.map((t) => {
        const p = t.progress();
        const statusColor = p.ready ? "#16a34a" : "#f59e0b";
        const statusIcon = p.ready ? "✓" : "⏳";
        return `
          <div style="background:var(--surface);border:1px solid var(--border);border-left:4px solid ${statusColor};border-radius:10px;padding:16px 18px;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap">
              <div style="flex:1;min-width:300px">
                <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
                  <span style="font-size:12px;color:var(--text-muted);font-weight:700;letter-spacing:1px">${esc(t.id)}</span>
                  <strong style="font-size:15px">${esc(t.title)}</strong>
                  <span style="color:${statusColor};font-weight:700">${statusIcon}</span>
                </div>
                <div style="color:var(--text-muted);font-size:13px;margin-bottom:8px;line-height:1.5">${esc(t.description)}</div>
                <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-muted)">
                  <span>👤 Ответственный: <strong style="color:var(--text)">${esc(t.assignee)}</strong></span>
                  <span>·</span>
                  <span>${esc(p.label)}</span>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;min-width:180px">
                <a href="${esc(t.link)}" class="btn-primary" style="text-align:center;text-decoration:none;font-size:12px">Открыть форму</a>
                <button type="button" class="btn-ghost" data-onboarding-copy="${esc(t.link)}" style="font-size:11px;padding:6px 10px">📋 Скопировать ссылку</button>
              </div>
            </div>
          </div>
        `;
      }).join("")}

      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:14px 18px;margin-top:24px;font-size:13px;color:#9a3412">
        💡 <strong>Как раздавать задачи:</strong> нажмите «📋 Скопировать ссылку» на нужной задаче и отправьте ответственному (WhatsApp/Telegram/email). Он откроет ссылку и попадёт прямо на форму ввода. Прогресс будет обновляться здесь автоматически когда они сохранят данные.
      </div>
    </section>
  `;
}

export function wireOnboardingEvents(container) {
  if (container.dataset.onboardingWired === "1") return;
  container.dataset.onboardingWired = "1";

  container.addEventListener("click", async (e) => {
    const copyBtn = e.target.closest("[data-onboarding-copy]");
    if (copyBtn) {
      const link = copyBtn.dataset.onboardingCopy;
      try {
        await navigator.clipboard.writeText(link);
        const original = copyBtn.textContent;
        copyBtn.textContent = "✓ Скопировано";
        setTimeout(() => { copyBtn.textContent = original; }, 1500);
      } catch (err) {
        prompt("Скопируй ссылку вручную:", link);
      }
    }
  });
}
