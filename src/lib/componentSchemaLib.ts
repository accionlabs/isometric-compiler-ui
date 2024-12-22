// @/lib/componentSchemaLib.ts

import {
    SchemaDefinition,
    ComponentType,
    ComponentTypes,
    MetadataField
} from "../Types";
import { parse as parseYaml } from "yaml";

// Define required default fields that must exist in all component types
const DEFAULT_REQUIRED_FIELDS: MetadataField[] = [
    {
        name: "name",
        type: "string",
        label: "Name",
        required: true
    },
    {
        name: "description",
        type: "string",
        label: "Description",
        required: false
    },
    {
        name: "lastModified",
        type: "string",
        label: "Last Modified",
        required: false
    }
];

const DEFAULT_SCHEMA: SchemaDefinition = {
    componentTypes: {
        basic: {
            displayName: "Component",
            fields: DEFAULT_REQUIRED_FIELDS
        }
    }
};

class SchemaLoader {
    private static instance: SchemaLoader;
    private loadedSchema: SchemaDefinition;

    private constructor() {
        this.loadedSchema = DEFAULT_SCHEMA;
    }

    public static getInstance(): SchemaLoader {
        if (!SchemaLoader.instance) {
            SchemaLoader.instance = new SchemaLoader();
        }
        return SchemaLoader.instance;
    }

    private async parseSchema(
        content: string
    ): Promise<SchemaDefinition | null> {
        try {
            const yamlSchema = parseYaml(content);
            return yamlSchema as SchemaDefinition;
        } catch (yamlError) {
            console.warn("Failed to parse as YAML, attempting JSON parse");
            try {
                return JSON.parse(content) as SchemaDefinition;
            } catch (jsonError) {
                console.error("Failed to parse schema as either YAML or JSON");
                return null;
            }
        }
    }

    private isValidField(field: any): field is MetadataField {
        if (!field || typeof field !== "object") return false;
        if (!field.name || typeof field.name !== "string") return false;
        if (!field.type || !["string", "select"].includes(field.type))
            return false;
        if (!field.label || typeof field.label !== "string") return false;

        if (field.type === "select") {
            if (!Array.isArray(field.options)) return false;
            for (const option of field.options) {
                if (!option || typeof option !== "object") return false;
                if (!option.label || typeof option.label !== "string")
                    return false;
                if (!option.value || typeof option.value !== "string")
                    return false;
            }
        }

        return true;
    }

    private hasRequiredDefaultFields(fields: MetadataField[]): boolean {
        return DEFAULT_REQUIRED_FIELDS.every((defaultField) => {
            const matchingField = fields.find(
                (f) => f.name === defaultField.name
            );
            if (!matchingField) return false;

            // Check if required field properties match
            return (
                matchingField.type === defaultField.type &&
                matchingField.label === defaultField.label &&
                (defaultField.required ? matchingField.required === true : true)
            );
        });
    }

    private ensureRequiredDefaultFields(
        fields: MetadataField[]
    ): MetadataField[] {
        const updatedFields = [...fields];

        DEFAULT_REQUIRED_FIELDS.forEach((defaultField) => {
            const existingFieldIndex = updatedFields.findIndex(
                (f) => f.name === defaultField.name
            );

            if (existingFieldIndex === -1) {
                // Add missing default field
                updatedFields.unshift(defaultField);
            } else {
                // Update existing field to match default requirements
                updatedFields[existingFieldIndex] = {
                    ...updatedFields[existingFieldIndex],
                    type: defaultField.type,
                    label: defaultField.label,
                    required:
                        defaultField.required ||
                        updatedFields[existingFieldIndex].required
                };
            }
        });

        return updatedFields;
    }

    private isValidComponentType(type: unknown): type is ComponentType {
        if (!type || typeof type !== "object") return false;

        const componentType = type as Record<string, unknown>;

        if (
            !("displayName" in componentType) ||
            typeof componentType.displayName !== "string"
        ) {
            return false;
        }

        if (
            !("fields" in componentType) ||
            !Array.isArray(componentType.fields)
        ) {
            return false;
        }

        // Validate each field
        if (!componentType.fields.every((field) => this.isValidField(field))) {
            return false;
        }

        // Validate required default fields
        return this.hasRequiredDefaultFields(componentType.fields);
    }

    private validateAndEnhanceSchema(schema: any): SchemaDefinition | null {
        if (!schema || typeof schema !== "object") return null;
        if (!schema.componentTypes || typeof schema.componentTypes !== "object")
            return null;

        const componentTypes = schema.componentTypes as Record<string, unknown>;
        const enhancedComponentTypes: ComponentTypes = {};

        // Process each component type
        for (const [key, type] of Object.entries(componentTypes)) {
            if (!this.isValidComponentType(type)) {
                console.warn(`Invalid component type definition for: ${key}`);
                const componentType = type as any;

                // Try to fix the component type by adding required fields
                if (
                    componentType.displayName &&
                    Array.isArray(componentType.fields)
                ) {
                    const enhancedFields = this.ensureRequiredDefaultFields(
                        componentType.fields
                    );
                    enhancedComponentTypes[key] = {
                        displayName: componentType.displayName,
                        fields: enhancedFields
                    };
                    console.log(
                        `Enhanced component type ${key} with required fields`
                    );
                } else {
                    return null;
                }
            } else {
                enhancedComponentTypes[key] = type as ComponentType;
            }
        }

        return { componentTypes: enhancedComponentTypes };
    }

    public async loadSchema(schemaUrl: string): Promise<SchemaDefinition> {
        try {
            const response = await fetch(schemaUrl);
            if (!response.ok) {
                console.warn(
                    `Failed to load schema from ${schemaUrl}, using default schema`
                );
                return this.loadedSchema;
            }

            const content = await response.text();
            const schema = await this.parseSchema(content);

            if (!schema) {
                console.warn("Invalid schema structure, using default schema");
                return this.loadedSchema;
            }

            const validatedSchema = this.validateAndEnhanceSchema(schema);
            if (!validatedSchema) {
                console.warn("Schema validation failed, using default schema");
                return this.loadedSchema;
            }

            // Merge with default schema
            this.loadedSchema = {
                componentTypes: {
                    ...DEFAULT_SCHEMA.componentTypes,
                    ...validatedSchema.componentTypes
                }
            };

            return this.loadedSchema;
        } catch (error) {
            console.error("Error loading schema:", error);
            console.warn("Using default schema due to load error");
            return this.loadedSchema;
        }
    }

    public getSchema(): SchemaDefinition {
        return this.loadedSchema;
    }

    public getComponentType(type: string) {
        return this.loadedSchema.componentTypes[type];
    }

    public getAvailableTypes(): string[] {
        return Object.keys(this.loadedSchema.componentTypes);
    }
}

export const schemaLoader = SchemaLoader.getInstance();

export type { SchemaLoader };
