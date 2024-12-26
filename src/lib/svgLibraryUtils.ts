// @/lib/svgLibraryUtils.ts

import { Shape, LibraryData } from '../Types';
import { defaultShapesLibrary } from './defaultShapesLib';
import { cleanSVG } from './svgUtils';

export interface LibrarySource {
  type: 'googledrive' | 'local';
  googleDrive?: {
    spreadsheetUrl: string;
    folderUrl: string;
  };
  local?: {
    indexFilename: string;
    svgFilenames: string[];
  };
}

export interface ExtendedLibraryData extends LibraryData {
  source?: LibrarySource;
}

export class SVGLibraryManager {
  private static readonly STORAGE_KEY = 'svgLibraries';
  private static readonly DEFAULT_LIBRARY: ExtendedLibraryData = {
    id: 'default',
    name: 'Default Library',
    description: 'Default system library',
    shapes: [],  // Will be populated with loaded shapes
    lastUpdated: new Date(),
    source: {
      type: 'local',
      local: {
        indexFilename: 'index.csv',
        svgFilenames: defaultShapesLibrary.map(shape => shape.svgFile || '')
      }
    }
  };

  private static ensureDefaultLibrary(libraries: ExtendedLibraryData[]): ExtendedLibraryData[] {
    const defaultLibrary = libraries.find(lib => lib.id === 'default');
    if (!defaultLibrary) {
      libraries.unshift({ ...this.DEFAULT_LIBRARY });
    }
    return libraries;
  }

  static async initializeDefaultLibrary(): Promise<void> {
    try {
      // Load default shapes
      const loadedShapes = await Promise.all(
        defaultShapesLibrary.map(async (shape) => {
          try {
            const response = await fetch(`./shapes/${shape.svgFile}`);
            const svgContent = await response.text();
            return { ...shape, svgContent };
          } catch (error) {
            console.error(`Error loading shape ${shape.name}:`, error);
            return shape;
          }
        })
      );

      // Update default library with loaded shapes
      const libraries = this.getLibraries();
      const defaultLibrary = libraries.find(lib => lib.id === 'default');
      if (defaultLibrary) {
        defaultLibrary.shapes = loadedShapes;
        defaultLibrary.lastUpdated = new Date();
        this.saveLibraries(libraries);
      }
    } catch (error) {
      console.error('Error initializing default library:', error);
    }
  }

  static getLibraries(): ExtendedLibraryData[] {
    try {
      const savedLibraries = localStorage.getItem(this.STORAGE_KEY);
      let libraries: ExtendedLibraryData[] = savedLibraries
        ? JSON.parse(savedLibraries)
        : [];

      // Ensure default library exists
      libraries = this.ensureDefaultLibrary(libraries);

      return libraries;
    } catch (error) {
      console.error('Error loading libraries:', error);
      return this.ensureDefaultLibrary([]);
    }
  }

