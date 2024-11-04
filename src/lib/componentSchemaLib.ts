import { SchemaDefinition, ComponentType, ComponentTypes, MetadataField } from '../Types';
import { parse as parseYaml } from 'yaml';

const DEFAULT_SCHEMA: SchemaDefinition = {
    componentTypes: {
        basic: {
            displayName: "Basic Component",
            fields: [
                {
                    name: "name",
                    type: "string",
                    label: "Name",
                    required: false
                },
                {
                    name: "description",
                    type: "string",
                    label: "Description",
                    required: false
                }
            ]
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

    private async parseSchema(content: string): Promise<SchemaDefinition | null> {
        try {
            const yamlSchema = parseYaml(content);
            return yamlSchema as SchemaDefinition;
        } catch (yamlError) {
            console.warn('Failed to parse as YAML, attempting JSON parse');
            try {
                return JSON.parse(content) as SchemaDefinition;
            } catch (jsonError) {
                console.error('Failed to parse schema as either YAML or JSON');
                return null;
            }
        }
    }

    private isValidField(field: any): field is MetadataField {
        if (!field || typeof field !== 'object') return false;
        if (!field.name || typeof field.name !== 'string') return false;
        if (!field.type || !['string', 'select'].includes(field.type)) return false;
        if (!field.label || typeof field.label !== 'string') return false;

        if (field.type === 'select') {
            if (!Array.isArray(field.options)) return false;
            for (const option of field.options) {
                if (!option || typeof option !== 'object') return false;
                if (!option.label || typeof option.label !== 'string') return false;
                if (!option.value || typeof option.value !== 'string') return false;
            }
        }

        return true;
    }

    private isValidComponentType(type: unknown): type is ComponentType {
        // First check if it's an object
        if (!type || typeof type !== 'object') return false;

        // Type assertion after object check
        const componentType = type as Record<string, unknown>;

        // Check displayName
        if (!('displayName' in componentType) ||
            typeof componentType.displayName !== 'string') {
            return false;
        }

        // Check fields array
        if (!('fields' in componentType) ||
            !Array.isArray(componentType.fields)) {
            return false;
        }

        // Validate each field
        return componentType.fields.every(field => this.isValidField(field));
    }

    private validateSchema(schema: any): schema is SchemaDefinition {
        if (!schema || typeof schema !== 'object') return false;
        if (!schema.componentTypes || typeof schema.componentTypes !== 'object') return false;

        // Type assertion to help TypeScript understand the structure
        const componentTypes = schema.componentTypes as Record<string, unknown>;

        // Check each component type
        for (const [key, type] of Object.entries(componentTypes)) {
            if (!this.isValidComponentType(type)) {
                console.warn(`Invalid component type definition for: ${key}`);
                return false;
            }
        }

        return true;
    }

    public async loadSchema(schemaUrl: string): Promise<SchemaDefinition> {
        try {
            const response = await fetch(schemaUrl);
            if (!response.ok) {
                console.warn(`Failed to load schema from ${schemaUrl}, using default schema`);
                return this.loadedSchema;
            }

            const content = await response.text();
            const schema = await this.parseSchema(content);

            if (!schema || !this.validateSchema(schema)) {
                console.warn('Invalid schema structure, using default schema');
                return this.loadedSchema;
            }

            // Merge with default schema
            this.loadedSchema = {
                componentTypes: {
                    ...DEFAULT_SCHEMA.componentTypes,
                    ...schema.componentTypes
                }
            };

            return this.loadedSchema;
        } catch (error) {
            console.error('Error loading schema:', error);
            console.warn('Using default schema due to load error');
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