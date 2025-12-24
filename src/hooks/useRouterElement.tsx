import { useLocation, useRoutes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ReactNode } from 'react';
import HomePage from '@/pages/home/HomePage';
import PageNotFound from '@/pages/404/PageNotFound';
import { path } from '@/core/constants/path';
import Contact from '@/pages/contact/Contact';
import OtpConfirmPage from '@/pages/otpConfirm/OtpConfirm';
import CourseList from '@/pages/courseList/CourseList';
import MyLearning from '@/pages/my learning/MyLearning';
import MyList from '@/pages/my learning/NyListCourse';
import Wishlist from '@/pages/my learning/Wishlist';
import ShoppingCart from '@/pages/shoppingCart/ShoppingCart';
import CoursePlayerPage from '@/pages/coursePlayer/CoursePlayerPage';
import CoursePreview from '@/pages/courseDetail/CourseDetail';
import Dashboard from '@/pages/Admin/Dashboard';
import Courses from '@/pages/Admin/Courses';
import Users from '@/pages/Admin/Users';
import Loader from '@/components/loader/Loader';
import ForgotPassword from '@/pages/forgotPassword/ForgotPassword';
import UserEdit from '@/pages/userProfile/UserEdit';
import UserProfile from '@/pages/userProfile/UserProfile';
import AdminGuard from '@/components/guard/AdminGuard';
import PurchaseHistory from '@/components/purchaseHistory/PurchaseHistory';
import CourseForm from '@/pages/courseForm/CourseForm';
import InstructorGuard from '@/components/guard/InstructorGuard';
import CourseByCategory from '@/pages/courseList/CourseListByCategory';
import CategoriesPage from '@/pages/Admin/CategoriesPage';
import Feedback from '@/pages/Admin/FeedbackPage';
import AuthPage from '@/pages/Auth/Auth';
import InstructorDashboard from '@/pages/instructor/instructorDashboard';
import InstructorCommentsDashboard from '@/components/instructorDashboard/Q&A/q&a';
import InstructorQuizsDashboard from '@/components/instructorDashboard/Quiz/quiz';
import ChatPage from '@/pages/chat/chat';
import CouponPage from '@/pages/Admin/CouponPage';
import HashtagPage from '@/pages/Admin/HashtagPage';

interface RouteConfig {
  path: string;
  element: ReactNode;
}

export default function useRoutesElements() {
  const location = useLocation();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const routes: RouteConfig[] = [
    { path: path.home, element: <HomePage /> },
    { path: path.auth, element: <AuthPage /> },
    { path: path.forgotPassword, element: <ForgotPassword /> },
    { path: path.contact, element: <Contact /> },
    { path: path.verifyOtp, element: <OtpConfirmPage /> },
    { path: path.courseList, element: <CourseList /> },
    { path: path.courseListByCategory, element: <CourseByCategory /> },
    { path: path.myLearning, element: <MyLearning /> },
    { path: path.myList, element: <MyList /> },
    { path: path.wishList, element: <Wishlist /> },
    { path: path.cart, element: <ShoppingCart /> },
    { path: path.coursePlayer, element: <CoursePlayerPage /> },
    { path: path.courseDetail, element: <CoursePreview /> },
    { path: path.userEdit, element: <UserEdit /> },
    { path: path.userProfile, element: <UserProfile /> },
    { path: path.purchaseHistory, element: <PurchaseHistory /> },
    { path: path.chat, element: <ChatPage /> },
    {
      path: path.instructor.instructorDashboard,
      element: (
        <InstructorGuard>
          <InstructorDashboard />
        </InstructorGuard>
      ),
    },
    {
      path: path.instructor.addCourse,
      element: (
        <InstructorGuard>
          <CourseForm />
        </InstructorGuard>
      ),
    },
    {
      path: path.instructor.QnA,
      element: (
        <InstructorGuard>
          <InstructorCommentsDashboard />
        </InstructorGuard>
      ),
    },
    {
      path: path.qnaClient,
      element: <InstructorCommentsDashboard />,
    },
    {
      path: path.instructor.addQuiz,
      element: (
        <InstructorGuard>
          <InstructorQuizsDashboard />
        </InstructorGuard>
      ),
    },
    {
      path: path.admin.dashboard,
      element: (
        <AdminGuard>
          <Dashboard />
        </AdminGuard>
      ),
    },
    {
      path: path.admin.courses,
      element: (
        <AdminGuard>
          <Courses />
        </AdminGuard>
      ),
    },
    {
      path: path.admin.categories,
      element: (
        <AdminGuard>
          <CategoriesPage />
        </AdminGuard>
      ),
    },
    {
      path: path.admin.courseForm,
      element: (
        <AdminGuard>
          <CourseForm />
        </AdminGuard>
      ),
    },
    {
      path: path.admin.users,
      element: (
        <AdminGuard>
          <Users />
        </AdminGuard>
      ),
    },
    {
      path: path.admin.feedback,
      element: (
        <AdminGuard>
          <Feedback />
        </AdminGuard>
      ),
    },
    {
      path: path.admin.coupon,
      element: (
        <AdminGuard>
          <CouponPage />
        </AdminGuard>
      ),
    },
    {
      path: path.admin.hashtag,
      element: (
        <AdminGuard>
          <HashtagPage />
        </AdminGuard>
      ),
    },
    { path: '*', element: <PageNotFound /> },
  ];

  const routeElements = useRoutes(routes, location);

  return loading ? (
    <div className="flex justify-center items-center min-h-screen bg-white transition-all duration-500">
      <Loader />
    </div>
  ) : (
    routeElements
  );
}