  static saveLibraries(libraries: ExtendedLibraryData[]): void {
    try {
      // Ensure default library exists before saving
      const updatedLibraries = this.ensureDefaultLibrary(libraries);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedLibraries));
    } catch (error) {
      console.error('Error saving libraries:', error);
    }
  }

  static getLibrary(libraryId: string): ExtendedLibraryData | null {
    const libraries = this.getLibraries();
    return libraries.find(lib => lib.id === libraryId) || null;
  }

  static async getCleanLibrary(libraryId: string): Promise<ExtendedLibraryData | null> {
    const library = this.getLibrary(libraryId);
    if (library && library.shapes) {
      for (let i = 0; i < library.shapes.length; i++) {
        try {
          library.shapes[i].svgContent = await cleanSVG(library.shapes[i].svgContent);
        } catch (error) {
          console.error(`Error cleaning shape ${library.shapes[i].name}:`, error);
        }
      }
    }
    return library;
  }

  static createLibrary(
    libraryData: {
      name: string;
      description: string;
      source: {
        type: 'googledrive' | 'local';
        googleDrive?: {
          spreadsheetUrl: string;
          folderUrl: string;
        };
        local?: {
          indexFilename: string;
          svgFilenames: string[];
        };
      };
    }
  ): ExtendedLibraryData {
    return {
      id: `lib-${Date.now()}`,
      name: libraryData.name,
      description: libraryData.description,
      shapes: [],
      lastUpdated: new Date(),
      source: libraryData.source
    };
  }

  static addLibrary(library: ExtendedLibraryData): ExtendedLibraryData[] {
    const libraries = this.getLibraries();
    libraries.push(library);
    this.saveLibraries(libraries);
    return libraries;
  }

  static updateLibrary(libraryId: string, updates: Partial<ExtendedLibraryData>): void {
    const libraries = this.getLibraries();
    const updatedLibraries = libraries.map(lib => {
      if (lib.id === libraryId) {
        return {
          ...lib,
          ...updates,
          lastUpdated: new Date()
        };
      }
      return lib;
    });
    this.saveLibraries(updatedLibraries);
  }

  static deleteLibrary(libraryId: string): boolean {
    if (libraryId === 'default') {
      return false;
    }
    const libraries = this.getLibraries();
    const updatedLibraries = libraries.filter(lib => lib.id !== libraryId);
    this.saveLibraries(updatedLibraries);
    return true;
  }

  static addShapesToLibrary(libraryId: string, shapes: Shape[]): void {
    const libraries = this.getLibraries();
    const updatedLibraries = libraries.map(lib => {
      if (lib.id === libraryId) {
        return {
          ...lib,
          shapes,
          lastUpdated: new Date()
        };
      }
      return lib;
    });
    this.saveLibraries(updatedLibraries);
  }

  static validateLibraryData(library: any): boolean {
    return (
      typeof library.id === 'string' &&
      typeof library.name === 'string' &&
      typeof library.description === 'string' &&
      Array.isArray(library.shapes) &&
      library.shapes.every((shape: any) => (
        typeof shape.name === 'string' &&
        typeof shape.type === 'string' &&
        ['2D', '3D'].includes(shape.type) &&
        typeof shape.svgContent === 'string'
      )) &&
      (!library.source || (
        typeof library.source.type === 'string' &&
        ['googledrive', 'local'].includes(library.source.type)
      ))
    );
  }

  // New method to process local CSV and SVG files
  static async processLocalFiles(
    indexContent: string,
    svgFiles: Map<string, string>,
    onProgress?: (current: number, total: number) => void
  ): Promise<Shape[]> {
    const shapes: Shape[] = [];
    const rows = indexContent.split('\n');

    // Skip header row and process each entry
    const dataRows = rows.slice(1).filter(row => row.trim());
    const total = dataRows.length;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i].trim();
      if (!row) continue;

      const [name, svgFile, type, attachTo] = row.split(',').map(s => s.trim());
      const svgContent = svgFiles.get(svgFile);

      if (svgContent) {
        shapes.push({
          name,
          type: type as '2D' | '3D',
          attachTo,
          svgFile,
          svgContent
        });
      }

      if (onProgress) {
        onProgress(i + 1, total);
      }
    }

    return shapes;
  }

  // Export library data to a downloadable format
  static exportLibrary(libraryId: string): string {
    const library = this.getLibrary(libraryId);
    if (!library) {
      throw new Error('Library not found');
    }

    return JSON.stringify({
      ...library,
      // Exclude sensitive data if needed
      source: undefined
    });
  }

  // Import library from uploaded file
  static async importLibrary(libraryData: string): Promise<boolean> {
    try {
      const library = JSON.parse(libraryData);
      if (!this.validateLibraryData(library)) {
        throw new Error('Invalid library data format');
      }

      const libraries = this.getLibraries();
      if (libraries.some(lib => lib.id === library.id)) {
        throw new Error('Library with this ID already exists');
      }

      libraries.push({
        ...library,
        lastUpdated: new Date()
      });

      this.saveLibraries(libraries);
      return true;
    } catch (error) {
      console.error('Error importing library:', error);
      return false;
    }
  }

  // Helper method to read file contents
  static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}