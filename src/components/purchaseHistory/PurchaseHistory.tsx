import React, { useEffect, useState } from 'react';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import { fetchPurchases } from '@/redux/slices/purchaseHistory.slice';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
const ITEMS_PER_PAGE = 5;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const PurchaseHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const dispatch = useDispatch<AppDispatch>();

  const { purchases } = useSelector((state: RootState) => state.purchaseHistory);

  useEffect(() => {
    dispatch(fetchPurchases());
  }, [dispatch]);

  const totalPages = Math.ceil(purchases.length / ITEMS_PER_PAGE);

  const currentPurchases = purchases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  return (
    <>
      <Header />
      <div className="max-w-6xl mb-10 mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Purchase History</h1>

        <div className="overflow-x-auto">
          <table className="w-full table-auto bg-white shadow-md rounded-xl">
            <thead>
              <tr className="text-black border-b-2">
                <th className="px-4 py-3 text-left">Order Id</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Payment method</th>
              </tr>
            </thead>
            <tbody>
              {currentPurchases.map(purchase => (
                <tr key={purchase.id} className="border-b">
                  <td className="text-gray-800">{purchase.id}</td>
                  <td className="px-4 py-4">{formatDate(purchase.purchaseDate)}</td>
                  <td className="px-4 py-4">{formatCurrency(purchase.price)}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`font-semibold ${
                        purchase.status === 'Paid'
                          ? 'text-green-600'
                          : purchase.status === 'Cancelled'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                      }`}
                    >
                      {purchase.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-md disabled:opacity-50"
            >
              &lt;
            </button>

            <span className="text-gray-700 font-medium">
              {currentPage}/{totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-md disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PurchaseHistory;
