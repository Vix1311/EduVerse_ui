const ContactSection = () => {
  return (
    <div className="flex flex-wrap p-8 md:p-16">
      <div className="w-full md:w-1/2 ">
        <h2 className="text-4xl font-bold mb-4 text-blue-900">Get in Touch</h2>
        <form>
          <div className="mb-4">
            <label
              htmlFor="message"
              className="block text-gray-700 font-medium text-lg mb-2"
            >
              Your Message
            </label>
            <textarea
              id="message"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Enter your message here..."
            ></textarea>
          </div>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-gray-700 font-medium text-lg mb-2"
            >
              Your Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 font-medium text-lg mb-2"
            >
              Your Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="subject"
              className="block text-gray-700 font-medium text-lg mb-2"
            >
              Subject
            </label>
            <input
              type="text"
              id="subject"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter subject"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-4 font-bold bg-transparent text-[#FF9F67] border-2 border-[#FF9F67] rounded-xl hover:bg-[#FF9F67] hover:text-white transition-colors duration-500"
          >
            SEND
          </button>
        </form>
      </div>

      <div className="w-full md:w-1/2 mt-6 md:mt-0 md:pl-12 ">
        <h2 className="text-3xl font-bold mb-4 text-blue-900">
          Contact Information
        </h2>
        <p className="text-gray-700 text-lg">
          <strong>Address:</strong> Buttonwood, California, Rosemead, CA 91770
        </p>
        <p className="text-gray-700 mt-2 text-lg">
          <strong>Phone:</strong> +1 253 565 2365 <br />
          <span className="text-gray-500">Mon to Fri 9am to 6pm</span>
        </p>
        <p className="text-gray-700 mt-2 text-lg">
          <strong>Email:</strong> support@colorlib.com <br />
          <span className="text-gray-500">Send us your query anytime!</span>
        </p>
      </div>
    </div>
  );
};

export default ContactSection;
