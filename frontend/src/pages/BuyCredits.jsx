import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Check,
  Clock,
  Coins,
  Copy,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  XCircle
} from "lucide-react";
import { Card, Button, Input } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { cancelCreditOrder, createCreditOrder, getMyCreditOrders, getMyCredits, submitCreditOrder } from "../api/users";
import { formatDate } from "../utils/format";
import useSeo from "../hooks/useSeo";

const statusStyles = {
  awaiting_payment: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  pending: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  rejected: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300"
};

const statusIcons = {
  awaiting_payment: Clock,
  pending: Clock,
  approved: Check,
  rejected: XCircle,
  cancelled: XCircle
};

export default function BuyCredits() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuth();
  const { creditPacks, tMoneyNumber, moovNumber, beneficiaryName, refreshSettings } = useSiteSettings();
  const [credits, setCredits] = useState(user?.credits || 0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackId, setSelectedPackId] = useState("");
  const [operator, setOperator] = useState("tmoney");
  const [activeOrder, setActiveOrder] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [payerName, setPayerName] = useState(user?.display_name || "");
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useSeo({
    title: t("creditsPage.title"),
    description: t("creditsPage.seoDesc"),
    noIndex: true
  });

  const packs = Array.isArray(creditPacks) ? creditPacks : [];
  const selectedPack = useMemo(
    () => packs.find((pack) => pack.id === selectedPackId) || packs[0] || null,
    [packs, selectedPackId]
  );
  const number = operator === "tmoney" ? tMoneyNumber : moovNumber;
  const currency = i18n.resolvedLanguage === "en" ? "en-US" : "fr-FR";
  const formatPrice = (value) => `${new Intl.NumberFormat(currency).format(Number(value) || 0)} FCFA`;

  const loadOrders = async () => {
    const [ordersRes, creditsRes] = await Promise.all([getMyCreditOrders(), getMyCredits()]);
    setOrders(ordersRes.data.orders || []);
    setCredits(creditsRes.data.credits || 0);
    setUser((current) => (current ? { ...current, credits: creditsRes.data.credits || 0 } : current));
    return ordersRes.data.orders || [];
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadOrders()
      .then((list) => {
        if (!active) return;
        const resumable = list.find((order) => order.status === "awaiting_payment");
        if (resumable) {
          setActiveOrder(resumable);
          setOperator(resumable.operator);
        }
      })
      .catch(() => {
        if (active) toast.error(t("creditsPage.loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    refreshSettings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPackId && packs.length > 0) setSelectedPackId(packs[0].id);
  }, [packs, selectedPackId]);

  useEffect(() => {
    if (!tMoneyNumber && moovNumber) setOperator("moov");
  }, [tMoneyNumber, moovNumber]);

  const copyReference = async () => {
    if (!activeOrder) return;
    try {
      await navigator.clipboard.writeText(activeOrder.reference);
      toast.success(t("creditsPage.referenceCopied"));
    } catch {
      toast.error(t("creditsPage.copyError"));
    }
  };

  const startOrder = async () => {
    if (!selectedPack) {
      toast.error(t("creditsPage.packRequired"));
      return;
    }
    if (!number) {
      toast.error(t("creditsPage.operatorUnavailable"));
      return;
    }
    setCreating(true);
    try {
      const res = await createCreditOrder({ packId: selectedPack.id, operator });
      setActiveOrder(res.data.order);
      setTransactionId("");
      toast.success(t("creditsPage.orderCreated"));
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("creditsPage.orderError"));
    } finally {
      setCreating(false);
    }
  };

  const confirmPayment = async (event) => {
    event.preventDefault();
    if (!activeOrder) return;
    setSubmitting(true);
    try {
      const res = await submitCreditOrder(activeOrder.id, { transactionId, payerName });
      setActiveOrder(res.data.order);
      setTransactionId("");
      toast.success(t("creditsPage.submitted"));
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("creditsPage.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelActiveOrder = async () => {
    if (!activeOrder) return;
    setCancelling(true);
    try {
      await cancelCreditOrder(activeOrder.id);
      setActiveOrder(null);
      setTransactionId("");
      toast.success(t("creditsPage.orderCancelled"));
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("creditsPage.cancelError"));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">
            <Coins className="h-7 w-7 text-amber-500" />
            {t("creditsPage.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-slate-400 sm:text-base">
            {t("creditsPage.subtitle")}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3 text-center dark:border-amber-500/20 dark:bg-amber-500/10">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">{t("creditsPage.balance")}</p>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{credits}</p>
        </div>
      </div>

      {loading ? (
        <Card className="flex items-center justify-center gap-3 p-10 text-sm text-gray-500 dark:text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          {t("common.loading")}
        </Card>
      ) : activeOrder ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">{t("creditsPage.paymentStep")}</p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">{t("creditsPage.payTitle")}</h2>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[activeOrder.status] || statusStyles.pending}`}>
                {t(`creditsPage.status.${activeOrder.status}`, { defaultValue: activeOrder.status })}
              </span>
            </div>

            <ol className="mt-5 space-y-4">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">1</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{t("creditsPage.payAmount")}</p>
                  <p className="mt-1 text-2xl font-bold text-teal-700 dark:text-teal-300">{formatPrice(activeOrder.amount)}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                    {activeOrder.credits} {t("creditsPage.credits")} · {activeOrder.pack_label}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">2</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{t("creditsPage.sendTo")}</p>
                  <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
                    <Smartphone className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                    {activeOrder.operator === "tmoney" ? "T-Money" : "Moov Money"} · {activeOrder.operator === "tmoney" ? tMoneyNumber : moovNumber}
                  </p>
                  {beneficiaryName && <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{beneficiaryName}</p>}
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">3</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{t("creditsPage.referenceLabel")}</p>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-teal-300 bg-teal-50/60 px-3 py-2 dark:border-teal-700 dark:bg-teal-500/10">
                    <code className="min-w-0 flex-1 break-all font-mono text-sm font-semibold text-teal-800 dark:text-teal-200">{activeOrder.reference}</code>
                    <button type="button" onClick={copyReference} className="rounded-lg p-1.5 text-teal-700 hover:bg-teal-100 dark:text-teal-300 dark:hover:bg-teal-500/20" aria-label={t("creditsPage.copyReference")}>
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{t("creditsPage.referenceHint")}</p>
                </div>
              </li>
            </ol>
          </Card>

          <Card className="p-5 sm:p-6">
            {activeOrder.status === "awaiting_payment" ? (
              <form onSubmit={confirmPayment} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t("creditsPage.confirmTitle")}</h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{t("creditsPage.confirmDesc")}</p>
                </div>
                <div>
                  <label htmlFor="credit-transaction" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("creditsPage.transactionLabel")}
                  </label>
                  <Input
                    id="credit-transaction"
                    value={transactionId}
                    onChange={(event) => setTransactionId(event.target.value)}
                    placeholder={t("creditsPage.transactionPlaceholder")}
                    minLength={4}
                    maxLength={80}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="credit-payer" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("creditsPage.payerLabel")}
                  </label>
                  <Input
                    id="credit-payer"
                    value={payerName}
                    onChange={(event) => setPayerName(event.target.value)}
                    placeholder={t("creditsPage.payerPlaceholder")}
                    maxLength={80}
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? t("creditsPage.submitting") : t("creditsPage.submit")}
                </Button>
                <button
                  type="button"
                  onClick={cancelActiveOrder}
                  disabled={cancelling}
                  className="w-full text-center text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                >
                  {cancelling ? t("creditsPage.cancelling") : t("creditsPage.cancelOrder")}
                </button>
              </form>
            ) : (
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {activeOrder.status === "approved" ? <Check className="h-6 w-6" /> : activeOrder.status === "rejected" ? <XCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {t(`creditsPage.state.${activeOrder.status}`, { defaultValue: t("creditsPage.state.pending") })}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-400">
                  {activeOrder.status === "approved"
                    ? t("creditsPage.approvedDesc", { credits: activeOrder.credits })
                    : activeOrder.status === "rejected"
                      ? t("creditsPage.rejectedDesc")
                      : t("creditsPage.pendingDesc")}
                </p>
                {activeOrder.admin_note && (
                  <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-slate-900/60 dark:text-slate-300">
                    {activeOrder.admin_note}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => { setActiveOrder(null); setTransactionId(""); }}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
                >
                  {t("creditsPage.newOrder")}
                </button>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t("creditsPage.choosePack")}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{t("creditsPage.choosePackDesc")}</p>
            {packs.length === 0 ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                {t("creditsPage.noPacks")}
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {packs.map((pack) => {
                  const active = selectedPack?.id === pack.id;
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => setSelectedPackId(pack.id)}
                      className={`rounded-2xl border p-4 text-left transition ${active
                        ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20 dark:border-teal-400 dark:bg-teal-500/10"
                        : "border-gray-200 bg-white hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{pack.label}</p>
                          <p className="mt-1 text-2xl font-bold text-teal-700 dark:text-teal-300">{pack.credits}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{t("creditsPage.credits")}</p>
                        </div>
                        {active && <ShieldCheck className="h-5 w-5 text-teal-700 dark:text-teal-300" />}
                      </div>
                      <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-slate-100">{formatPrice(pack.price)}</p>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">{t("creditsPage.operatorLabel")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {["tmoney", "moov"].map((value) => {
                  const configured = value === "tmoney" ? Boolean(tMoneyNumber) : Boolean(moovNumber);
                  const active = operator === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!configured}
                      onClick={() => setOperator(value)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${active
                        ? "border-teal-500 bg-teal-50 font-semibold text-teal-800 dark:border-teal-400 dark:bg-teal-500/10 dark:text-teal-200"
                        : "border-gray-200 text-gray-700 hover:border-teal-300 dark:border-slate-700 dark:text-slate-300"}`}
                    >
                      {value === "tmoney" ? "T-Money" : "Moov Money"}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="button"
              onClick={startOrder}
              disabled={creating || !selectedPack || !number}
              className="mt-6 w-full"
            >
              {creating ? t("creditsPage.creating") : t("creditsPage.continue")}
            </Button>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
              <ShieldCheck className="h-5 w-5 text-teal-700 dark:text-teal-300" />
              {t("creditsPage.howItWorks")}
            </h2>
            <ol className="mt-4 space-y-4 text-sm text-gray-600 dark:text-slate-400">
              {["how1", "how2", "how3", "how4"].map((key, index) => (
                <li key={key} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700 dark:bg-slate-700 dark:text-slate-200">{index + 1}</span>
                  <span>{t(`creditsPage.${key}`)}</span>
                </li>
              ))}
            </ol>
            {beneficiaryName && (
              <p className="mt-5 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-slate-900/60 dark:text-slate-400">
                {t("creditsPage.beneficiary", { name: beneficiaryName })}
              </p>
            )}
          </Card>
        </div>
      )}

      <Card className="mt-6 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
            <Clock className="h-5 w-5 text-teal-700 dark:text-teal-300" />
            {t("creditsPage.history")}
          </h2>
          <Link to="/profile" className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-300">
            {t("creditsPage.backToProfile")}
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="py-6 text-sm text-gray-500 dark:text-slate-400">{t("creditsPage.noOrders")}</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const StatusIcon = statusIcons[order.status] || Clock;
              return (
                <article key={order.id} className="flex flex-col gap-3 rounded-xl border border-gray-100 px-3 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[order.status] || statusStyles.pending}`}>
                        <StatusIcon className="h-3 w-3" />
                        {t(`creditsPage.status.${order.status}`, { defaultValue: order.status })}
                      </span>
                      <code className="text-xs text-gray-500 dark:text-slate-400">{order.reference}</code>
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-slate-100">
                      {order.pack_label} · {order.credits} {t("creditsPage.credits")} · {formatPrice(order.amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {order.operator === "tmoney" ? "T-Money" : "Moov Money"} · {formatDate(order.created_at)}
                    </p>
                    {order.admin_note && <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{order.admin_note}</p>}
                  </div>
                  {order.status === "awaiting_payment" && (
                    <button
                      type="button"
                      onClick={() => { setActiveOrder(order); setOperator(order.operator); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="shrink-0 rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-500/10"
                    >
                      {t("creditsPage.resume")}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
