import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import {
  fetchUserProfile,
  updateUserProfile,
  uploadUserImage,
} from '@/redux/slices/userProfile.slice';

const isValidName = (name: string) => /^[\p{L}\p{M} \-']+$/u.test(name.trim());

const UserEdit = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: profileData } = useSelector((state: RootState) => state.userProfile);
  interface FormDataState {
    firstName: string;
    lastName: string;
    username: string;
    headline: string;
    biography: string;
    language: string;
    date_of_birth: string;
    gender: string;
    email: string;
    phone_number: string;
    experience: string;
    country: string;
    timezone: string;
    interests: string[];
    links: {
      facebook: string;
      instagram: string;
      linkedin: string;
    };
    profileImage: string;
    coverPhoto: string;
  }

  const [formData, setFormData] = useState<FormDataState>({
    firstName: '',
    lastName: '',
    username: '',
    headline: '',
    biography: '',
    language: 'English (US)',
    date_of_birth: '',
    gender: '',
    email: '',
    phone_number: '',
    experience: '',
    country: '',
    timezone: '',
    interests: [],
    links: {
      facebook: '',
      instagram: '',
      linkedin: '',
    },
    profileImage: 'src/assets/icons/user.png',
    coverPhoto: 'src/assets/images/cover.png',
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (!profileData) return;

    const fullName = (profileData as any).fullname || (profileData as any).full_name || '';

    const parts = fullName.trim().split(' ');
    const first = parts[0] || '';
    const last = parts.slice(1).join(' ') || '';

    setFormData(prev => ({
      ...prev,

      firstName: first || prev.firstName,
      lastName: last || prev.lastName,
      username: (profileData as any).username ?? prev.username,

      email: (profileData as any).email ?? prev.email,

      profileImage:
        (profileData as any).avatar ?? (profileData as any).profileImage ?? prev.profileImage,
      coverPhoto:
        (profileData as any).cover_photo ?? (profileData as any).coverPhoto ?? prev.coverPhoto,

      phone_number:
        (profileData as any).phoneNumber ?? (profileData as any).phone_number ?? prev.phone_number,
      date_of_birth:
        (profileData as any).dateOfBirth?.slice(0, 10) ??
        (profileData as any).date_of_birth?.slice(0, 10) ??
        prev.date_of_birth,

      gender: (profileData as any).gender ?? prev.gender,
      headline: (profileData as any).headline ?? prev.headline,
      biography: (profileData as any).bio ?? prev.biography,
      language: (profileData as any).language ?? prev.language,
      experience: (profileData as any).experience ?? prev.experience,
      country: (profileData as any).country ?? prev.country,
      timezone: (profileData as any).timezone ?? prev.timezone,
      interests: (profileData as any).interests ?? prev.interests,
      links: {
        facebook:
          (profileData as any).social_links?.facebook ??
          (profileData as any).facebook ??
          prev.links.facebook,
        instagram:
          (profileData as any).social_links?.instagram ??
          (profileData as any).instagram ??
          prev.links.instagram,
        linkedin:
          (profileData as any).social_links?.linkedin ??
          (profileData as any).linkedin ??
          prev.links.linkedin,
      },
    }));
  }, [profileData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name in formData.links) {
      setFormData({ ...formData, links: { ...formData.links, [name]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First and Last name are required');
      return false;
    }
    if (!isValidName(formData.firstName) || !isValidName(formData.lastName)) {
      toast.error('Names cannot contain emojis or special characters');
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone_number)) {
      toast.error('Phone number must be 10 digits');
      return false;
    }
    for (const [key, val] of Object.entries(formData.links)) {
      if (val && !/^https?:\/\/.+\..+/.test(val)) {
        toast.error(`${key} must be a valid URL`);
        return false;
      }
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      dispatch(uploadUserImage(file))
        .unwrap()
        .then(url => {
          setFormData(prev => ({ ...prev, avatar: url }));
          toast.success('Avatar updated!');
        })
        .catch(() => toast.error('Failed to upload avatar'));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.username || '',
      phone_number: formData.phone_number,
      profileImage: formData.profileImage,
      date_of_birth: formData.date_of_birth,
    };
    dispatch(updateUserProfile(payload))
      .unwrap()
      .then(() => toast.success('Profile updated successfully'))
      .catch(() => toast.error('Failed to update profile'));
  };

  return (
    <div>
      <div className="bg-white">
        <div className="relative w-full h-52 sm:h-64 bg-gray-200">
          <img
            src={formData.coverPhoto}
            alt="Cover photo"
            className="absolute inset-0 w-full h-full object-cover"
            onClick={() => coverInputRef.current?.click()}
          />
          <input
            title="Cover Photo"
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            // onChange={e => handleFileChange(e, 'cover')}
          />
          <div className="md:flex items-center absolute -bottom-28 sm:bottom-[-60px] lg:left-48 left-1/2 transform -translate-x-1/2 sm:left-2 sm:translate-x-0">
            <img
              src={formData.profileImage}
              alt="Avatar"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white object-cover shadow"
              onClick={() => avatarInputRef.current?.click()}
            />
            <div className="md:-mb-6 mb-8 ml-1 flex items-center gap-1.5 justify-center sm:justify-start">
              <h2 className="md:text-2xl text-xl font-bold">{formData.firstName}</h2>
              <h2 className="md:text-2xl text-xl font-bold">{formData.lastName}</h2>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="pt-14"></div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6 md:py-10">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold">First name:</label>
                <input
                  title="text"
                  name="firstName"
                  className="border p-2 w-full"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">Last name:</label>
                <input
                  title="text"
                  name="lastName"
                  className="border p-2 w-full"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold">Biography:</label>
              <textarea
                title="text"
                name="biography"
                className="border p-2 w-full h-24"
                value={formData.biography}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Gender:</label>
              <div className="flex items-center gap-4">
                {['Male', 'Female', 'Other'].map(g => (
                  <label key={g} className="flex items-center gap-2">
                    <input
                      title="text"
                      type="radio"
                      name="gender"
                      value={g}
                      checked={formData.gender === g}
                      onChange={handleInputChange}
                      className="accent-orange-600"
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold">Phone Number:</label>
              <input
                title="text"
                name="phone_number"
                className="border p-2 w-full"
                value={formData.phone_number}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">Experience:</label>
              <input
                title="text"
                name="experience"
                className="border p-2 w-full"
                value={formData.experience}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">Date of birth:</label>
              <input
                title="text"
                type="date"
                name="date_of_birth"
                className="border p-2 w-full"
                value={formData.date_of_birth}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-sm font-semibold">Username:</label>
              <input
                title="text"
                name="username"
                className="border p-2 w-full"
                value={formData.username || ''}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold">Language:</label>
              <select
                title="text"
                name="language"
                className="border p-2 w-full"
                value={formData.language}
                onChange={handleInputChange}
              >
                <option>English (US)</option>
                <option>Tiếng Việt</option>
                <option>French</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold">Country:</label>
              <input
                title="text"
                name="country"
                className="border p-2 w-full"
                value={formData.country || ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">Timezone:</label>
              <input
                title="text"
                name="timezone"
                className="border p-2 w-full"
                value={formData.timezone}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Social Links:</label>
              {Object.keys(formData.links).map(key => (
                <input
                  title="text"
                  key={key}
                  name={key}
                  placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                  className="border p-2 w-full mt-1"
                  value={formData.links[key as keyof typeof formData.links]}
                  onChange={handleInputChange}
                />
              ))}
            </div>
            <div className="flex justify-start items-center mt-6">
              <button type="submit" className="bg-orange-600 text-white px-16 py-2 rounded">
                Save
              </button>
              <Link to="/">
                <div className="text-gray-400 px-6 py-2 hover:underline">Back to home</div>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEdit;
