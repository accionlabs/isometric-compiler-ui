import { DiagramComponent } from './Types';

type ShortcutAction = {
    key: string;
    modifierKey: boolean;
    description: string;
    action: () => void;
};

export const createKeyboardShortcuts = (
    saveDiagram: () => Promise<void>,
    remove3DShape: (id: string | null) => void,
    cut3DShape: (id: string | null) => void,
    copy3DShape: (id : string | null) => void,
    paste3DShape: (id: string | null) => void,
    cancelClipboard: (id: string | null) => void,
    selected3DShape: string | null,
    diagramComponents: DiagramComponent[],
    selectedPosition: string,
    selectedAttachmentPoint: string | null,
) => {
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

    const shortcuts: ShortcutAction[] = [
        {
            key: 's',
            modifierKey: true,
            description: `${isMac ? '⌘' : 'Ctrl'}+S: Save diagram`,
            action: () => {
                console.log('Saving diagram');
                saveDiagram();
            }
        },
        {
            key: 'Backspace',
            modifierKey: false,
            description: `${isMac ? '⌫' : 'Delete'}: Remove selected 3D shape`,
            action: () => {
                if (selected3DShape) {
                    console.log('Removing selected 3D shape:', selected3DShape);
                    remove3DShape(selected3DShape);
                } else {
                    console.log('No 3D shape selected for removal');
                }
            }
        },
        {
            key: 'x',
            modifierKey: true,
            description: `${isMac ? '⌘' : 'Ctrl'}+X: Cut selected 3D shape`,
            action: () => {
                if (selected3DShape) {
                    console.log('Cutting selected 3D shape:', selected3DShape);
                    cut3DShape(selected3DShape);
                } else {
                    console.log('No 3D shape selected for cutting');
                }
            }
        },
        {
            key: 'c',
            modifierKey: true,
            description: `${isMac ? '⌘' : 'Ctrl'}+V: Cut selected 3D shape`,
            action: () => {
                if (selected3DShape) {
                    console.log('Copying selected 3D shape:', selected3DShape);
                    copy3DShape(selected3DShape);
                } else {
                    console.log('No 3D shape selected for cutting');
                }
            }
        },
        {
            key: 'v',
            modifierKey: true,
            description: `${isMac ? '⌘' : 'Ctrl'}+V: Paste cut 3D shape`,
            action: () => {
                if (selected3DShape) {
                    paste3DShape(null);
                } else {
                    console.log('No 3D shape selected for pasting');
                }
            }
        },
        {
            key: 'Escape',
            modifierKey: false,
            description: `Cancel Cut or Copy`,
            action: () => {
                cancelClipboard(null);
            }
        },
    ];

    const handleKeyDown = (event: KeyboardEvent) => {
        const modifierKeyPressed = isMac ? event.metaKey : event.ctrlKey;
        console.log('Handling key down:', event.key, 'Modifier:', modifierKeyPressed);

        const matchingShortcut = shortcuts.find(
            shortcut =>
                shortcut.key.toLowerCase() === event.key.toLowerCase() &&
                shortcut.modifierKey === modifierKeyPressed
        );

        if (matchingShortcut) {
            console.log('Matched shortcut:', matchingShortcut.description);
            event.preventDefault();
            matchingShortcut.action();
        }
    };

    return {
        shortcuts,
        handleKeyDown
    };
};