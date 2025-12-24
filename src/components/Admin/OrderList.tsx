import axios from "axios";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  courseName: string;
  courseType: string;
  price: number;
  image: string;
}

const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    axios.get("/data/AdminData/OrderListData/OrderListData.json").then(res => setOrders(res.data));
  }, []);
  return (
    <div className="bg-white h-full p-6 rounded-xl shadow-md flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-gray-800">Latest orders</h2>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between hover:bg-gray-100 p-3 rounded-lg transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <img
                src={order.image}
                alt={order.courseName}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800">{order.courseName}</span>
                <span className="text-xs text-gray-500">{order.courseType}</span>
              </div>
            </div>

            <div className="text-sm font-semibold text-gray-800">${order.price}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">
        <select title="date" className="border rounded-md px-3 py-1 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 12 months</option>
        </select>
        <button className="text-sm font-medium text-blue-600 hover:underline">
          View All
        </button>
      </div>
    </div>
  );
};

export default OrderList;
