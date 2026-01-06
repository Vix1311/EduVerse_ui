import { configureStore } from '@reduxjs/toolkit';
import userReducer from './user.slice';
import cartReducer from '@/redux/slices/cart.slice';
import instructorReducer from '@/redux/slices/instructor.slice';
import courseReducer from '@/redux/slices/course.slice';
import coursePlayerReducer from '@/redux/slices/coursePlayer.slice';
import categoryReducer from '@/redux/slices/category.slice';
import feedBackReducer from '@/redux/slices/feedback.slice';
import purchaseReducer from '@/redux/slices/purchaseHistory.slice';
import courseDetailReducer from '@/redux/slices/courseDetail.slice';
import wishlistReducer from '@/redux/slices/wishlist.slice';
import categoryCoursesReducer from '@/redux/slices/categoryCourses.slice';
import forgotPasswordReducer from '@/redux/slices/forgotPassword.slice';
import otpConfirmReducer from '@/redux/slices/otpConfirm.slices';
import editUserReducer from '@/redux/slices/userProfile.slice';
import categorySearchReducer from '@/redux/slices/categorySearch.slice';
import CourseFormReducer from '@/redux/slices/courseForm.slice';
import myLearningReducer from '@/redux/slices/myLearning.slice';
import uiReducer from '@/redux/slices/ui.slice';
import usersReducer from '@/redux/slices/adminSlices/user.slice';
import categoriesReducer from '@/redux/slices/adminSlices/category.slice';
import hashtagReducer from '@/redux/slices/hashtag.slice';
import moduleReducer from '@/redux/slices/module.slice';
import couponReducer from '@/redux/slices/adminSlices/coupon.slice';
import quizReducer from '@/redux/slices/quiz.slice';
import chatReducer from '@/redux/slices/chat.slice';
import teacherFollowReducer from '@/redux/slices/teacherFollow.slice';
import moduleQuizReducer from '@/redux/slices/moduleQuiz.slice';
import lessonQuizReducer from '@/redux/slices/lessonQuiz.slice';
import courseSearchReducer from '@/redux/slices/courseSearch.slice';
import chatBotReducer from '@/redux/slices/chatbot.slice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    instructors: instructorReducer,
    courses: courseReducer,
    coursePlayer: coursePlayerReducer,
    category: categoryReducer,
    feedBack: feedBackReducer,
    purchaseHistory: purchaseReducer,
    courseDetail: courseDetailReducer,
    wishlist: wishlistReducer,
    categoryCourses: categoryCoursesReducer,
    forgotPassword: forgotPasswordReducer,
    otpConfirm: otpConfirmReducer,
    userProfile: editUserReducer,
    categorySearch: categorySearchReducer,
    courseSearch: courseSearchReducer,
    courseForm: CourseFormReducer,
    myLearning: myLearningReducer,
    ui: uiReducer,
    users: usersReducer,
    categories: categoriesReducer,
    hashtag: hashtagReducer,
    module: moduleReducer,
    coupon: couponReducer,
    quiz: quizReducer,
    chat: chatReducer,
    moduleQuiz: moduleQuizReducer,
    lessonQuiz: lessonQuizReducer,
    teacherFollow: teacherFollowReducer,
    chatbot: chatBotReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
