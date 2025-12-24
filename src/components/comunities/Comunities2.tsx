
const Comunities2 = () => {
  return (
    <section className="py-16 bg-slate-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center ">
        <div className="flex-1">
          <img
            src="src/assets/images/about2.png"
            alt="about"
            className="w-full rounded-lg"
          />
        </div>
        <div className="flex-1 pl-16 ">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-blue-900 md: mt-4">
            Take the next step <br />
            toward your personal and <br /> professional goals with us.
          </h2>
          <div>
            <div className="flex items-start gap-4 mb-6">
              <p className="text-gray-700 text-lg">
              The automated process all your website tasks. Discover tools and <br />techniques to engage effectively with vulnerable children and young people.
              </p>
            </div>
          </div>
          <button className="px-6 py-2 bg-[#FF9F67] rounded-full hover:bg-[#C86FFF]">Join now for free</button>
        </div>
      </div>
    </section>
  );
};

export default Comunities2;
