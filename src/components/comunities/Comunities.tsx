import about3 from '@/assets/images/about3.png';
import rightIcon from '@/assets/icons/right-icon.svg';

const Comunities = () => {
  return (
    <section className="py-16 bg-slate-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center ">
        <div className="flex-1">
          <img src={about3} alt="about" className="w-full h-full rounded-lg" />
        </div>
        <div className="flex-1 pl-16 ">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-blue-900">
            Learner outcomes on <br /> courses you will take
          </h2>
          <div>
            <div className="flex items-start gap-4 mb-6">
              <img src={rightIcon} alt="icon" className="w-6 h-6" />
              <p className="text-gray-700 text-lg">
                Join millions of people from around the world learning together. Online learning is
                as easy and natural.
              </p>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <img src={rightIcon} alt="icon" className="w-6 h-6" />
              <p className="text-gray-700 text-lg">
                Techniques to engage effectively with vulnerable children and young people.
              </p>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <img src={rightIcon} alt="icon" className="w-6 h-6" />
              <p className="text-gray-700 text-lg">
                Join collaborative projects and grow by sharing ideas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Comunities;
