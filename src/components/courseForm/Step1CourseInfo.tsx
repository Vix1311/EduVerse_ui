import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Step1CourseInfo = ({ setCourseData, goNext, onBack, onComplete }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(1000);
  const [level, setLevel] = useState('Beginner');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/v1/categories', {
          params: { limit: 20 },
        });
        setCategories(res.data.data.categories || []);
      } catch (error) {
        toast.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  const createCourse = async (withNext: boolean = true) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        toast.error('Access token is required');
        return;
      }
      console.log('Sending token:', accessToken);

      const res = await axios.post(
        'http://localhost:8080/api/v1/courses',
        { title, description, price, level, category },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const id = res.data.data.course_id;
      const newCourse = {
        _id: id,
        title,
        categoryName: categories.find(cat => cat._id === category)?.name || 'N/A',
      };

      setCourseData(newCourse);
      if (withNext) {
        onComplete(newCourse);
        goNext();
      } else {
        toast.success('Saved');
        setTitle('');
        setDescription('');
        setPrice(1000);
        setLevel('Beginner');
        setCategory('');
      }
    } catch (error) {
      toast.error('Failed to create course');
    }
  };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Step 1: Create Course</h2>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full border p-2 rounded"
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full border p-2 rounded"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="number"
          value={price}
          onChange={e => setPrice(Number(e.target.value))}
          placeholder="Price"
          className="border p-2 rounded"
        />
        <select
          title="level"
          value={level}
          onChange={e => setLevel(e.target.value)}
          className="border p-2 rounded"
        >
          {['Beginner', 'Intermediate', 'Advanced'].map(level => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <select
          title="category"
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-4">
        <button onClick={onBack} className="bg-gray-500 text-white px-4 py-2 rounded">
          Back
        </button>
        <button
          onClick={() => createCourse(true)}
          className="bg-purple-600 text-white px-6 py-2 rounded"
        >
          Continue
        </button>
        <button
          onClick={() => createCourse(false)}
          className="bg-orange-500 text-white px-6 py-2 rounded"
        >
          Save & Add Another
        </button>
      </div>
    </div>
  );
};

export default Step1CourseInfo;
