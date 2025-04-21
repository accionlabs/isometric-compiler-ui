import React, { useState } from "react";
import { Input } from "@/components/ui/Input"; // Using shadcn-styled Input component
import { Badge } from "@/components/ui/Badge"; // Assuming Badge is used for chips
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react"; // Icon for the close button

type ChipProps = {
  currentValue: string[];
  handleNewSkill: (updatedSkills: string[]) => void;
  id: string;
  label: string;
  placeholder?: string; 
};

const ChipInput: React.FC<ChipProps> = ({
  currentValue,
  handleNewSkill,
  id,
  label
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddChip = () => {
    if (inputValue.trim() && !currentValue.includes(inputValue.trim())) {
      handleNewSkill([...currentValue, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemoveChip = (chip: string) => {
    handleNewSkill(currentValue.filter((item) => item !== chip));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Input
          id={id}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddChip();
            }
          }}
          placeholder={`Add ${label} and press Enter`}
          aria-label={`Add ${label}`}
          className="flex-1"
        />
        <Button type="button" onClick={handleAddChip}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {currentValue.map((chip, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center space-x-1 px-2 py-1"
          >
            <span>{chip}</span>
            <button
              type="button"
              className="ml-1 text-white"
              onClick={() => handleRemoveChip(chip)}
            >
              <X className="w-4 h-4" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default React.memo(ChipInput);
