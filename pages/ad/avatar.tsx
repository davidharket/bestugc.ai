import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useAdCreation } from '../../components/AdCreationContext'

const avatars = [
  { id: 1, src: '/avatars/male-adult-inside.mp4', gender: 'male', age: 'adult', location: 'inside', label: 'Male Adult (Inside)' },
  { id: 2, src: '/avatars/male-adult-outside.mp4', gender: 'male', age: 'adult', location: 'outside', label: 'Male Adult (Outside)' },
  { id: 3, src: '/avatars/female-adult-inside.mp4', gender: 'female', age: 'adult', location: 'inside', label: 'Female Adult (Inside)' },
  { id: 4, src: '/avatars/female-adult-outside.mp4', gender: 'female', age: 'adult', location: 'outside', label: 'Female Adult (Outside)' },
  { id: 5, src: '/avatars/male-senior-inside.mp4', gender: 'male', age: 'senior', location: 'inside', label: 'Male Senior (Inside)' },
  { id: 6, src: '/avatars/female-senior-outside.mp4', gender: 'female', age: 'senior', location: 'outside', label: 'Female Senior (Outside)' },
]

const genderOptions = ['male', 'female']
const ageOptions = ['adult', 'senior']
const locationOptions = ['inside', 'outside']

export default function AvatarAd() {
  const router = useRouter()
  const { adData, setAdData } = useAdCreation()
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(adData.avatarId || null)
  const [gender, setGender] = useState<string | null>(null)
  const [age, setAge] = useState<string | null>(null)
  const [location, setLocation] = useState<string | null>(null)

  useEffect(() => {
    setAdData({ avatarId: selectedAvatar === null ? undefined : selectedAvatar })
    // eslint-disable-next-line
  }, [selectedAvatar])

  const filteredAvatars = avatars.filter(a =>
    (!gender || a.gender === gender) &&
    (!age || a.age === age) &&
    (!location || a.location === location)
  )

  const handleNext = () => {
    router.push('/ad/render')
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Choose Avatar - Step 4</h1>
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block font-medium mb-1">Gender</label>
          <div className="flex gap-2">
            {genderOptions.map(opt => (
              <button
                key={opt}
                className={`px-3 py-1 border rounded ${gender === opt ? 'bg-blue-600 text-white' : 'bg-white'}`}
                onClick={() => setGender(gender === opt ? null : opt)}
                type="button"
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Age</label>
          <div className="flex gap-2">
            {ageOptions.map(opt => (
              <button
                key={opt}
                className={`px-3 py-1 border rounded ${age === opt ? 'bg-blue-600 text-white' : 'bg-white'}`}
                onClick={() => setAge(age === opt ? null : opt)}
                type="button"
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Location</label>
          <div className="flex gap-2">
            {locationOptions.map(opt => (
              <button
                key={opt}
                className={`px-3 py-1 border rounded ${location === opt ? 'bg-blue-600 text-white' : 'bg-white'}`}
                onClick={() => setLocation(location === opt ? null : opt)}
                type="button"
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredAvatars.length === 0 && <div className="text-gray-400 col-span-3">No avatars match the selected filters.</div>}
        {filteredAvatars.map(a => (
          <div
            key={a.id}
            className={`border rounded p-2 flex flex-col items-center cursor-pointer ${selectedAvatar === a.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedAvatar(a.id)}
          >
            <video src={a.src} controls className="w-40 h-32 mb-2 rounded" />
            <div className="text-sm text-center">{a.label}</div>
          </div>
        ))}
      </div>
      <button
        className="mt-8 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={handleNext}
        disabled={selectedAvatar === null}
      >
        Next
      </button>
    </div>
  )
} 