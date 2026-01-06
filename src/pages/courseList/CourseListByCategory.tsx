import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import Footer from '@/components/footer/Footer';
import CourseCardByCategory from '@/components/courseCard/CourseCardByCategory';
import { Header } from '@/components';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import { fetchCoursesByCategory } from '@/redux/slices/categoryCourses.slice';

const CourseByCategory = () => {
  const { categoryId } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const { courses } = useSelector((state: RootState) => state.categoryCourses);
  useEffect(() => {
    if (categoryId) {
      dispatch(fetchCoursesByCategory(categoryId));
    }
  }, [categoryId, dispatch]);
  console.log('Courses in category:', courses);
  return (
    <>
      <Header />
      <CourseCardByCategory title="Courses by Category" courses={courses} />
      <Footer />
    </>
  );
};

export default CourseByCategory;
