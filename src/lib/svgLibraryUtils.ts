import { Shape, LibraryData } from '../Types';
import { defaultShapesLibrary } from './defaultShapesLib';

export class SVGLibraryManager {
  private static readonly STORAGE_KEY = 'svgLibraries';
  private static readonly DEFAULT_LIBRARY: LibraryData = {
    id: 'default',
    name: 'Default Library',
    description: 'Default system library',
    shapes: defaultShapesLibrary,
    lastUpdated: new Date()
  };

  static getLibraries(): LibraryData[] {
    try {
      const savedLibraries = localStorage.getItem(this.STORAGE_KEY);
      if (!savedLibraries) {
        return [this.DEFAULT_LIBRARY];
      }
      return JSON.parse(savedLibraries);
    } catch (error) {
      console.error('Error loading libraries:', error);
      return [this.DEFAULT_LIBRARY];
    }
  }

  static saveLibraries(libraries: LibraryData[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(libraries));
    } catch (error) {
      console.error('Error saving libraries:', error);
    }
  }

  static getLibrary(libraryId: string): LibraryData | null {
    const libraries = this.getLibraries();
    return libraries.find(lib => lib.id === libraryId) || null;
  }

  static createLibrary(name: string, description: string): LibraryData {
    return {
      id: `lib-${Date.now()}`,
      name,
      description,
      shapes: [],
      lastUpdated: new Date()
    };
  }

  static addLibrary(library: LibraryData): LibraryData[] {
    const libraries = this.getLibraries();
    libraries.push(library);
    this.saveLibraries(libraries);
    return libraries;
  }

  static updateLibrary(libraryId: string, updates: Partial<LibraryData>): void {
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

  static activateLibrary(libraryId: string): Shape[] {
    const library = this.getLibrary(libraryId);
    if (!library) {
      throw new Error('Library not found');
    }
    return library.shapes;
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

  static getShapesFromLibrary(libraryId: string): Shape[] {
    if (libraryId === 'default') {
      return defaultShapesLibrary;
    }
    const library = this.getLibrary(libraryId);
    return library?.shapes || [];
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
      ))
    );
  }

  static exportLibrary(libraryId: string): string {
    const library = this.getLibrary(libraryId);
    if (!library) {
      throw new Error('Library not found');
    }
    return JSON.stringify(library);
  }

  static importLibrary(libraryData: string): boolean {
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

  static mergeLibraries(targetLibraryId: string, sourceLibraryId: string): boolean {
    const targetLibrary = this.getLibrary(targetLibraryId);
    const sourceLibrary = this.getLibrary(sourceLibraryId);

    if (!targetLibrary || !sourceLibrary) {
      return false;
    }

    // Create a map of existing shapes in target library
    const existingShapes = new Map(targetLibrary.shapes.map(shape => [shape.name, shape]));

    // Add new shapes from source library
    sourceLibrary.shapes.forEach(shape => {
      if (!existingShapes.has(shape.name)) {
        targetLibrary.shapes.push(shape);
      }
    });

    this.updateLibrary(targetLibraryId, { shapes: targetLibrary.shapes });
    return true;
  }
}