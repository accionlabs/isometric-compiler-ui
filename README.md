# SVG Isometric Shapes Compiler

## Description

The SVG Isometric Shapes Compiler is a web application that allows users to create complex isometric diagrams by combining 3D and 2D SVG shapes. This tool is perfect for designers, architects, and anyone who needs to create detailed isometric illustrations for presentations, documentation, or visual aids.

[Try the demo online](https://bijoor.github.io/isometric-compiler-ui/)

## Features

- Point and click interface for easy shape placement
- Library of pre-defined 3D and 2D SVG shapes
- Ability to combine shapes to create complex isometric diagrams
- Ability to create reusable components
- Google Drive integration for loading custom shape libraries
- Save and load diagram compositions as JSON
- Export diagrams as SVG files
- Customizable canvas size
- Zoom and pan functionality for detailed viewing
- Composition based on attachment points that provides very high accuracy of placement
- Relative positioning of all shapes ensures that changes to shapes in the library retains the diagram consistency

### Using the Application

![Screenshot of the main application interface](./images/ui-shapes.png)

The application interface is divided into three main sections:

1. **Left Panel**: Contains tabs for Shapes, Composition, and Settings.
2. **Main Canvas**: Displays the current diagram composition.
3. **Top Bar**: Provides options for saving, loading, and exporting diagrams.

#### Steps to Create a Diagram:

1. Load your shape library using the Settings tab, or use the default shapes included.
2. Switch to the Shapes tab and add 3D shapes to your canvas.
3. Add new 3D Shapes to connect its attachment point to that of an already placed 3D shape.
4. Select a 3D shape and add 2D shapes to its attachment points as desired.
5. Use the Composition tab to remove 3D or 2D shapes.
5. Fine-tune your diagram using the zoom and pan controls on the canvas.
6. Save your work or export the final SVG using the options in the Settings tab.

![Screenshot of a sample diagram creation process](./images/ui-composition.png)

## Outcomes

Users can achieve the following outcomes:

- Create complex isometric diagrams for architectural layouts, network diagrams, or infographics.
- Design custom shape libraries for specific project needs.
- Collaborate on diagram designs by sharing composition files.
- Export high-quality SVG diagrams for use in presentations or publications.

## Shapes Panel

![Shapes Panel](./images/ui-shapes-panel.png)

The Shapes panel allows you to add new 3D shapes to the composition, and attach 2D shapes to existing 3D shapes.

### Adding 3D Shapes

- To start a new composition, first place a 3D shape by clicking on the Add button next to a 3D shape
- Select a 3D shape in the composition by clicking on it (or selecting it in the Composition panel)
- Choose where a new shape will be attached to the selected 3D Shape by using the "Attach next 3D shape to" buttons. The three attachment sides are Top, Front Left and Front Right. 
    - Choosing Top will place any new 3D shape on top of the selected shape
    - Choosing Front Left will place any new 3D shape to the front and left of the selected shape
    - Choosing Front Right will place any new 3D shape to the front and right of the selected shape
- Add a new 3D shape to the selected shape at the position selected by clicking on the Add button next to a 3D shape

### Adding 2D Shapes

- Select a 3D shape in the composition by clicking on it (or selecting it in the Composition panel)
- Click the Add button next to a 2D shape to add it to a predefined attachment point of the 3D shape
- The predefined attachment point is displayed next to the name of the 2D shape
- Note that the "Attach next 3D shape to" buttons are not used for 2D shapes
- The 2D shape will be attached to the 3D shape only if the 3D shape supports the predefined attachment point.

## Composition Panel

![Composition Panel](./images/ui-composition.png)

The Composition panel allows you to select a 3D shape in the composition and to remove any 3D or 2D shapes from the composition

- To remove a 2D shape attached to a 3D shape, click on the Remove button next to the 2D shape listed in the 3D shape card
- To remove a 3D shape, click on the Remove button on the top right of the 3D shape card
- Note that removing a 3D shape will automatically remove all 2D and 3D shapes that were attached to it

## Settings Panel

![Settings Panel](./images/ui-settings.png)

The Settings panel allows you to configure various aspects of your diagram and the application. Here's a breakdown of the options:

### Canvas Size
- **Width**: Set the width of your canvas in pixels. Default is 1000.
- **Height**: Set the height of your canvas in pixels. Default is 1000.

### Attachemnt Points
- **Hide**: When the checkbox is off, the attachment points are hidden in the SVG Canvas
- **Show**: When the checkbox is on, the attachment points are displayed in the SVG Canvas. 
Please note that attachment points will be visible only if they were designed to be visible in the Shapes library. If the attachment points are designed with no fill or stroke then their visibility will not be affected by this setting.

### Diagram Settings
- **File Name**: Enter the name for your SVG file when saving or downloading. In the example, it's set to "bricks.svg".
- **Folder Path**: Specify the folder path where diagrams will be saved and loaded from. In this case, it's set to "My Diagrams".
Please note that a previous setting provided an option to download the SVG wih the set canvas size, and only on enabling the setting, the SVG was clipped to the contents with a fixed margin. Now this is set as the default.

### Diagram Actions
- **Save Diagram**: Click to save your current diagram composition.
- **Load Diagram**: Click to load a previously saved diagram.
- **Download SVG**: Click to download your diagram as an SVG file.
Please note that in this version only save and load to Google Drive is supported. Download will download the SVG to your local drive.

### Shapes Library Settings
- **Spreadsheet URL**: Enter the URL of the Google Sheets document containing your shapes library index.
- **Folder URL**: Enter the URL of the Google Drive folder containing your SVG shape files.
- **Load Shapes from Google Drive**: Click this button to load your custom shape library from the specified Google Drive locations.

The Settings panel provides crucial functionality for managing your diagrams and customizing the application to suit your needs. It allows you to control the canvas size, manage file operations, and set up your custom shape library, making it an essential part of the SVG Isometric Shapes Compiler workflow.

## Creating Shapes for the Library

### 3D Shapes

3D shapes form the base structure of your isometric diagrams.

#### Creating a 3D Shape

1. Design your shape in an SVG editor (e.g., Inkscape, Adobe Illustrator).
2. Add basic attachment points for each face where other 3D shapes can connect:
   - Use the format: `id="attach-[position]"`
   - Standard positions: `top`, `front-left`, `front-right`, `side-left`, `side-right`
   - Example: `<circle id="attach-top" cx="50" cy="50" r="2" />`
3. Add optional named attachment points for more specific connections:
   - Format: `id="attach-[position]-[name]"`
   - Example: `<circle id="attach-top-center" cx="50" cy="50" r="2" />`
4. Add special attachment points for 2D shapes:
   - Format: `id="attach-[name]"`
   - Example: `<circle id="attach-screen" cx="100" cy="75" r="2" />`

![3D Shape Example Image with various attachment points](./images/3d-attachment-points.png)

### 2D Shapes

2D shapes are flat designs that can be attached to 3D shapes to add details or decorations.

#### Creating a 2D Shape

1. Design your 2D shape in an SVG editor.
2. Add a single attachment point:
   - Use `id="attach-point"` for the 2D shape's attachment point.
   - Example: `<circle id="attach-point" cx="0" cy="0" r="2" />`
3. Design the shape considering the perspective and shear for the face it will attach to (top, front-left, or front-right).

![2D Shape Example Image with attach-point](./images/2d-attachment-points.png)

### Using Attachment Points in Composition

1. For 3D shapes:
   - The application uses the attachment points to determine valid positions for other 3D shapes.
   - You can select which attachment point to use when adding a new 3D shape to your composition.

2. For 2D shapes:
   - 2D shapes can only be attached to specified positions on 3D shapes.
   - The application aligns the 2D shape's `attach-point` with the selected attachment point on the 3D shape.
   - 2D shapes can use optional named attachment points if available on the specified position.
   - Special attachment points (e.g., `attach-screen`) can be used for specific 2D shape placements.

![Composition Example](./images/ui-non-standard-attachments.png)

## Creating the Shape Library Index

To make your shapes available in the application, you need to create an index spreadsheet.

### Spreadsheet Structure

Create a Google Sheets document with the following columns:

1. `name`: A unique identifier for the shape
2. `svgFile`: The filename of the SVG file (must match the file in your Google Drive folder)
3. `type`: Either "3D" or "2D"
4. `attachTo`: For 2D shapes, specify where it can attach ("top", "front-left", "front-right", or a special attachment point like "screen")

### Example Index Spreadsheet

| name          | svgFile           | type | attachTo    |
|---------------|-------------------|------|-------------|
| microservice  | microservice.svg  | 3D   |             |
| monitor       | monitor.svg       | 3D   |             |
| process       | process.svg       | 2D   | top         |
| grill-left    | grill-left.svg    | 2D   | front-left  |
| bits-on-screen| bits-on-screen.svg| 2D   | screen      |

### Best Practices

1. Consistency: Keep your attachment points and naming conventions consistent across shapes.
2. Testing: Test your shapes in the application to ensure they behave as expected in compositions.
3. Optimization: Ensure your SVG files are optimized and don't contain unnecessary elements or layers.
4. Documentation: Consider adding comments in your SVG files to document special attachment points.

By following these guidelines, you can create a rich library of 3D and 2D shapes that can be combined to create complex and detailed isometric diagrams with precise control over shape placement and connections.

## Contributing

We welcome contributions to improve the SVG Isometric Shapes Compiler! Here's how you can contribute:

1. Fork the repository on GitHub.
2. Clone your forked repository to your local machine.
3. Create a new branch for your feature or bug fix.
4. Make your changes and commit them with clear, descriptive messages.
5. Push your changes to your fork on GitHub.
6. Create a pull request from your fork to the main repository.

## Code Structure

The project structure is as follows:

```
.
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── Accordion.tsx
│   │       ├── Button.tsx
│   │       ├── Checkbox.tsx
│   │       ├── Dialog.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       └── ToggleGroup.tsx
│   ├── lib/
│   │   ├── diagramComponentsLib.ts
│   │   ├── googleDriveLib.ts
│   │   ├── svgUtils.ts
│   │   └── utils.ts
│   ├── panels/
│   │   ├── CompositionPanel.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── ShapesPanel.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── ImprovedLayout.tsx
│   ├── SVGDisplay.tsx
│   ├── DiagramComponentsDisplay.tsx
│   ├── Types.ts
│   ├── config.ts
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/
├── dist/
├── index.html
└── various configuration files
```

Key files and their roles:

- `src/App.tsx`: The main application component that manages the overall state and composition of the application.
- `src/ImprovedLayout.tsx`: Defines the layout of the application, including the panel structure and SVG display area.
- `src/SVGDisplay.tsx`: Handles the rendering and interaction with the SVG canvas where the isometric diagram is displayed.
- `src/DiagramComponentsDisplay.tsx`: Displays the current components in the diagram.
- `src/Types.ts`: Contains TypeScript type definitions used throughout the application.
- `src/config.ts`: Holds configuration settings for the application.

- `src/components/ui/`: Contains reusable UI components like buttons, dialogs, and form elements.

- `src/lib/`:
  - `diagramComponentsLib.ts`: Contains functions for manipulating diagram components.
  - `googleDriveLib.ts`: Handles integration with Google Drive API for loading and saving diagrams.
  - `svgUtils.ts`: Utility functions for SVG manipulation and processing.
  - `utils.ts`: General utility functions used across the application.

- `src/panels/`:
  - `CompositionPanel.tsx`: Manages the composition of 3D and 2D shapes in the diagram.
  - `SettingsPanel.tsx`: Handles application settings and diagram export options.
  - `ShapesPanel.tsx`: Displays available shapes and allows adding them to the diagram.

- `index.html`: The main HTML file that serves as the entry point for the application.
- `vite.config.ts`, `tsconfig.json`, etc.: Configuration files for the build process and TypeScript compilation.

This structure follows a modular approach, separating concerns into different components and utility files. The `src/components/ui/` directory contains reusable UI components, while `src/panels/` contains the main functional areas of the application. The `src/lib/` directory houses utility functions and core logic for diagram manipulation and integration with external services.

### Development Workflow

1. Choose an issue to work on or create a new one for your proposed feature/fix.
2. Create a new branch for your work.
3. Develop and test your changes locally.
4. Ensure your code follows the project's coding standards and practices.
5. Update documentation as necessary.
6. Create a pull request with a clear description of your changes.

## Acknowledgements

This project was made possible through the innovation engineering expertise provided by Accion Labs. Their commitment to pushing the boundaries of technology and fostering creative solutions has been instrumental in the development of the SVG Isometric Shapes Compiler.

We extend our sincere gratitude to the team at Accion Labs for their support, guidance, and contributions to this project.