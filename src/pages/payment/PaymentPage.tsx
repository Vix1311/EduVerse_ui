import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation } from "react-router-dom";
import Header from "../../components/header/Header";
import QRCodeDisplay from "@/components/qrPayment/QRPayment";

interface CartItem {
  id: number;
  title: string;
  price?: number;
  originalPrice: number;
}

interface LocationState {
  cartItems: CartItem[];
  totalPrice: number;
}

const PaymentPage = () => {
  const location = useLocation();
  const { cartItems = [], totalPrice = 0 } =
    (location.state as LocationState) || {};

  const [method, setMethod] = useState<"momo" | "vnpay" | "">("");
  const [showQR, setShowQR] = useState(false);
  const [orderId, setOrderId] = useState("");

  const handleSelectMethod = (selected: "momo" | "vnpay") => {
    setMethod(selected);
    setShowQR(false);
  };

  const handlePayment = () => {
    if (!method) {
      toast.error("Please select payment method!");
      return;
    }

    const id = `ORDER-${Date.now()}`;
    setOrderId(id);
    setShowQR(true);
    toast.success("QR code is ready, scan to pay!");
  };

  const originalTotal = cartItems.reduce(
    (sum, item) => sum + item.originalPrice,
    0
  );
  const discountTotal = originalTotal - totalPrice;
  const discountPercent = Math.round((discountTotal / originalTotal) * 100);

  return (
    <div>
      <div className="shadow-lg">
        <Header />
      </div>
      <div className="min-h-screen bg-white px-4 py-12 flex flex-col-reverse md:flex-row justify-center items-start gap-8 max-w-5xl mx-auto">
        {/* Left column */}
        <div className="md:w-1/2 w-full flex items-center justify-center">
          {showQR && method && orderId ? (
            <div className="w-full flex justify-normal items-center min-h-[400px]">
              <QRCodeDisplay
                method={method}
                amount={totalPrice}
                orderId={orderId}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500">
              Please select a payment method and confirm payment.
            </p>
          )}
        </div>

        {/* Right column */}
        <div className="flex-1 border p-6 rounded shadow-md flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-center">
            Select payment method
          </h2>

          <div className="text-gray-800 space-y-2">
            <p className="flex justify-between text-sm">
              <span>Original Price:</span>
              <span className="font-medium">
                ₫{originalTotal.toLocaleString("vi-VN")}
              </span>
            </p>
            <p className="flex justify-between text-sm">
              <span>Discounts ({discountPercent}% Off):</span>
              <span className="font-medium text-red-600">
                -₫{discountTotal.toLocaleString("vi-VN")}
              </span>
            </p>
            <hr />
            <p className="flex justify-between text-lg font-bold">
              <span>
                Total ({cartItems.length} course
                {cartItems.length > 1 ? "s" : ""}):
              </span>
              <span className="text-black">
                ₫{totalPrice.toLocaleString("vi-VN")}
              </span>
            </p>
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            <button
              className={`border rounded px-6 py-2 transition ${
                method === "momo"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-black"
              }`}
              onClick={() => handleSelectMethod("momo")}
            >
              MoMo
            </button>
            <button
              className={`border rounded px-6 py-2 transition ${
                method === "vnpay"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-black"
              }`}
              onClick={() => handleSelectMethod("vnpay")}
            >
              VNPay
            </button>
          </div>
          <div className="flex text-sm">
            <h3>By completing your purchase, you agree to these </h3>
            <h3 className="text-purple-500 underline cursor-pointer pl-1">
              Terms of Use.
            </h3>
          </div>
          <button
            onClick={handlePayment}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition"
          >
            Payment confirmation
          </button>
          <div className="space-y-1">
            <h2 className="text-center font-bold text-base">
              30-Day Money-Back Guarantee
            </h2>
            <h3 className="text-center text-base">
              Not satisfied? Get a full refund within 30 days. Simple and
              straightforward!{" "}
            </h3>
          </div>
          <Link to="/cart" className="underline text-center">
            Return to cart
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
