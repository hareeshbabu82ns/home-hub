export interface ExerciseImage {
  male: string | null;
  female: string | null;
  mid?: string;
  fid?: string;
}

export interface ExerciseAnimation {
  female: string | null;
  female_id?: string;
  male: string | null;
  male_id?: string;
}

export interface ExerciseSingleAnimation {
  female: string | null;
  female_id?: string;
  male: string | null;
  male_id?: string;
}

export interface ExerciseLocalImages {
  [key: string]: string; // Format: "image_1": "/path/to/image_1.jpg", "image_2": "/path/to/image_2.jpg", etc.
}

export interface ExerciseCreateInput {
  exerciseId: number;
  title: string;
  titleRaw: string;
  img?: ExerciseImage;
  imgPng?: ExerciseImage;
  anim?: ExerciseAnimation;
  singleAnim?: ExerciseSingleAnimation;
  permalink?: string;
  type?: string;
  tags?: string;
  isCardio?: boolean;
  isNewEx?: boolean;
  presetNotes?: string;
  isPersonalPresetNote?: boolean;
  isYoga?: boolean;
  sanskrit?: string;
  sanskritRaw?: string;
  alignmentCues?: string;
  commonName?: string;
  eet?: string;
  isYogaPremium?: boolean;
  audio?: string;
  isFav?: boolean;
  equipment?: string;
  primaryMuscles?: string;
  secondaryMuscles?: string;
  instructions?: string;
}

export interface ExerciseFilterParams {
  search?: string;
  type?: string;
  tags?: string;
  equipment?: string;
  primaryMuscles?: string;
  secondaryMuscles?: string;
  isCardio?: boolean;
  isYoga?: boolean;
  isFav?: boolean;
  limit?: number;
  offset?: number;
}
