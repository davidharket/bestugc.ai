import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useAdCreation } from '../../components/AdCreationContext'

const avatars = [
  { id: 1, src: '/avatars/female-blonde-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 1, age: 'adult', location: 'inside', label: 'Female Blonde 1 (Adult, Inside)' },
  { id: 2, src: '/avatars/female-blonde2-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 2, age: 'adult', location: 'inside', label: 'Female Blonde 2 (Adult, Inside)' },
  { id: 3, src: '/avatars/female-blonde3-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 3, age: 'adult', location: 'inside', label: 'Female Blonde 3 (Adult, Inside)' },
  { id: 4, src: '/avatars/female-blonde4-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 4, age: 'adult', location: 'inside', label: 'Female Blonde 4 (Adult, Inside)' },
  { id: 5, src: '/avatars/female-brunette-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Female Brunette 1 (Adult, Inside)' },
  { id: 6, src: '/avatars/female-brunette2-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 2, age: 'adult', location: 'inside', label: 'Female Brunette 2 (Adult, Inside)' },
  { id: 7, src: '/avatars/female-brunette3-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 3, age: 'adult', location: 'inside', label: 'Female Brunette 3 (Adult, Inside)' },
  { id: 8, src: '/avatars/female-blonde-senior-inside.mp4', gender: 'female', hair: 'blonde', number: 1, age: 'senior', location: 'inside', label: 'Female Blonde (Senior, Inside)' },
  { id: 9, src: '/avatars/male-brunette-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Male Brunette (Adult, Inside)' },
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
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
        {filteredAvatars.length === 0 && <div className="text-gray-400 col-span-4">No avatars match the selected filters.</div>}
        {filteredAvatars.map(a => (
          <div
            key={a.id}
            className={`border rounded p-2 flex flex-col items-center cursor-pointer bg-white shadow-sm transition ring-offset-2 ${selectedAvatar === a.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedAvatar(a.id)}
            style={{ minWidth: 0 }}
          >
            <div className="w-full flex justify-center items-center" style={{ aspectRatio: '9/16', maxWidth: '100%' }}>
              <video 
                src={a.src}
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                style={{ width: '100%', height: 'auto', borderRadius: 8, objectFit: 'cover' }}
              />
            </div>
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