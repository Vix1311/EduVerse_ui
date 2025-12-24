import Advancefeature from '@/components/advanceFeature/Advancefeature';
import Companies from '@/components/companies/Companies';
import Comunities from '@/components/comunities/Comunities';
import Comunities2 from '@/components/comunities/Comunities2';
import Conter from '@/components/conter/Conter';
import CourseCard from '@/components/courseCard/CourseCard';
import ExploreTop from '@/components/exploreTop/ExploreTop';
import Footer from '@/components/footer/Footer';
import HeaderFixed from '@/components/header/HeaderFixed';
import Hero from '@/components/hero/Hero';
import Testimonial from '@/components/testimonial/Testimonial';

const HomePage = () => {
  return (
    <div className="relative min-h-screen">
      <div className="absolute gradient-background white-background z-0" />
      <div className="relative z-10">
        <HeaderFixed />
        <Hero />
        <Advancefeature />
        {/* <ExploreTop /> */}
        <CourseCard />
        <Conter />
        <Comunities />
        <Companies />
        <Testimonial />
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
