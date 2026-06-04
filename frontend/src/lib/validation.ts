import type { ValidationError } from "@/lib/types";

export function validateNumber(value: unknown, field: string, opts?: { min?: number; max?: number; allowZero?: boolean }){
  if(value === "" || value === null || value === undefined){
    return { field, message: `${field} is required` };
  }
  const num = Number(value);
  if(Number.isNaN(num)){
    return { field, message: `${field} must be a valid number` };
  }
  if(opts?.min !== undefined && num < opts.min){
    return { field, message: `${field} must be at least ${opts.min}` };
  }
  if(opts?.max !== undefined && num > opts.max){
    return { field, message: `${field} must be at most ${opts.max}` };
  }
  if(!opts?.allowZero && num === 0){
    return { field, message: `${field} must be greater than 0` };
  }
  return null;
}

export function validateString(value: unknown, field: string, opts?: { min?: number; max?: number; pattern?: RegExp; allowEmpty?: boolean }){
  if(value === null || value === undefined){
    return { field, message: `${field} is required` };
  }
  const str = String(value).trim();
  if(!opts?.allowEmpty && str === ""){
    return { field, message: `${field} is required` };
  }
  if(opts?.min !== undefined && str.length < opts.min){
    return { field, message: `${field} must be at least ${opts.min} characters` };
  }
  if(opts?.max !== undefined && str.length > opts.max){
    return { field, message: `${field} must be at most ${opts.max} characters` };
  }
  if(opts?.pattern && !opts.pattern.test(str)){
    return { field, message: `${field} contains invalid characters` };
  }
  return null;
}

export function validateDate(value: unknown, field: string){
  if(value === "" || value === null || value === undefined){
    return { field, message: `${field} is required` };
  }
  const d = new Date(String(value));
  if(Number.isNaN(d.getTime())){
    return { field, message: `${field} must be a valid date` };
  }
  if(d > new Date()){
    return { field, message: `${field} cannot be in the future` };
  }
  return null;
}

export function validateEmail(value: unknown){
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return validateString(value, "Email", { pattern: emailPattern, min: 5, max: 254 });
}

export function validatePassword(value: unknown){
  const str = String(value ?? "");
  if(str.length < 8){
    return { field: "Password", message: "Password must be at least 8 characters" };
  }
  if(!/[A-Z]/.test(str)){
    return { field: "Password", message: "Password must contain at least one uppercase letter" };
  }
  if(!/[0-9]/.test(str)){
    return { field: "Password", message: "Password must contain at least one number" };
  }
  return null;
}

export function runValidators(...validators: (ValidationError | null)[]){
  return validators.filter((v): v is ValidationError => v !== null);
}
