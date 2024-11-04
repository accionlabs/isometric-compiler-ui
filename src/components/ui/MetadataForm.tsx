import React from 'react';
import { Input } from '@/components/ui/Input';
import { RadixSelect } from '@/components/ui/Select';
import { MetadataField } from '@/Types';

interface MetadataFormProps {
  fields: MetadataField[];
  values: { [key: string]: any };
  onChange: (values: { [key: string]: any }) => void;
}

const MetadataForm: React.FC<MetadataFormProps> = ({ fields, values, onChange }) => {
  const handleFieldChange = (name: string, value: any) => {
    onChange({
      ...values,
      [name]: value
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.type === 'select' ? (
            <RadixSelect
              options={field.options?.map(opt => ({
                value: opt.value,
                label: opt.label
              })) || []}
              value={values[field.name] || ''}
              onChange={(value) => handleFieldChange(field.name, value)}
            />
          ) : (
            <Input
              type="text"
              value={values[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full bg-gray-700 text-white border-gray-600"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default MetadataForm;