interface QRCodeDisplayProps {
  method: "momo" | "vnpay";
  amount: number;
  orderId: string;
}

const QRCodeDisplay = ({ method, amount, orderId }: QRCodeDisplayProps) => {
  const qrData =
    method === "momo"
      ? `momo://pay?amount=${amount}&orderId=${orderId}`
      : `vnpay://pay?amount=${amount}&orderId=${orderId}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    qrData
  )}`;

  return (
    <div className="text-center mt-6">
      <h3 className="text-lg font-semibold mb-2">
        Scan QR code to pay with {method.toUpperCase()}
      </h3>
      <img src={qrUrl} alt="QR Code" className="mx-auto border p-2 bg-white" />
    </div>
  );
};

export default QRCodeDisplay;
