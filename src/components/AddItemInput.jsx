// src/components/AddItemInput.jsx
import { useState } from "react";
import Button from "./Button";
import Input from "./Inputs/Input";

export const AddItemInput = ({
  onAdd,
  placeholder = "Add item...",
  buttonText = "Add",
  minLength = 1,
  transform,
  validate,
  value,
  onChange,
}) => {
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");

    // Apply transformation if provided
    const processedValue = transform ? transform(value) : value.trim();

    // Validation
    if (!processedValue || processedValue.length < minLength) {
      setError(
        `Must be at least ${minLength} character${minLength > 1 ? "s" : ""}`
      );
      return;
    }

    if (validate) {
      const validationError = validate(processedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Call the onAdd function
    onAdd();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-base flex-1"
        />
        <Button
          type="submit"
          disabled={!value || !value.trim()}
          className="btn-base btn-md btn-primary font-medium whitespace-nowrap"
        >
          {buttonText}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600 ml-1">{error}</p>}
    </form>
  );
};