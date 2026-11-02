export interface C64Overrides {
  region?: 'pal' | 'ntsc';
  trueDrive?: boolean;
  virtualDevices?: boolean;
  reu?: number;
  rom?: 'standard' | 'swedish' | 'danish';
}

export interface C64RomFiles { kernal: string; chargen: string }

export interface C64Preferences {
  retroarchConfig?: string;
  global: C64Overrides;
  games: Record<string, C64Overrides>;
  swedish?: C64RomFiles;
  danish?: C64RomFiles;
}

export interface C64Layers {
  retroarchConfig?: string;
  global: C64Overrides;
  game: C64Overrides;
  swedish?: C64RomFiles;
  danish?: C64RomFiles;
}

export interface C64ResolvedValue<T> { value: T | null; source: string }
export interface C64Resolved {
  region: C64ResolvedValue<'pal' | 'ntsc'>;
  trueDrive: C64ResolvedValue<boolean>;
  virtualDevices: C64ResolvedValue<boolean>;
  reu: C64ResolvedValue<number>;
  rom: C64ResolvedValue<'standard' | 'swedish' | 'danish'>;
  warnings: string[];
}
