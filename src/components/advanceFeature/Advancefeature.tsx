import { FaCalendarAlt, FaFileInvoice, FaFileSignature, FaStamp } from 'react-icons/fa';

const Advancefeature = () => {
  return (
    <section className="py-16 bg-slate-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center ">
        <div className="flex-1 pl-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-blue-900">
            Our Advance Educator Learning System
          </h2>
          <p className="text-lg mb-8 text-gray-600">
            Fifth saying upon divide divide rule for deep their female all hath brind mid Days and
            beast greater grass signs abundantly have greater also use over face earth days years
            under brought moveth she star
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col py-4 items-start gap-4 bg-white p-6 ">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F48C06] rounded-full p-2 ">
                  <FaFileSignature className="text-2xl ml-2 mt-1 text-white" />
                </div>

                <p className="text-2xl font-bold text-blue-900">Learn Anywhere</p>
              </div>
              <p className="text-gray-600">
                There earth face earth behold she star so made void two given and also our.
              </p>
            </div>

            <div className="flex flex-col py-4 items-start gap-4 bg-white p-6 ">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F48C06] rounded-full p-2 ">
                  <FaStamp className="text-2xl ml-1 mt-1 text-white" />
                </div>
                <p className="text-2xl font-bold text-blue-900">Expert Teacher</p>
              </div>
              <p className="text-gray-600">
                Learn from expert educators who bring years of experience and passion to every
                course.
              </p>
            </div>
            <div className="flex flex-col py-4 items-start gap-4 bg-white px-6 pt-6 pb-8  ">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F48C06] rounded-full p-2 ">
                  <FaFileInvoice className="text-2xl ml-1 mt-1 text-white" />
                </div>
                <p className="text-2xl font-bold text-blue-900">Invoice & Contract</p>
              </div>
              <p className="text-gray-600">
                Securely send customized invoices and agreements for every session.
              </p>
            </div>
            <div className="flex flex-col py-4 items-start gap-4 bg-white px-6 pt-6 pb-8 ">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F48C06] rounded-full p-2 ">
                  <FaCalendarAlt className="text-2xl ml-1 mt-1 text-white" />
                </div>
                <p className="text-2xl font-bold text-blue-900">Scheduling Easy</p>
              </div>
              <p className="text-gray-600">
                Easily book classes and manage attendance with confidence.
              </p>
            </div>
          </div>
        </div>
        <div>
          <img
            src="src/assets/images/advance_feature_img.png"
            alt="advanceFeture"
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
};

export default Advancefeature;
