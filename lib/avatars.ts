// lib/avatars.ts

// Define a strict type for what an Avatar object looks like.
export interface Avatar {
    id: number;
    src: string;
    gender: 'male' | 'female';
    hair: 'blonde' | 'brunette' | 'ginger' | 'gray';
    number: number;
    age: 'adult' | 'senior';
    location: 'inside' | 'outside';
    label: string;
    norwegianVoiceId?: string;
    dutchVoiceId?: string;
    danishVoiceId?: string;
    swedishVoiceId?: string;
    englishVoiceId?: string;
  }
  
  // Define and export the list of avatars.
  // This is the single source of truth for the entire application.
  export const avatars: Avatar[] = [
    // Female Adults
    { id: 1, src: '/avatars/female-blonde-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 1, age: 'adult', location: 'inside', label: 'Female Blonde 1 (Adult, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk' },
    { id: 2, src: '/avatars/female-blonde2-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 2, age: 'adult', location: 'inside', label: 'Female Blonde 2 (Adult, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk' },
    { id: 3, src: '/avatars/female-blonde3-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 3, age: 'adult', location: 'inside', label: 'Female Blonde 3 (Adult, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk' },
    { id: 4, src: '/avatars/female-blonde4-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 4, age: 'adult', location: 'inside', label: 'Female Blonde 4 (Adult, Inside)' },
    { id: 5, src: '/avatars/female-brunette-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Female Brunette 1 (Adult, Inside)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu' },
    { id: 6, src: '/avatars/female-brunette2-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 2, age: 'adult', location: 'inside', label: 'Female Brunette 2 (Adult, Inside)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu' },
    { id: 7, src: '/avatars/female-brunette3-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 3, age: 'adult', location: 'inside', label: 'Female Brunette 3 (Adult, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk' },
    
    // Female Seniors
    { id: 8, src: '/avatars/female-blonde-senior-inside.mp4', gender: 'female', hair: 'blonde', number: 1, age: 'senior', location: 'inside', label: 'Female Blonde (Senior, Inside)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu', dutchVoiceId: 'OlBRrVAItyi00MuGMbna', danishVoiceId: 'ZKutKtutnlbOxDxkNlhk', swedishVoiceId: 'ZSHzpa6aUvhjzShiBmYw', englishVoiceId: 'G4qRCQqs61rS7Xa48jcx' },
    { id: 13, src: '/avatars/female-blond2-senior-inside.mp4', gender: 'female', hair: 'blonde', number: 2, age: 'senior', location: 'inside', label: 'Female Blonde 2 (Senior, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk', dutchVoiceId: 'YUdpWWny7k5yb4QCeweX', danishVoiceId: '4RklGmuxoAskAbGXplXN', swedishVoiceId: 'ydcjeBaRUalXzqZuTB3b', englishVoiceId: 'v8DWAeuEGQSfwxqdH9t2' },
    { id: 14, src: '/avatars/female-blonde3-senior-inside.mp4', gender: 'female', hair: 'blonde', number: 3, age: 'senior', location: 'inside', label: 'Female Blonde 3 (Senior, Inside)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu', dutchVoiceId: 'ANHrhmaFeVN0QJaa0PhL', danishVoiceId: 'ZKutKtutnlbOxDxkNlhk', swedishVoiceId: '4Ct5uMEndw4cJ7q0Jx0l', englishVoiceId: 'OB0Jj6v9DGLLgz8dD57i' },
    { id: 15, src: '/avatars/female-brunette-senior-inside.mp4', gender: 'female', hair: 'brunette', number: 1, age: 'senior', location: 'inside', label: 'Female Brunette (Senior, Inside)', norwegianVoiceId: 'k5IgYJw2jfo6mO5HhagG', dutchVoiceId: 'OlBRrVAItyi00MuGMbna', danishVoiceId: '4RklGmuxoAskAbGXplXN', swedishVoiceId: 'ZSHzpa6aUvhjzShiBmYw', englishVoiceId: 'G4qRCQqs61rS7Xa48jcx' },
    { id: 16, src: '/avatars/female-ginger-senior-inside.mp4', gender: 'female', hair: 'ginger', number: 1, age: 'senior', location: 'inside', label: 'Female Ginger (Senior, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk', dutchVoiceId: 'YUdpWWny7k5yb4QCeweX', danishVoiceId: 'ZKutKtutnlbOxDxkNlhk', swedishVoiceId: 'ydcjeBaRUalXzqZuTB3b', englishVoiceId: 'v8DWAeuEGQSfwxqdH9t2' },
    
    // Male Adults
    { id: 9, src: '/avatars/male-brunette-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Male Brunette 1 (Adult, Inside)', norwegianVoiceId: 'CMVyxPycEkgLpEF85ShA' },
    { id: 10, src: '/avatars/male-brunette2-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 2, age: 'adult', location: 'inside', label: 'Male Brunette 2 (Adult, Inside)', norwegianVoiceId: '9pRpxWU0T7UFt2oEMH6n' },
    { id: 11, src: '/avatars/male-brunette3-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 3, age: 'adult', location: 'inside', label: 'Male Brunette 3 (Adult, Inside)', norwegianVoiceId: 'xu4HzZYeAR4ynjjVC7cm' },
    { id: 12, src: '/avatars/male-blonde-adult-inside.mp4', gender: 'male', hair: 'blonde', number: 1, age: 'adult', location: 'inside', label: 'Male Blonde 1 (Adult, Inside)', norwegianVoiceId: 's2xtA7B2CTXPPlJzch1v' },
    
    // Male Seniors
    { id: 17, src: '/avatars/male-blonde-senior-inside.mp4', gender: 'male', hair: 'blonde', number: 1, age: 'senior', location: 'inside', label: 'Male Blonde (Senior, Inside)', norwegianVoiceId: 's2xtA7B2CTXPPlJzch1v', dutchVoiceId: 'G53Wkf3yrsXvhoQsmslL', danishVoiceId: 'ADRrvIX3j1uTFlD5q6DE', swedishVoiceId: 'Hyidyy6OA9R3GpDKGwoZ', englishVoiceId: '1YBpxMFAafA83t7u1xof' },
    { id: 18, src: '/avatars/male-brunette-senior-inside.mp4', gender: 'male', hair: 'brunette', number: 1, age: 'senior', location: 'inside', label: 'Male Brunette 1 (Senior, Inside)', norwegianVoiceId: 'vUmLiNBm6MDcy1NUHaVr', dutchVoiceId: 'eQIVHCAcQuAFeJps0K5l', danishVoiceId: 'xj6X4BCUsv9oxohm1E8o', swedishVoiceId: '1uZ0SLDbZd88cfCPzFQo', englishVoiceId: 'PGoKnSD4gKn2aS99wOR2' },
    { id: 19, src: '/avatars/male-brunette2-senior-inside.mp4', gender: 'male', hair: 'brunette', number: 2, age: 'senior', location: 'inside', label: 'Male Brunette 2 (Senior, Inside)', norwegianVoiceId: 'vUmLiNBm6MDcy1NUHaVr', dutchVoiceId: 'k2lOYklosuhYWH02PIXL', danishVoiceId: 'Hp07ONf6C5qlCKOeB4oo', swedishVoiceId: 'e6OiUVixGLmvtdn2GJYE', englishVoiceId: 'NYkjXRso4QIcgWakN1Cr' },
    { id: 20, src: '/avatars/male-gray-senior-inside.mp4', gender: 'male', hair: 'gray', number: 1, age: 'senior', location: 'inside', label: 'Male Gray (Senior, Inside)', norwegianVoiceId: '9pRpxWU0T7UFt2oEMH6n', dutchVoiceId: 'G53Wkf3yrsXvhoQsmslL', danishVoiceId: 'ADRrvIX3j1uTFlD5q6DE', swedishVoiceId: 'Hyidyy6OA9R3GpDKGwoZ', englishVoiceId: '1YBpxMFAafA83t7u1xof' },
  ];

// Helper function to get avatar gender by ID
export function getAvatarGender(avatarId: number): 'male' | 'female' {
  const avatar = avatars.find(a => a.id === avatarId);
  return avatar?.gender || 'female'; // Default to female if not found
}

// Helper function to get Norwegian voice ID by avatar ID
export function getNorwegianVoiceId(avatarId: number): string | undefined {
  const avatar = avatars.find(a => a.id === avatarId);
  return avatar?.norwegianVoiceId;
}

// Helper function to get Dutch voice ID by avatar ID
export function getDutchVoiceId(avatarId: number): string | undefined {
  const avatar = avatars.find(a => a.id === avatarId);
  return avatar?.dutchVoiceId;
}

// Helper function to get Danish voice ID by avatar ID
export function getDanishVoiceId(avatarId: number): string | undefined {
  const avatar = avatars.find(a => a.id === avatarId);
  return avatar?.danishVoiceId;
}

// Helper function to get Swedish voice ID by avatar ID
export function getSwedishVoiceId(avatarId: number): string | undefined {
  const avatar = avatars.find(a => a.id === avatarId);
  return avatar?.swedishVoiceId;
}

// Helper function to get English voice ID by avatar ID
export function getEnglishVoiceId(avatarId: number): string | undefined {
  const avatar = avatars.find(a => a.id === avatarId);
  return avatar?.englishVoiceId;
}

// Helper function to get voice ID by avatar ID and language
export function getVoiceIdByLanguage(avatarId: number, language: string): string | undefined {
  const avatar = avatars.find(a => a.id === avatarId);
  if (!avatar) return undefined;
  
  switch (language.toLowerCase()) {
    case 'norwegian':
    case 'no':
      return avatar.norwegianVoiceId;
    case 'dutch':
    case 'nl':
      return avatar.dutchVoiceId;
    case 'danish':
    case 'da':
      return avatar.danishVoiceId;
    case 'swedish':
    case 'sv':
      return avatar.swedishVoiceId;
    case 'english':
    case 'en':
      return avatar.englishVoiceId;
    default:
      return avatar.norwegianVoiceId; // Default fallback
  }
}