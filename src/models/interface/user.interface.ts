export interface UserResponseType {
  id: string
  name: string
  email: string
  role: string
}
export interface UserProfile {
  firstName: string;
  lastName: string;
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