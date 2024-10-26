import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SVGLibraryManager } from '../lib/svgLibraryUtils';
import { Shape, LibraryData } from '../Types';
import { loadShapesFromGoogleDrive } from '../lib/googleDriveLib';

interface NewLibraryData {
  name: string;
  description: string;
  spreadsheetUrl: string;
  folderUrl: string;
}

interface LoadingProgress {
  currentFile: string;
  loadedFiles: number;
  totalFiles: number;
}

interface LibraryManagerProps {
  activeLibrary: string;
  onLibraryChange: (libraryId: string) => void;
  onUpdateShapes: (shapes: Shape[]) => void;
}

const LibraryManager: React.FC<LibraryManagerProps> = ({
  activeLibrary,
  onLibraryChange,
  onUpdateShapes
}) => {
  const [libraries, setLibraries] = useState<LibraryData[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false);
  const [isNewLibraryDialogOpen, setIsNewLibraryDialogOpen] = useState(false);
  const [newLibrary, setNewLibrary] = useState<NewLibraryData>({
    name: '',
    description: '',
    spreadsheetUrl: '',
    folderUrl: ''
  });


  const handleLoadShapes = useCallback(async (
    libraryId: string,
    spreadsheetUrl: string,
    folderUrl: string
  ) => {
    setLoadingStatus('Preparing to load shapes...');
    setLoadingProgress(null);
    setIsLoadingDialogOpen(true);

    try {
      const shapes = await loadShapesFromGoogleDrive(
        spreadsheetUrl,
        folderUrl,
        handleProgressUpdate
      );

      SVGLibraryManager.addShapesToLibrary(libraryId, shapes);
      setLibraries(SVGLibraryManager.getLibraries());
      setLoadingStatus('Shapes loaded successfully!');

      // If this is the active library, update the shapes immediately
      if (libraryId === activeLibrary) {
        onUpdateShapes(shapes);
      }
    } catch (error) {
      setLoadingStatus(`Error loading shapes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTimeout(() => {
        setIsLoadingDialogOpen(false);
        setLoadingStatus(null);
        setLoadingProgress(null);
      }, 2000);
    }
  }, [activeLibrary, onUpdateShapes]);

  const handleActivateLibrary = useCallback(async (libraryId: string) => {
    setLoadingStatus('Activating library...');
    setIsLoadingDialogOpen(true);

    try {
      const library = SVGLibraryManager.getLibrary(libraryId);
      if (!library) {
        throw new Error('Library not found');
      }

      onLibraryChange(libraryId);
      localStorage.setItem('activeLibrary', libraryId);

      if (library.shapes.length === 0 && library.spreadsheetUrl && library.folderUrl) {
        await handleLoadShapes(libraryId, library.spreadsheetUrl, library.folderUrl);
      } else {
        onUpdateShapes(library.shapes);
      }

      setLoadingStatus('Library activated successfully!');
    } catch (error) {
      setLoadingStatus(`Error activating library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTimeout(() => {
        setIsLoadingDialogOpen(false);
        setLoadingStatus(null);
      }, 2000);
    }
  }, [handleLoadShapes, onUpdateShapes]);

  const handleProgressUpdate = useCallback((progress: LoadingProgress) => {
    setLoadingProgress(progress);
    setLoadingStatus(
      `Loading ${progress.currentFile} (${progress.loadedFiles}/${progress.totalFiles})`
    );
  }, []);

  // Enhanced create library function
  const handleCreateLibrary = useCallback(async () => {
    try {
      setLoadingStatus('Creating new library...');
      setIsLoadingDialogOpen(true);

      // Create the library
      const library = SVGLibraryManager.createLibrary(
        newLibrary.name,
        newLibrary.description
      );

      // Add library to global libraries
      SVGLibraryManager.addLibrary(library);

      if (newLibrary.spreadsheetUrl && newLibrary.folderUrl) {
        // Update library with URLs
        SVGLibraryManager.updateLibrary(library.id, {
          spreadsheetUrl: newLibrary.spreadsheetUrl,
          folderUrl: newLibrary.folderUrl
        });

        // Load shapes from Google Drive
        const shapes = await loadShapesFromGoogleDrive(
          newLibrary.spreadsheetUrl,
          newLibrary.folderUrl,
          handleProgressUpdate
        );

        // Add shapes to library
        SVGLibraryManager.addShapesToLibrary(library.id, shapes);
      }

      // Update local state with fresh libraries list
      const updatedLibraries = SVGLibraryManager.getLibraries();
      setLibraries(updatedLibraries);
      console.log(`Created new library ${library.id}`, updatedLibraries);

      setLoadingStatus('Library created successfully!');
      setIsNewLibraryDialogOpen(false);
      setNewLibrary({
        name: '',
        description: '',
        spreadsheetUrl: '',
        folderUrl: ''
      });

    } catch (error) {
      setLoadingStatus(`Error creating library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTimeout(() => {
        setIsLoadingDialogOpen(false);
        setLoadingStatus(null);
      }, 2000);
    }
  }, [newLibrary, onUpdateShapes]);

  const handleDeleteLibrary = useCallback((libraryId: string) => {
    if (SVGLibraryManager.deleteLibrary(libraryId)) {
      setLibraries(SVGLibraryManager.getLibraries());
    }
  }, []);

  // Load libraries on mount
  useEffect(() => {
    setLibraries(SVGLibraryManager.getLibraries())
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Shape Libraries</h3>
        <Button
          onClick={() => setIsNewLibraryDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Create New Library
        </Button>
      </div>

      {libraries.map(library => (
        <div
          key={library.id}
          className={`p-4 rounded-lg border ${activeLibrary === library.id ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700'
            }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">{library.name}</h3>
              <p className="text-sm text-gray-400">{library.description}</p>
              <p className="text-xs text-gray-500">
                Shapes: {library.shapes.length} •
                Last updated: {new Date(library.lastUpdated).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleActivateLibrary(library.id)}
                disabled={activeLibrary === library.id}
              >
                {activeLibrary === library.id ? 'Active' : 'Activate'}
              </Button>
              {library.id !== 'default' && (
                <Button
                  onClick={() => handleDeleteLibrary(library.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>

          {library.id !== 'default' && library.spreadsheetUrl && library.folderUrl && (
            <div className="mt-4">
              <Button
                onClick={() => handleLoadShapes(
                  library.id,
                  library.spreadsheetUrl!,
                  library.folderUrl!
                )}
                disabled={library.shapes.length > 0}
                className="w-full"
              >
                {library.shapes.length > 0 ? 'Shapes Loaded' : 'Load Shapes'}
              </Button>
            </div>
          )}
          {library.id === 'default' && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 italic">
                Default shapes loaded automatically
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Add this New Library Dialog */}
      <Dialog open={isNewLibraryDialogOpen} onOpenChange={setIsNewLibraryDialogOpen}>
        <DialogContent className="bg-gray-800 border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Library</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new shape library and optionally configure Google Drive integration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Library Name</label>
              <Input
                value={newLibrary.name}
                onChange={(e) => setNewLibrary(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="My Custom Library"
                className="w-full bg-gray-700 text-white border-gray-600 focus:border-blue-500 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Description</label>
              <Input
                value={newLibrary.description}
                onChange={(e) => setNewLibrary(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                placeholder="A collection of custom shapes for..."
                className="w-full bg-gray-700 text-white border-gray-600 focus:border-blue-500 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Google Spreadsheet URL (Optional)
              </label>
              <Input
                value={newLibrary.spreadsheetUrl}
                onChange={(e) => setNewLibrary(prev => ({
                  ...prev,
                  spreadsheetUrl: e.target.value
                }))}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full bg-gray-700 text-white border-gray-600 focus:border-blue-500 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Google Drive Folder URL (Optional)
              </label>
              <Input
                value={newLibrary.folderUrl}
                onChange={(e) => setNewLibrary(prev => ({
                  ...prev,
                  folderUrl: e.target.value
                }))}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full bg-gray-700 text-white border-gray-600 focus:border-blue-500 placeholder-gray-400"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setIsNewLibraryDialogOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateLibrary}
                disabled={!newLibrary.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800 disabled:opacity-50"
              >
                Create Library
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoadingDialogOpen} onOpenChange={setIsLoadingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Library Operation</DialogTitle>
            <DialogDescription>
              {loadingStatus}
              {loadingProgress && (
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(loadingProgress.loadedFiles / loadingProgress.totalFiles) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LibraryManager;