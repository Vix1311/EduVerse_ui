import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Step4UploadContent = ({ courseId, topicTitle, lessonTitle, goBack, onComplete }: any) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [document, setDocument] = useState<File | null>(null);

  const uploadContent = async () => {
    try {
      if (videoUrl && thumbnailUrl) {
        await axios.post(
          `https://eduverseapi-production.up.railway.app/api/v1/courses/${courseId}/preview`,
          { video_url: videoUrl, thumbnail: thumbnailUrl },
          { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } },
        );
      }
      if (document) {
        const formData = new FormData();
        formData.append('documents', document);
        await axios.post(
          `https://eduverseapi-production.up.railway.app/api/v1/courses/${courseId}/upload-material`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'multipart/form-data',
            },
          },
        );
      }
      toast.success('Content uploaded');
      onComplete({ _id: courseId });
    } catch (error) {
      toast.error('Upload failed');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Step 4: Upload Content for <b>{lessonTitle}</b> in Topic<b>{topicTitle}</b> in Course <b>{courseId}</b>
      </h2>
      <input
        value={videoUrl}
        onChange={e => setVideoUrl(e.target.value)}
        placeholder="Video URL"
        className="w-full border p-2 rounded"
      />
      <input
        value={thumbnailUrl}
        onChange={e => setThumbnailUrl(e.target.value)}
        placeholder="Thumbnail URL"
        className="w-full border p-2 rounded"
      />
      <input
        title="file"
        type="file"
        onChange={e => setDocument(e.target.files?.[0] || null)}
        className="w-full border p-2 rounded"
      />
      <div className="flex gap-4">
        <button onClick={goBack} className="bg-gray-500 text-white px-4 py-2 rounded">
          Back
        </button>
        <button onClick={uploadContent} className="bg-green-600 text-white px-6 py-2 rounded">
          Complete
        </button>
      </div>
    </div>
  );
};

export default Step4UploadContent;
