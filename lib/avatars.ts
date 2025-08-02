// lib/avatars.ts

// Define a strict type for what an Avatar object looks like.
export interface Avatar {
    id: number;
    src: string;
    gender: 'male' | 'female';
    hair: 'blonde' | 'brunette';
    number: number;
    age: 'adult' | 'senior';
    location: 'inside' | 'outside';
    label: string;
    norwegianVoiceId?: string; // Specific voice ID for Norwegian language
  }
  
  // Define and export the list of avatars.
  // This is the single source of truth for the entire application.
  export const avatars: Avatar[] = [
    { id: 1, src: '/avatars/female-blonde-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 1, age: 'adult', location: 'inside', label: 'Female Blonde 1 (Adult, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk' },
    { id: 2, src: '/avatars/female-blonde2-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 2, age: 'adult', location: 'inside', label: 'Female Blonde 2 (Adult, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk' },
    { id: 3, src: '/avatars/female-blonde3-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 3, age: 'adult', location: 'inside', label: 'Female Blonde 3 (Adult, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk' },
    { id: 4, src: '/avatars/female-blonde4-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 4, age: 'adult', location: 'inside', label: 'Female Blonde 4 (Adult, Inside)' },
    { id: 5, src: '/avatars/female-brunette-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Female Brunette 1 (Adult, Inside)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu' },
    { id: 6, src: '/avatars/female-brunette2-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 2, age: 'adult', location: 'inside', label: 'Female Brunette 2 (Adult, Inside)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu' },
    { id: 7, src: '/avatars/female-brunette3-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 3, age: 'adult', location: 'inside', label: 'Female Brunette 3 (Adult, Inside)', norwegianVoiceId: 'b3jcIbyC3BSnaRu8avEk' },
    { id: 8, src: '/avatars/female-blonde-senior-inside.mp4', gender: 'female', hair: 'blonde', number: 1, age: 'senior', location: 'inside', label: 'Female Blonde (Senior, Inside)', norwegianVoiceId: 'uNsWM1StCcpydKYOjKyu' },
    { id: 9, src: '/avatars/male-brunette-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Male Brunette 1 (Adult, Inside)', norwegianVoiceId: 'CMVyxPycEkgLpEF85ShA' },
    { id: 10, src: '/avatars/male-brunette2-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 2, age: 'adult', location: 'inside', label: 'Male Brunette 2 (Adult, Inside)', norwegianVoiceId: '9pRpxWU0T7UFt2oEMH6n' },
    { id: 11, src: '/avatars/male-brunette3-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 3, age: 'adult', location: 'inside', label: 'Male Brunette 3 (Adult, Inside)', norwegianVoiceId: 'xu4HzZYeAR4ynjjVC7cm' },
    { id: 12, src: '/avatars/male-blonde-adult-inside.mp4', gender: 'male', hair: 'blonde', number: 1, age: 'adult', location: 'inside', label: 'Male Blonde 1 (Adult, Inside)', norwegianVoiceId: 's2xtA7B2CTXPPlJzch1v' },
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