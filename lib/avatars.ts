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
  }
  
  // Define and export the list of avatars.
  // This is the single source of truth for the entire application.
  export const avatars: Avatar[] = [
    { id: 1, src: '/avatars/female-blonde-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 1, age: 'adult', location: 'inside', label: 'Female Blonde 1 (Adult, Inside)' },
    { id: 2, src: '/avatars/female-blonde2-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 2, age: 'adult', location: 'inside', label: 'Female Blonde 2 (Adult, Inside)' },
    { id: 3, src: '/avatars/female-blonde3-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 3, age: 'adult', location: 'inside', label: 'Female Blonde 3 (Adult, Inside)' },
    { id: 4, src: '/avatars/female-blonde4-adult-inside.mp4', gender: 'female', hair: 'blonde', number: 4, age: 'adult', location: 'inside', label: 'Female Blonde 4 (Adult, Inside)' },
    { id: 5, src: '/avatars/female-brunette-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Female Brunette 1 (Adult, Inside)' },
    { id: 6, src: '/avatars/female-brunette2-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 2, age: 'adult', location: 'inside', label: 'Female Brunette 2 (Adult, Inside)' },
    { id: 7, src: '/avatars/female-brunette3-adult-inside.mp4', gender: 'female', hair: 'brunette', number: 3, age: 'adult', location: 'inside', label: 'Female Brunette 3 (Adult, Inside)' },
    { id: 8, src: '/avatars/female-blonde-senior-inside.mp4', gender: 'female', hair: 'blonde', number: 1, age: 'senior', location: 'inside', label: 'Female Blonde (Senior, Inside)' },
    { id: 9, src: '/avatars/male-brunette-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 1, age: 'adult', location: 'inside', label: 'Male Brunette 1 (Adult, Inside)' },
    { id: 10, src: '/avatars/male-brunette2-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 2, age: 'adult', location: 'inside', label: 'Male Brunette 2 (Adult, Inside)' },
    { id: 11, src: '/avatars/male-brunette3-adult-inside.mp4', gender: 'male', hair: 'brunette', number: 3, age: 'adult', location: 'inside', label: 'Male Brunette 3 (Adult, Inside)' },
    { id: 12, src: '/avatars/male-blonde-adult-inside.mp4', gender: 'male', hair: 'blonde', number: 1, age: 'adult', location: 'inside', label: 'Male Blonde 1 (Adult, Inside)' },
  ];