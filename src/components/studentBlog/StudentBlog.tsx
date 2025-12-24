import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Blog {
  id: number;
  title: string;
  image: string;
  description: string;
  comments: number;
  button: string;
  like: string;
  link: string;
}

const StudentBlog = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    axios.get('/data/StudentBlogData/StudentBlogData.json').then(res => setBlogs(res.data.blogs));
  }, []);
  return (
    <div className="bg-slate-100">
      <div className="max-w-7xl mx-auto px-8 bg-slate-100">
        <h2 className=" text-3xl font-bold text-center mb-12 text-blue-900">Student blog</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 ">
          {blogs.map(blog => (
            <div
              key={blog.id}
              className="bg-slate-100 rounded-lg overflow-hidden border border-gray-300"
            >
              <img src={blog.image} alt={blog.title} className=" w-full h-auto overflow-hiddenF" />
              <div className=" ml-5 pt-6 flex justify-start text-white">
                <button className=" px-4 py-2 bg-orange-500 hover:bg-orange-600 transition-colors duration-300 rounded-xl">
                  {blog.button}
                </button>
              </div>
              <div className=" p-6">
                <Link
                  to="#"
                  className="  text-xl font-bold mb-2 text-blue-500 hover:underline hover:text-orange-500 transition-colors duration-300"
                >
                  {blog.title}
                </Link>
                <p className=" text-gray-600 mb-4 pt-5">{blog.description}</p>
              </div>

              <div className=" flex items-center justify-between mb-4 px-2">
                <span className=" text-end text-gray-500 flex">
                  <img
                    src="src/assets/icons/icons8-comments-48.png"
                    alt=""
                    className=" w-5 h-5 mr-2"
                  />
                  {blog.comments} comments
                </span>
                <span className=" text-end flex text-gray-500">
                  <img src="src/assets/icons/icons8-heart-50.png" alt="" className="w-5 h-5 mr-2" />
                  {blog.like} likes
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentBlog;
