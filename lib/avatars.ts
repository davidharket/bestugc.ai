// lib/avatars.ts

// Define a strict type for what an Avatar object looks like.
export interface Avatar {
    id: number;
    src: string;
    gender: 'male' | 'female' | 'fantasy';
    hair: 'blonde' | 'brunette' | 'ginger' | 'gray';
    number: number;
    age: 'adult' | 'senior';
    location: 'inside' | 'outside';
    label: string;
    isPremium?: boolean; // True for premium avatars, false/undefined for free
    canHoldProducts?: boolean; // True if avatar has corresponding image file for product holding
    norwegianVoiceId?: string;
    dutchVoiceId?: string;
    danishVoiceId?: string;
    swedishVoiceId?: string;
    englishVoiceId?: string;
  }
  
  // Define and export the list of avatars.
  // This is the single source of truth for the entire application.
  export const avatars: Avatar[] = [
    // New Free Avatars (displayed first)
    { id: 26, src: '/avatars/female-blonde-inside-new.mp4', gender: 'female', hair: 'blonde', number: 1, age: 'adult', location: 'inside', label: 'Female Blonde (New)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk', englishVoiceId: '7YaUDeaStRuoYg3FKsmU', canHoldProducts: true },
    { id: 27, src: '/avatars/female-blonde2-inside-new.mp4', gender: 'female', hair: 'blonde', number: 2, age: 'adult', location: 'inside', label: 'Female Blonde 2 (New)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk', englishVoiceId: 'WAhoMTNdLdMoq1j3wf3I' },
    { id: 28, src: '/avatars/female-blonde3-senior-inside-new.mp4', gender: 'female', hair: 'blonde', number: 3, age: 'senior', location: 'inside', label: 'Female Blonde 3 Senior (New)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu', englishVoiceId: 'Qggl4b0xRMiqOwhPtVWT' },
    { id: 29, src: '/avatars/female-blonde4-adult-inside-new.mp4', gender: 'female', hair: 'blonde', number: 4, age: 'adult', location: 'inside', label: 'Female Blonde 4 (New)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk', englishVoiceId: 'jqcCZkN6Knx8BJ5TBdYR', canHoldProducts: true },
    { id: 30, src: '/avatars/female-blonde5-adult-inside-new.mp4', gender: 'female', hair: 'blonde', number: 5, age: 'adult', location: 'inside', label: 'Female Blonde 5 (New)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk', englishVoiceId: 'i4CzbCVWoqvD0P1QJCUL', canHoldProducts: true },
    { id: 31, src: '/avatars/female-brunette-inside-new.mp4', gender: 'female', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Female Brunette (New)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu', englishVoiceId: 'mZ3kbJNnKRWI4YzJXA9j', canHoldProducts: true },
    { id: 32, src: '/avatars/male-brunette-adult-inside-new.mp4', gender: 'male', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Male Brunette 1 (New)', norwegianVoiceId: 'CMVyxPycEkgLpEF85ShA', englishVoiceId: '6OzrBCQf8cjERkYgzSg8', canHoldProducts: true },
    { id: 33, src: '/avatars/male-brunette2-adult-inside-new.mp4', gender: 'male', hair: 'brunette', number: 2, age: 'adult', location: 'inside', label: 'Male Brunette 2 (New)', norwegianVoiceId: '9pRpxWU0T7UFt2oEMH6n', englishVoiceId: 'apOzcbHULxCnvWfHPd41', canHoldProducts: true },
    { id: 34, src: '/avatars/male-brunette3-adult-inside-new.mp4', gender: 'male', hair: 'brunette', number: 3, age: 'adult', location: 'inside', label: 'Male Brunette 3 (New)', norwegianVoiceId: 'xu4HzZYeAR4ynjjVC7cm', englishVoiceId: 'D9Thk1W7FRMgiOhy3zVI', canHoldProducts: true },

    // Female Adults
    { id: 1, src: '/avatars/female-blonde-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 1, age: 'adult', location: 'inside', label: 'Female Blonde 1 (Adult, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk' }, // FREE
    { id: 2, src: '/avatars/female-blonde2-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 2, age: 'adult', location: 'inside', label: 'Female Blonde 2 (Adult, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk', isPremium: true },
    { id: 3, src: '/avatars/female-blonde3-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 3, age: 'adult', location: 'inside', label: 'Female Blonde 3 (Adult, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk', isPremium: true },
    { id: 4, src: '/avatars/female-blonde4-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 4, age: 'adult', location: 'inside', label: 'Female Blonde 4 (Adult, Inside)', isPremium: true },
    { id: 5, src: '/avatars/female-brunette-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Female Brunette 1 (Adult, Inside)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu', isPremium: true },
    { id: 6, src: '/avatars/female-brunette2-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 2, age: 'adult', location: 'inside', label: 'Female Brunette 2 (Adult, Inside)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu', isPremium: true },
    { id: 7, src: '/avatars/female-brunette3-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 3, age: 'adult', location: 'inside', label: 'Female Brunette 3 (Adult, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk', isPremium: true },
    
    // Female Seniors
    { id: 8, src: '/avatars/female-blonde-senior-inside.mp4', gender: 'female', hair: 'blonde', number: 1, age: 'senior', location: 'inside', label: 'Female Blonde (Senior, Inside)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu', dutchVoiceId: 'OlBRrVAItyi00MuGMbna', danishVoiceId: 'ZKutKtutnlbOxDxkNlhk', swedishVoiceId: 'ZSHzpa6aUvhjzShiBmYw', englishVoiceId: 'G4qRCQqs61rS7Xa48jcx', isPremium: true },
    { id: 13, src: '/avatars/female-blond2-senior-inside.mp4', gender: 'female', hair: 'blonde', number: 2, age: 'senior', location: 'inside', label: 'Female Blonde 2 (Senior, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk', dutchVoiceId: 'YUdpWWny7k5yb4QCeweX', danishVoiceId: '4RklGmuxoAskAbGXplXN', swedishVoiceId: 'ydcjeBaRUalXzqZuTB3b', englishVoiceId: 'v8DWAeuEGQSfwxqdH9t2', isPremium: true },
    { id: 14, src: '/avatars/female-blonde3-senior-inside.mp4', gender: 'female', hair: 'blonde', number: 3, age: 'senior', location: 'inside', label: 'Female Blonde 3 (Senior, Inside)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu', dutchVoiceId: 'ANHrhmaFeVN0QJaa0PhL', danishVoiceId: 'ZKutKtutnlbOxDxkNlhk', swedishVoiceId: '4Ct5uMEndw4cJ7q0Jx0l', englishVoiceId: 'OB0Jj6v9DGLLgz8dD57i', isPremium: true },
    { id: 15, src: '/avatars/female-brunette-senior-inside.mp4', gender: 'female', hair: 'brunette', number: 1, age: 'senior', location: 'inside', label: 'Female Brunette (Senior, Inside)', norwegianVoiceId: 'k5IgYJw2jfo6mO5HhagG', dutchVoiceId: 'OlBRrVAItyi00MuGMbna', danishVoiceId: '4RklGmuxoAskAbGXplXN', swedishVoiceId: 'ZSHzpa6aUvhjzShiBmYw', englishVoiceId: 'G4qRCQqs61rS7Xa48jcx', isPremium: true },
    { id: 16, src: '/avatars/female-ginger-senior-inside.mp4', gender: 'female', hair: 'ginger', number: 1, age: 'senior', location: 'inside', label: 'Female Ginger (Senior, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk', dutchVoiceId: 'YUdpWWny7k5yb4QCeweX', danishVoiceId: 'ZKutKtutnlbOxDxkNlhk', swedishVoiceId: 'ydcjeBaRUalXzqZuTB3b', englishVoiceId: 'v8DWAeuEGQSfwxqdH9t2', isPremium: true },
    
    // Male Adults
    { id: 9, src: '/avatars/male-brunette-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Male Brunette 1 (Adult, Inside)', norwegianVoiceId: 'CMVyxPycEkgLpEF85ShA', isPremium: true },
    { id: 10, src: '/avatars/male-brunette2-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 2, age: 'adult', location: 'inside', label: 'Male Brunette 2 (Adult, Inside)', norwegianVoiceId: '9pRpxWU0T7UFt2oEMH6n', isPremium: true },
    { id: 11, src: '/avatars/male-brunette3-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 3, age: 'adult', location: 'inside', label: 'Male Brunette 3 (Adult, Inside)', norwegianVoiceId: 'xu4HzZYeAR4ynjjVC7cm' }, // FREE
    { id: 12, src: '/avatars/male-blonde-adult-inside.mp4', gender: 'male', hair: 'blonde', number: 1, age: 'adult', location: 'inside', label: 'Male Blonde 1 (Adult, Inside)', norwegianVoiceId: 's2xtA7B2CTXPPlJzch1v', isPremium: true },
    
    // Male Seniors
    { id: 17, src: '/avatars/male-blonde-senior-inside.mp4', gender: 'male', hair: 'blonde', number: 1, age: 'senior', location: 'inside', label: 'Male Blonde (Senior, Inside)', norwegianVoiceId: 's2xtA7B2CTXPPlJzch1v', dutchVoiceId: 'G53Wkf3yrsXvhoQsmslL', danishVoiceId: 'ADRrvIX3j1uTFlD5q6DE', swedishVoiceId: 'Hyidyy6OA9R3GpDKGwoZ', englishVoiceId: '1YBpxMFAafA83t7u1xof', isPremium: true },
    { id: 18, src: '/avatars/male-brunette-senior-inside.mp4', gender: 'male', hair: 'brunette', number: 1, age: 'senior', location: 'inside', label: 'Male Brunette 1 (Senior, Inside)', norwegianVoiceId: 'vUmLiNBm6MDcy1NUHaVr', dutchVoiceId: 'eQIVHCAcQuAFeJps0K5l', danishVoiceId: 'xj6X4BCUsv9oxohm1E8o', swedishVoiceId: '1uZ0SLDbZd88cfCPzFQo', englishVoiceId: 'PGoKnSD4gKn2aS99wOR2', isPremium: true },
    { id: 19, src: '/avatars/male-brunette2-senior-inside.mp4', gender: 'male', hair: 'brunette', number: 2, age: 'senior', location: 'inside', label: 'Male Brunette 2 (Senior, Inside)', norwegianVoiceId: 'vUmLiNBm6MDcy1NUHaVr', dutchVoiceId: 'k2lOYklosuhYWH02PIXL', danishVoiceId: 'Hp07ONf6C5qlCKOeB4oo', swedishVoiceId: 'e6OiUVixGLmvtdn2GJYE', englishVoiceId: 'NYkjXRso4QIcgWakN1Cr' }, // FREE
    { id: 20, src: '/avatars/male-gray-senior-inside.mp4', gender: 'male', hair: 'gray', number: 1, age: 'senior', location: 'inside', label: 'Male Gray (Senior, Inside)', norwegianVoiceId: '9pRpxWU0T7UFt2oEMH6n', dutchVoiceId: 'G53Wkf3yrsXvhoQsmslL', danishVoiceId: 'ADRrvIX3j1uTFlD5q6DE', swedishVoiceId: 'Hyidyy6OA9R3GpDKGwoZ', englishVoiceId: '1YBpxMFAafA83t7u1xof', isPremium: true },
    
    // Fantasy Avatars (all premium)
    { id: 21, src: '/avatars/benjamin-franklin-fantasy.mp4', gender: 'fantasy', hair: 'gray', number: 1, age: 'senior', location: 'inside', label: 'Benjamin Franklin', norwegianVoiceId: '9pRpxWU0T7UFt2oEMH6n', dutchVoiceId: 'G53Wkf3yrsXvhoQsmslL', danishVoiceId: 'ADRrvIX3j1uTFlD5q6DE', swedishVoiceId: 'Hyidyy6OA9R3GpDKGwoZ', englishVoiceId: '1YBpxMFAafA83t7u1xof', isPremium: true },
    { id: 22, src: '/avatars/cleopatra-fantasy.mp4', gender: 'fantasy', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Cleopatra', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk', dutchVoiceId: 'YUdpWWny7k5yb4QCeweX', danishVoiceId: '4RklGmuxoAskAbGXplXN', swedishVoiceId: 'ydcjeBaRUalXzqZuTB3b', englishVoiceId: 'v8DWAeuEGQSfwxqdH9t2', isPremium: true },
    { id: 23, src: '/avatars/dracula-fantasy.mp4', gender: 'fantasy', hair: 'brunette', number: 2, age: 'adult', location: 'inside', label: 'Dracula', norwegianVoiceId: 'vUmLiNBm6MDcy1NUHaVr', dutchVoiceId: 'eQIVHCAcQuAFeJps0K5l', danishVoiceId: 'xj6X4BCUsv9oxohm1E8o', swedishVoiceId: '1uZ0SLDbZd88cfCPzFQo', englishVoiceId: 'PGoKnSD4gKn2aS99wOR2', isPremium: true },
    { id: 24, src: '/avatars/roman-soldier-fantasy.mp4', gender: 'fantasy', hair: 'brunette', number: 3, age: 'adult', location: 'inside', label: 'Roman Soldier', norwegianVoiceId: 'CMVyxPycEkgLpEF85ShA', dutchVoiceId: 'G53Wkf3yrsXvhoQsmslL', danishVoiceId: 'ADRrvIX3j1uTFlD5q6DE', swedishVoiceId: 'Hyidyy6OA9R3GpDKGwoZ', englishVoiceId: '1YBpxMFAafA83t7u1xof', isPremium: true },
    { id: 25, src: '/avatars/wizard-fantasy.mp4', gender: 'fantasy', hair: 'gray', number: 2, age: 'senior', location: 'inside', label: 'Wizard', norwegianVoiceId: '9pRpxWU0T7UFt2oEMH6n', dutchVoiceId: 'G53Wkf3yrsXvhoQsmslL', danishVoiceId: 'ADRrvIX3j1uTFlD5q6DE', swedishVoiceId: 'Hyidyy6OA9R3GpDKGwoZ', englishVoiceId: '1YBpxMFAafA83t7u1xof', isPremium: true },
  ];

// Helper function to get avatar gender by ID
export function getAvatarGender(avatarId: number): 'male' | 'female' {
  const avatar = avatars.find(a => a.id === avatarId);
  if (!avatar) return 'female'; // Default to female if not found
  
  // For fantasy avatars, map to appropriate gender for TTS
  if (avatar.gender === 'fantasy') {
    // Map fantasy characters to appropriate voice gender
    switch (avatar.id) {
      case 21: // Benjamin Franklin
      case 23: // Dracula  
      case 24: // Roman Soldier
      case 25: // Wizard
        return 'male';
      case 22: // Cleopatra
        return 'female';
      default:
        return 'male'; // Default fantasy to male
    }
  }
  
  return avatar.gender as 'male' | 'female';
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

// Helper function to check if avatar is available for free users
export function isAvatarFree(avatarId: number): boolean {
  const avatar = avatars.find(a => a.id === avatarId);
  return !avatar?.isPremium; // Free if isPremium is false or undefined
}

// Helper function to get only free avatars
export function getFreeAvatars(): Avatar[] {
  return avatars.filter(avatar => !avatar.isPremium);
}

// Helper function to get only premium avatars
export function getPremiumAvatars(): Avatar[] {
  return avatars.filter(avatar => avatar.isPremium);
}

// Helper function to get avatar FPS by avatar ID
export function getAvatarFps(avatarId: number): number {
  // 30 FPS avatars (Veo3/newer generation)
  const fps30Avatars = [
    // New avatars (all 30 FPS)
    26, 27, 28, 29, 30, 31, 32, 33, 34,
    // Fantasy avatars
    21, 22, 23, 24, 25, // benjamin-franklin, cleopatra, dracula, roman-soldier, wizard
    // Specific newer avatars
    14, // female-blonde3-senior-inside
    17, // male-blonde-senior-inside  
    20, // male-gray-senior-inside
  ];
  
  return fps30Avatars.includes(avatarId) ? 30 : 24;
}

// Helper function to convert avatar video path to image path
export function getAvatarImagePath(avatarVideoSrc: string): string {
  // Convert /avatars/male-brunette2-adult-inside-new.mp4 
  // to /avatar-img/male-brunette2-adult-inside-new.png
  const filename = avatarVideoSrc.split('/').pop()?.replace('.mp4', '.png') || ''
  return `/avatar-img/${filename}`
}

// Helper function to check if avatar can hold products (has corresponding image file)
export function canAvatarHoldProducts(avatarId: number): boolean {
  const avatar = avatars.find(a => a.id === avatarId)
  return avatar?.canHoldProducts || false
}