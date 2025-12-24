// import { useEffect, useState } from 'react';
// import { toast } from 'react-toastify';
// import { FaCommentDots, FaPaperPlane, FaTimes } from 'react-icons/fa';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { AppDispatch, RootState } from '@/core/store/store';
// import { useDispatch, useSelector } from 'react-redux';
// // import { resetFeedbackState, submitFeedback } from '@/redux/slices/feedback.slice';

// const FeedbackWidget = () => {
//   const [open, setOpen] = useState(false);
//   const [content, setContent] = useState('');
//   const [messages, setMessages] = useState<{ from: 'user' | 'admin'; text: string }[]>([
//     {
//       from: 'admin',
//       text: 'Hello! Do you need any help? 😊',
//     },
//   ]);
//   const { success, error } = useSelector((state: RootState) => state.feedBack);
//   const dispatch = useDispatch<AppDispatch>();

//   const [wordCount, setWordCount] = useState(0);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const currentPath = location.pathname;
//   const hiddenPaths = [
//     '/auth',
//     '/login',
//     '/register',
//     '/admin/dashboard',
//     '/admin/users',
//     '/admin/courses',
//     '/admin/courses/new',
//     '/admin/categories',
//     '/course-player/:id',
//     '/admin/feedback',
//     '/QnA',
//     '/add-course',
//     '/instructor-dashboard',
//   ];

//   useEffect(() => {
//     if (success) {
//       toast.success('Thank you for your feedback!');
//       setMessages(prev => [...prev, { from: 'user', text: content }]);
//       setContent('');
//       dispatch(resetFeedbackState());
//     }

//     if (error) {
//       toast.error('Needed login to send feedback.');

//       setTimeout(() => {
//         navigate('/auth');
//       }, 1000);
//       dispatch(resetFeedbackState());
//     }
//   }, [success, error, content, dispatch, navigate]);
//   const handleSubmit = async () => {
//     if (!content.trim()) {
//       toast.error('Please enter your feedback before submitting.');
//       return;
//     }
//     dispatch(submitFeedback(content));
//   };
//   if (hiddenPaths.some(path => currentPath.startsWith(path))) {
//     return null;
//   }
//   return (
//     <>
//       <button
//         onClick={() => setOpen(prev => !prev)}
//         className="fixed bottom-6 right-6 bg-[#F48C06] hover:bg-[#e37b00] transition duration-300 text-white p-3 rounded-full shadow-lg z-50"
//         title="Chat with admin"
//       >
//         <FaCommentDots className="text-2xl" />
//       </button>

//       {open && (
//         <div className="fixed bottom-20 right-6 w-80 min-h-[450px] bg-white rounded shadow-xl border flex flex-col z-50">
//           {/* Header */}
//           <div className="bg-[#F48C06] text-white px-4 py-2 rounded-t flex justify-between items-center">
//             <span className="font-semibold">Send feedback to admin</span>
//             <button
//               title="close"
//               onClick={() => setOpen(false)}
//               className="text-white text-sm hover:underline"
//             >
//               <FaTimes />
//             </button>
//           </div>

//           <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 text-sm bg-gray-50">
//             {messages.map((msg, idx) => (
//               <div
//                 key={idx}
//                 className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
//               >
//                 <div
//                   className={`px-3 py-2 rounded-lg max-w-[70%] ${
//                     msg.from === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800'
//                   }`}
//                 >
//                   {msg.text}
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Form nhập */}
//           <div className="border-t p-3 bg-white">
//             <textarea
//               rows={2}
//               value={content}
//               onChange={e => {
//                 const words = e.target.value.trim().split(/\s+/);
//                 if (words.length <= 255) {
//                   setContent(e.target.value);
//                   setWordCount(words.length);
//                 }
//               }}
//               placeholder=" Enter a feedbacks..."
//               className="w-full border rounded px-2 py-1 text-sm"
//             />
//             <div className="flex justify-between mt-1 items-center text-xs text-gray-500">
//               <span>{wordCount}/255 words</span>
//               <button
//                 title="send"
//                 onClick={handleSubmit}
//                 className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F48C06] hover:bg-[#e37b00] hover:scale-110 text-white transition duration-300"
//               >
//                 <FaPaperPlane className="text-sm" />
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default FeedbackWidget;
