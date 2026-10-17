"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { List, Clock, Calendar, Truck, ShieldCheck, Star } from "lucide-react";

const PRIMARY = "#5B48FC";

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

type OrderApiItemItem = {
  titleSnapshot: string;
  quantity: number;
  unitPriceMinor: bigint | number;
};

type OrderApiItem = {
  id: string;
  orderNumber: string;
  status: string;
  totalMinor: bigint | number;
  currency: string;
  items: OrderApiItemItem[];
  createdAt: string;
  buyer: { firstName: string; lastName: string } | null;
  seller: { firstName: string; lastName: string } | null;
};

type OrderItem = {
  titleSnapshot: string;
  quantity: number;
  unitPriceMinor: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalMinor: number;
  currency: string;
  items: OrderItem[];
  createdAt: string;
  buyer: { firstName: string; lastName: string } | null;
  seller: { firstName: string; lastName: string } | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
  PAID: { label: "Paid", color: "text-[#5B48FC]", bg: "bg-[#5B48FC]/10" },
  ACCEPTED: { label: "Accepted", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10" },
  IN_PROGRESS: { label: "In Progress", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10" },
  SHIPPED: { label: "Shipped", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10" },
  DELIVERED: { label: "Delivered", color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
  COMPLETED: { label: "Completed", color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
  CANCELLED: { label: "Cancelled", color: "text-[#EF4444]", bg: "bg-[#EF4444]/10" },
  DISPUTED: { label: "Disputed", color: "text-[#EF4444]", bg: "bg-[#EF4444]/10" },
  REFUNDED: { label: "Refunded", color: "text-[#EF4444]", bg: "bg-[#EF4444]/10" },
};

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders?page=1&limit=20", {
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = (data.orders || []).map((o: OrderApiItem) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            totalMinor: Number(o.totalMinor) / 100,
            currency: o.currency,
            items: (o.items || []).map((item: OrderApiItemItem) => ({
              titleSnapshot: item.titleSnapshot,
              quantity: item.quantity,
              unitPriceMinor: Number(item.unitPriceMinor) / 100,
            })),
            createdAt: o.createdAt,
            buyer: o.buyer
              ? { firstName: o.buyer.firstName, lastName: o.buyer.lastName }
              : null,
            seller: o.seller
              ? { firstName: o.seller.firstName, lastName: o.seller.lastName }
              : null,
          }));
          if (!cancelled) setOrders(mapped);
        }
      } catch {
        // keep empty on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOrders();
    return () => { cancelled = true; };
  }, []);

  const buyerName = (o: Order) => (o.buyer ? `${o.buyer.firstName} ${o.buyer.lastName}` : "Customer");
  const sellerName = (o: Order) => (o.seller ? `${o.seller.firstName} ${o.seller.lastName}` : "Seller");

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#131313] mb-2">Orders</h1>
            <p className="text-[#868686] text-sm">Track your purchases and deliveries</p>
          </div>
          <Link
            href="/handieman"
            className="px-4 py-2.5 rounded-xl bg-[#5B48FC] text-white font-medium hover:bg-[#4A38E0] transition-colors"
          >
            New Order
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Pending" },
            { id: "delivered", label: "Delivered" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium border transition-all ${
                activeTab === tab.id
                  ? "bg-[#5B48FC] text-white border-[#5B48FC]"
                  : "border-[#E8E8E8] text-[#868686] hover:bg-[#F3F3F3]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.filter((o) => {
            if (activeTab === "all") return true;
            if (activeTab === "pending") return o.status === "PENDING_PAYMENT" || o.status === "PAID";
            if (activeTab === "delivered") return o.status === "DELIVERED";
            if (activeTab === "cancelled") return o.status === "CANCELLED";
            return true;
          }).map((order) => {
            const status = STATUS_CONFIG[order.status];
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-[#131313]">Order #{order.orderNumber}</p>
                      <p className="text-xs text-[#868686]">
                        {new Date(order.createdAt).toLocaleDateString()} • {sellerName(order)}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-medium ${status.color} ${status.bg}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-xs text-[#868686] uppercase font-medium">Order Total</p>
                      <p className="text-lg font-bold text-[#131313]">{formatMoney(order.totalMinor)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#868686] uppercase font-medium">Items</p>
                      <p className="text-lg font-bold text-[#131313]">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#868686] uppercase font-medium">Buyer</p>
                      <p className="text-lg font-bold text-[#131313]">{buyerName(order)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#868686] uppercase font-medium">Seller</p>
                      <p className="text-lg font-bold text-[#131313]">{sellerName(order)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#F3F3F3] rounded-xl p-4">
                      <p className="text-xs text-[#868686] uppercase font-medium mb-2">Items</p>
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-[#131313]">{item.titleSnapshot}</span>
                          <span className="text-[#868686]">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#868686]">Order Status</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${status.color} ${status.bg}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {order.status === "DELIVERED" && (
                    <div className="mt-6 pt-6 border-t border-[#F3F3F3]">
                      <div className="flex items-center gap-3">
                        <Star className="w-4 h-4 text-[#D79900]" />
                        <span className="text-sm text-[#868686]">How was your experience?</span>
                        <Link
                          href="/reviews"
                          className="ml-auto text-sm font-medium text-[#5B48FC] hover:underline"
                        >
                          Leave a Review
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
